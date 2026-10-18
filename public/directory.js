export const categories={oro:'Joyerías en oro',plata:'Platerías',esmeraldas:'Joyas con esmeraldas',tejido:'Tejido de manillas en oro'};
export const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
export function publishedBusinesses(data){
 if(!Array.isArray(data?.businesses))throw Error('Directorio no válido');
 return data.businesses.filter(b=>b.status==='published'&&typeof b.name==='string'&&b.name.trim()&&typeof b.local==='string'&&b.local.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(b.updatedOn)&&Array.isArray(b.categories)&&b.categories.length&&b.categories.every(c=>Object.hasOwn(categories,c))&&Array.isArray(b.services)&&b.services.every(s=>typeof s==='string'));
}
export function searchBusinesses(rows,{query='',category=''}={}){
 const words=normalize(query).split(' ').filter(Boolean);
 return rows.filter(b=>(!category||b.categories.includes(category))&&words.every(word=>normalize([b.name,b.local,...b.categories.map(c=>categories[c]),...b.services].join(' ')).includes(word)));
}
export function contactLinks(b){
 const phone=typeof b.phone==='string'?b.phone.replace(/[\s()-]/g,''):'';
 const whatsapp=typeof b.whatsapp==='string'?b.whatsapp.replace(/[\s+()-]/g,''):'';
 return {phone:/^\+?\d{7,15}$/.test(phone)?'tel:'+phone:null,whatsapp:/^\d{10,15}$/.test(whatsapp)?'https://wa.me/'+whatsapp:null};
}
export async function loadDirectory(fetcher=fetch){const r=await fetcher('/directory-data.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('No se pudo cargar el directorio');const data=await r.json();return {...data,businesses:publishedBusinesses(data)}}
const stop=new Set('minery dime dame el la los las un una unos unas de del en donde que quien quienes me mi por para con y hay puedo encontrar encuentro busco buscar necesito quiero venden vende hacen hace numero telefono whatsapp contacto local locales queda esta joyeria joyerias plateria platerias taller talleres tejen tejer tejido tejidos manilla manillas pulsera pulseras oro plata esmeralda esmeraldas anillo anillos cadena cadenas dije dijes san andresito principal cc'.split(' '));
export function directoryIntent(message){
 const q=normalize(message);
 if(/\b(vender|vendo|venda|compran|comprador|compradores)\b/.test(q)&&/\boro\b/.test(q))return {pending:true};
 const lookup=/\b(donde|local|locales|telefono|numero|whatsapp|contacto|busco|buscar|encuentro|encontrar|quien|quienes|plateria|platerias|joyeria|joyerias)\b/.test(q);
 if(!lookup)return null;
 const wanted=[];
 if(/\b(tej\w*|manillas?|pulseras?)\b/.test(q)&&/\b(tej\w*)\b/.test(q))wanted.push('tejido');
 if(/\b(plata|plateria|platerias)\b/.test(q))wanted.push('plata');
 if(/\besmeraldas?\b/.test(q))wanted.push('esmeraldas');
 if(!wanted.length&&/\boro\b/.test(q))wanted.push('oro');
 return {categories:wanted,words:q.split(' ').filter(w=>!stop.has(w))};
}
export function directoryAnswer(message,rows){
 const intent=directoryIntent(message);if(!intent)return null;
 if(intent.pending)return {answer:'La búsqueda de compradores de oro de origen minero está pendiente de definición en Minery. Por ahora no ofrecemos contactos ni intermediamos esa compra.',businesses:[]};
 const matches=rows.filter(b=>intent.categories.every(c=>b.categories.includes(c))&&intent.words.every(w=>normalize([b.name,b.local,...b.services].join(' ')).includes(w)));
 if(!matches.length)return {answer:'Todavía no tenemos un local publicado que coincida con tu búsqueda en el C. C. San Andresito Principal. Estamos reuniendo los datos de joyerías, platerías, joyas con esmeraldas y talleres de tejido de manillas en oro. No tengo un teléfono ni un número de local confirmado para darte.',businesses:[]};
 const shown=matches.slice(0,5);
 return {answer:shown.map(b=>`${b.name} · Local ${b.local}. Servicios: ${b.services.join(', ')}. ${b.phone?'Teléfono: '+b.phone+'. ':''}Datos actualizados: ${b.updatedOn}.`).join('\n\n')+(matches.length>5?'\n\nHay más resultados en el directorio.':'')+'\n\nConfirma disponibilidad, plazo y precio directamente con el negocio.',businesses:shown};
}
