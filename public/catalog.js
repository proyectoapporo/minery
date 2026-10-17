export function normalize(text){return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
export function searchArticles(items,{query='',topic='',favoritesOnly=false,favorites=[]}={}){
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return items.filter(a=>(!topic||a.topic_id===topic)&&(!favoritesOnly||favorites.includes(a.id))&&words.every(w=>normalize([a.title,a.body,...a.terms].join(' ')).includes(w)));
}
export function readFavorites(storage){try{const v=JSON.parse(storage.getItem('minery.favorites')||'[]');return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&x.length<100))].slice(0,100):[]}catch{return []}}
