// Read-only deployment check: no login, sales, customers or inventory writes.
const origin=process.argv[2];
if(!origin||!/^https:\/\/[^/]+$/.test(origin)){console.error('Uso: node scripts/check-business-deployment.mjs https://dominio-del-modulo');process.exit(1)}
const endpoint=origin+'/.netlify/functions/business';
async function read(url,options={}){const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),...options});const text=await response.text();let body;try{body=JSON.parse(text)}catch{}return {response,body,text}}
try{
 const status=await read(endpoint+'?status=1');
 if(status.response.status!==200||typeof status.body?.enabled!=='boolean')throw Error('La función business no está desplegada correctamente. HTTP '+status.response.status);
 if(!status.body.enabled)throw Error('La función existe, pero falta activar/configurar las variables del servidor.');
 const anonymous=await read(endpoint);
 if(anonymous.response.status!==401)throw Error('La ruta privada no devolvió 401 sin sesión. HTTP '+anonymous.response.status);
 const csrf=await read(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.invalid'},body:JSON.stringify({action:'settings',payload:{}})});
 if(csrf.response.status!==403)throw Error('La comprobación de origen no pasó. HTTP '+csrf.response.status);
 const ui=await read(origin+'/negocios-app.html');
 if(ui.response.status!==200||!ui.text.includes('id="login-form"'))throw Error('La pantalla de acceso no está publicada.');
 console.log('PASS: función configurada, acceso privado sin sesión bloqueado, origen ajeno rechazado y pantalla de inicio disponible.');
 console.log('Pendiente: entrar con la cuenta real y probar venta, inventario, reintentos e impresión.');
}catch(error){console.error('NO ACTIVADO: '+error.message);process.exitCode=1}
