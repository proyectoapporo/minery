import {categories,loadDirectory,searchBusinesses,contactLinks} from './directory.js';
const $=id=>document.getElementById(id);
let rows=[];
function render(){
 const matches=searchBusinesses(rows,{query:$('directory-query').value,category:$('directory-category').value});
 $('directory-status').textContent=`${matches.length} ${matches.length===1?'local publicado':'locales publicados'}.`;
 $('directory-results').replaceChildren();
 if(!matches.length){const p=document.createElement('p');p.className='empty-card';p.textContent=rows.length?'No hay coincidencias. Prueba con otro nombre, local o categoría.':'Estamos reuniendo los primeros locales. Aún no hay negocios publicados ni contactos confirmados. Puedes explorar las especialidades y preparar tu consulta.';$('directory-results').append(p);return}
 for(const b of matches){
  const card=document.createElement('article');card.className='knowledge-card';const tag=document.createElement('span');tag.className='tag';tag.textContent=b.categories.map(c=>categories[c]).join(' · ');
  const h=document.createElement('h3');h.textContent=b.name;const p=document.createElement('p');p.textContent=`Local ${b.local} · ${b.services.join(' · ')}`;const date=document.createElement('p');date.textContent=`Datos actualizados: ${b.updatedOn}${b.hours?' · Horario: '+b.hours:''}`;card.append(tag,h,p,date);
  const links=contactLinks(b);for(const [key,label] of [['phone','Llamar'],['whatsapp','Consultar por WhatsApp']]){if(!links[key])continue;const a=document.createElement('a');a.href=links[key];a.textContent=label;if(key==='whatsapp'){a.target='_blank';a.rel='noopener noreferrer'}card.append(a)}
  $('directory-results').append(card);
 }
}
const params=new URLSearchParams(location.search);$('directory-query').value=params.get('q')||'';if(Object.hasOwn(categories,params.get('category')))$('directory-category').value=params.get('category');
$('directory-search').onsubmit=e=>{e.preventDefault();render()};$('directory-query').addEventListener('input',render);$('directory-category').addEventListener('change',render);
$('directory-reset').onclick=()=>{$('directory-query').value='';$('directory-category').value='';render();$('directory-query').focus()};
try{rows=(await loadDirectory()).businesses;render()}catch{$('directory-status').textContent='No pudimos cargar los locales. Recarga la página para intentarlo de nuevo.';$('directory-results').textContent='El directorio no está disponible en este momento.'}
