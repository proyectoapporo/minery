const OUNCE = 31.1034768;
export function normalizeQuote(data, now = Date.now(), expectedCurrency = 'COP') {
  const price = Number(data.price), timestamp = Number(data.timestamp) * 1000;
  if (data.metal !== 'XAU' || data.currency !== expectedCurrency || !(price > 0) || !Number.isFinite(price) || !Number.isFinite(timestamp) || timestamp < 946684800000 || timestamp > now + 300000) throw new Error('INVALID_QUOTE');
  if (data.unit && data.unit !== 'troy_ounce') throw new Error('INVALID_UNIT');
  return {source:'GoldAPI.io',currency:expectedCurrency,metal:'XAU',ounce:price,gram:price / OUNCE,quotedAt:new Date(timestamp).toISOString(),stale:now-timestamp>15*60000};
}
export function createQuoteHandler({env=process.env,fetcher=fetch,now=()=>Date.now()}={}) {
  let cache = null, cachedAt = 0, pending = null;
  return async function handler(event) {
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    const respond=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
    if(event.httpMethod!=='GET')return {...respond(405,{error:'Método no permitido.'}),headers:{...headers,Allow:'GET'}};
    if(!env.GOLDAPI_KEY)return respond(503,{code:'NOT_CONFIGURED',error:'La cotización automática no está disponible: falta configurar el proveedor en el servidor. El administrador debe revisar GOLDAPI_KEY en Netlify.'});
    const ttl=Math.max(60,Number(env.QUOTE_CACHE_SECONDS)||300)*1000;
    if(cache&&now()-cachedAt<ttl)return respond(200,{...cache,stale:now()-Date.parse(cache.quotedAt)>15*60000,refreshSeconds:ttl/1000});
    try {
      if(!pending)pending=(async()=>{const r=await fetcher('https://www.goldapi.io/api/price/XAU/COP',{headers:{'x-access-token':env.GOLDAPI_KEY,'Accept':'application/json'},signal:AbortSignal.timeout(10000)});if(!r.ok){const error=new Error('UPSTREAM_ERROR');error.status=r.status;throw error}const q=normalizeQuote(await r.json(),now());cache=q;cachedAt=now();return q})().finally(()=>{pending=null});
      const quote=await pending;return respond(200,{...quote,refreshSeconds:ttl/1000});
    }catch(error){if(error.status===429)return respond(503,{code:'QUOTA_OR_RATE_LIMIT',error:'El proveedor alcanzó un límite de consultas. El administrador debe revisar el cupo de GoldAPI.'});if([401,403].includes(error.status))return respond(503,{code:'PROVIDER_ACCESS',error:'El proveedor rechazó el acceso a la cotización. El administrador debe revisar la clave y el plan de GoldAPI.'});return respond(502,{code:'SOURCE_UNAVAILABLE',error:'No se pudo obtener una cotización válida. No se actualizaron los precios.'})}
  };
}
export const handler=createQuoteHandler();
