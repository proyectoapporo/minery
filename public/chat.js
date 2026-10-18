import {loadDirectory,directoryIntent,directoryAnswer,contactLinks} from './directory.js';
const $=id=>document.getElementById(id);
let history=[],ready=false,busy=false,generation=0;
let directoryRows=null;
const directoryLoaded=loadDirectory().then(data=>{directoryRows=data.businesses}).catch(()=>{});
function state(text){$('chat-status').textContent=text;$('chat-send').disabled=busy}
function entry(who,text){const box=document.createElement('article');box.className='chat-entry';const heading=document.createElement('h3');heading.textContent=who;const body=document.createElement('p');body.textContent=text;box.append(heading,body);$('chat-log').append(box);return box}
function addEvidence(box,data){
 if(data.sources?.length){const list=document.createElement('ul');for(const s of data.sources){let url;try{url=new URL(s.url);if(url.protocol!=='https:')continue}catch{continue}const li=document.createElement('li'),a=document.createElement('a');a.href=url.href;a.textContent=s.title;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li)}const h=document.createElement('h4');h.textContent='Fuentes consultadas';box.append(h,list)}
 if(data.quote){const p=document.createElement('p');const date=new Date(data.quote.quotedAt);p.textContent=`Referencia GoldAPI.io: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(data.quote.gram)}/g fino · ${Number.isNaN(date.getTime())?'fecha no disponible':date.toLocaleString('es-CO',{timeZone:'America/Bogota'})}${data.quote.stale?' · Dato antiguo: verifica antes de negociar.':''}. No es una oferta de compra.`;box.append(p)}
 if(data.calculations?.length){const details=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent='Datos y resultado del cálculo';p.textContent=JSON.stringify(data.calculations,null,2);details.append(summary,p);box.append(details)}
}
async function check(){try{const r=await fetch('/.netlify/functions/assistant',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();ready=d.enabled===true&&d.configured===true;state(ready?'Puedes preguntar. Las respuestas se generan con IA y fuentes de Minery.':'Puedes buscar locales y servicios del directorio. El asistente educativo con IA está en preparación.')}catch{state('Puedes consultar el directorio. No se pudo comprobar la conexión del asistente educativo.')}}
$('chat-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const message=$('chat-message').value.trim();if(!message)return;const token=generation;entry('Tú',message);$('chat-message').value='';busy=true;state('Consultando la base de Minery…');try{
 if(directoryIntent(message)){
  await directoryLoaded;
  if(token!==generation)return;
  const data=directoryRows===null?{answer:'No pude cargar el directorio. Intenta de nuevo recargando la página; no tengo un local ni un teléfono confirmado para darte.',businesses:[]}:directoryAnswer(message,directoryRows);
  const box=entry('Minery',data.answer);
  for(const b of data.businesses){const links=contactLinks(b);for(const [key,label] of [['phone','Llamar'],['whatsapp','WhatsApp']]){if(!links[key])continue;const a=document.createElement('a');a.href=links[key];a.textContent=label+' · '+b.name;a.className='secondary';if(key==='whatsapp'){a.target='_blank';a.rel='noopener noreferrer'}box.append(a)}}
  const a=document.createElement('a');a.href='directorio.html';a.textContent='Abrir directorio →';box.append(a);state('Consulta del directorio lista.');return;
 }
 if(!ready){entry('Minery','El asistente educativo con IA no está disponible en este momento. Puedes buscar un negocio, preguntar dónde tejen manillas en oro o consultar platerías y joyas con esmeraldas.');state('Las búsquedas del directorio siguen disponibles.');return}
 const r=await fetch('/.netlify/functions/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history:history.slice(-4)}),signal:AbortSignal.timeout(35000)});const data=await r.json();if(token!==generation)return;if(!r.ok)throw Error(data.error||'No pude responder en este momento.');if(typeof data.answer!=='string')throw Error('No recibí una respuesta válida.');addEvidence(entry('Minery',data.answer),data);history.push({role:'user',content:message.slice(0,1500)},{role:'assistant',content:data.answer.slice(0,1500)});history=history.slice(-4);state('Respuesta lista. Puedes continuar o consultar otra herramienta.')}catch(err){if(token===generation){entry('Minery',err.name==='TimeoutError'?'La consulta tardó demasiado. Intenta de nuevo.':err.message);state('No se completó la consulta. Puedes volver a intentarlo.')}}finally{busy=false;$('chat-send').disabled=false;$('chat-message').focus()}};
$('chat-clear').onclick=()=>{generation++;history=[];$('chat-log').replaceChildren();state(ready?'Conversación limpiada.':'Puedes consultar locales y servicios del directorio.')};
document.querySelectorAll('[data-question]').forEach(button=>button.onclick=()=>{$('chat-message').value=button.dataset.question;$('chat-message').focus()});
check();

const initialQuestion=new URLSearchParams(location.search).get("q");if(initialQuestion)$("chat-message").value=initialQuestion.slice(0,2000);

