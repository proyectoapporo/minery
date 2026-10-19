const endpoint='/.netlify/functions/business';
let activeShop=null,writeBusy=false,liveRequest=null;
async function api(action,payload){
 const response=await fetch(endpoint,{method:action?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:action?{'Content-Type':'application/json'}:{},...(action?{body:JSON.stringify({action,payload})}:{}),signal:AbortSignal.timeout(25000)});
 let body;try{body=await response.json()}catch{throw Error('El servidor no entregó una respuesta válida. Conserva los datos y vuelve a intentar.')}
 if(!response.ok){if(response.status===401)showLogin(body.error);const error=new Error(body.error||'No se completó la operación.');error.status=response.status;throw error}return body;
}
function useState(state){activeShop=state.shopId;data=state;data.products=data.products.map(p=>({...p,weight:Number(p.weight),qty:Number(p.qty),cost:p.cost===null?null:Number(p.cost),price:Number(p.price)}));data.sales=data.sales.map(s=>({...s,items:s.items.map(i=>({...i,weight:Number(i.weight),price:Number(i.price),qty:Number(i.qty),cost:i.cost===null?null:Number(i.cost)}))}));}
async function liveCommand(action,payload){
 if(writeBusy)throw Error('Hay una operación en curso. Espera a que termine.');
 const signature=JSON.stringify({action,payload,shopId:activeShop});
 if(liveRequest&&liveRequest.signature!==signature)throw Error('Hay una operación anterior por confirmar. Reinténtala con los mismos datos antes de iniciar otra.');
 liveRequest??={signature,key:uid(),action,payload:structuredClone(payload)};writeBusy=true;
 try{const result=await api(action,{...payload,shopId:activeShop,requestKey:liveRequest.key});const state=await api();useState(state);liveRequest=null;$('recover-operation').hidden=true;return result}
 catch(error){if(error.status&&error.status!==401&&error.status<500)liveRequest=null;$('recover-operation').hidden=!liveRequest;throw error}
 finally{writeBusy=false}
}
function showLogin(message){$('business-shell').hidden=true;$('access-screen').hidden=false;$('login-form').hidden=false;$('onboard-form').hidden=true;$('access-status').textContent=message||'Entra con tu cuenta del comercio.';}
async function loadBusiness(){const state=await api();if(state.onboarding){$('access-screen').hidden=false;$('business-shell').hidden=true;$('login-form').hidden=true;$('onboard-form').hidden=false;$('access-status').textContent='Tu cuenta está lista. Crea el primer almacén.';return}useState(state);$('access-screen').hidden=true;$('business-shell').hidden=false;go('home');}
async function logout(){try{await api('logout',{});cart=[];liveRequest=null;activeShop=null;data={products:[],sales:[],movements:[],store:{}};$('main').replaceChildren();showLogin('Sesión cerrada.')}catch(error){toast(error.message)}}
async function startLive(){
 $('recover-operation').onclick=async()=>{const saved=liveRequest;if(!saved)return;try{const result=await liveCommand(saved.action,saved.payload);if(saved.action==='sale'){cart=[];selectedSale=result.saleId;go('documents')}else go(page);toast('Operación confirmada sin duplicados.')}catch(error){toast(error.message)}};

 $('login-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;const values=Object.fromEntries(new FormData(e.target));try{await api('login',values);e.target.reset();await loadBusiness()}catch(error){$('access-status').textContent=error.message}finally{button.disabled=false}};
 $('onboard-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const profile={name:new FormData(e.target).get('name'),legal:'',nit:'',phone:'',address:'',city:'',email:'',warranty:''};await api('create_shop',{profile});await loadBusiness()}catch(error){$('access-status').textContent=error.message}finally{button.disabled=false}};
 try{const r=await fetch(endpoint+'?status=1',{cache:'no-store'});const status=await r.json();if(!status.enabled){$('access-status').textContent='El módulo está preparado. Falta habilitar la base de Minery y configurar el servidor; las cuentas reales aún no están activas.';return}await loadBusiness()}catch(error){if(error.status!==401)$('access-status').textContent=error.message}
}

function applyRole(){
 const role=data.role,canStock=['owner','warehouse'].includes(role),canSell=['owner','seller'].includes(role);
 for(const id of ['product-open','import-open'])if($(id))$(id).disabled=!canStock;
 document.querySelectorAll('[data-resolve]').forEach(b=>b.disabled=!canStock);
 document.querySelectorAll('[data-add],[data-go="sale"]').forEach(b=>b.disabled=!canSell);
 const settingsForm=$('settings-form');if(settingsForm)settingsForm.querySelectorAll('input,textarea,button[type="submit"],button.primary').forEach(b=>b.disabled=role!=='owner');
 const saleForm=$('sale-form');if(saleForm)saleForm.querySelectorAll('input,select,button').forEach(b=>b.disabled=!canSell);
}
