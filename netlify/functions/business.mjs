import {randomUUID} from 'node:crypto';
const PROJECT='https://qktnueimdaokppysqqts.supabase.co';
const COOKIE='minery_business';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie, Origin'};
const reply=(statusCode,data,cookie)=>({statusCode,headers:{...headers,...(cookie?{'Set-Cookie':cookie}:{})},body:JSON.stringify(data)});
const messages={SHOP_FORBIDDEN:'No tienes acceso a este almacén.',ROLE_FORBIDDEN:'Tu usuario no tiene permiso para esta operación.',INSUFFICIENT_STOCK:'La pieza ya no tiene saldo suficiente. Actualiza el inventario.',IDEMPOTENCY_CONFLICT:'Este identificador ya pertenece a otra operación. Revisa el resultado antes de reintentar.',ALREADY_RESOLVED:'Este pendiente ya fue resuelto. Actualiza la vista.',INVALID_SALE:'Revisa los datos de la venta.',INVALID_ENTRY:'Completa costo, proveedor y documento de entrada.'};
export function createBusinessHandler({env=process.env,fetcher=fetch}={}){
 return async event=>{
  const origin=env.MINERY_BUSINESS_ORIGIN,base=env.SUPABASE_URL?.replace(/\/$/,'');
  const configured=env.MINERY_BUSINESS_ENABLED==='true'&&base===PROJECT&&Boolean(env.SUPABASE_SERVICE_ROLE_KEY)&&Boolean(origin&&/^https:\/\/[^/]+$/.test(origin));
  const requestHeaders=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),v]));
  const setCookie=(token,age)=>`${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/.netlify/functions/business; Max-Age=${age}`;
  if(event.httpMethod==='GET'&&event.queryStringParameters?.status==='1')return reply(200,{enabled:configured});
  if(!configured)return reply(503,{error:'El módulo está preparado, pero falta activar la conexión de Minery.',code:'NOT_CONFIGURED'});
  if(!['GET','POST'].includes(event.httpMethod))return reply(405,{error:'Método no permitido.'});
  let action='state',payload={};
  if(event.httpMethod==='POST'){
   if(requestHeaders.origin!==origin)return reply(403,{error:'Origen no permitido.'});
   if(!/^application\/json(?:;|$)/i.test(requestHeaders['content-type']||'')||event.isBase64Encoded||typeof event.body!=='string'||Buffer.byteLength(event.body)>3000000)return reply(400,{error:'Solicitud no válida o demasiado grande.'});
   try{const b=JSON.parse(event.body);action=b.action;payload=b.payload??{};if(!['login','logout','create_shop','products','sale','resolve','settings'].includes(action)||!payload||typeof payload!=='object'||Array.isArray(payload))throw Error()}catch{return reply(400,{error:'Solicitud no válida.'})}
  }
  const call=async(path,body,token)=>{
   const res=await fetcher(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+(token||env.SUPABASE_SERVICE_ROLE_KEY)},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
   let data;try{data=await res.json()}catch{data={}}return {res,data};
  };
  try{
   if(action==='login'){
    if(typeof payload.email!=='string'||payload.email.length>254||typeof payload.password!=='string'||payload.password.length>200)return reply(400,{error:'Escribe correo y contraseña.'});
    const {res,data}=await call('/auth/v1/token?grant_type=password',{email:payload.email,password:payload.password});
    if(!res.ok||typeof data.access_token!=='string')return reply(res.status===429?429:401,{error:res.status===429?'Demasiados intentos. Intenta más tarde.':'No fue posible iniciar sesión. Revisa tus datos.'});
    return reply(200,{ok:true},setCookie(data.access_token,Math.min(3600,Number(data.expires_in)||3600)));
   }
   if(action==='logout')return reply(200,{ok:true},setCookie('',0));
   let token;try{token=decodeURIComponent((requestHeaders.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'')}catch{}
   if(!token)return reply(401,{error:'Inicia sesión para acceder a tu almacén.'});
   const auth=await call('/auth/v1/user',null,token);
   if(!auth.res.ok||typeof auth.data.id!=='string'||auth.data.is_anonymous===true)return reply(401,{error:'La sesión venció. Inicia sesión nuevamente.'},setCookie('',0));
   if(['products','sale','resolve','settings'].includes(action)&&!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(payload.requestKey||''))return reply(400,{error:'Falta el identificador de la operación.'});
   const {res,data}=await call('/rest/v1/rpc/minery_business_dispatch',{p_actor:auth.data.id,p_action:action,p_payload:payload});
   if(!res.ok){const message=Object.keys(messages).find(k=>String(data.message).includes(k));return reply(data.code==='42501'?403:['23505','23514'].includes(data.code)?409:400,{error:message?messages[message]:data.code==='23505'?'La referencia ya existe. Revisa las piezas antes de volver a ingresarlas.':'No se completó la operación. Revisa los datos y actualiza la vista.',code:data.code,requestId:randomUUID()})}
   return reply(200,data);
  }catch{return reply(503,{error:'No se pudo contactar la base de Minery. Conserva la operación y vuelve a intentarlo con el mismo identificador.'})}
 };
}
export const handler=createBusinessHandler();
