import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedBusinesses,searchBusinesses,directoryAnswer,directoryIntent,contactLinks} from './public/directory.js';
// Synthetic fixtures; these businesses are never published in directory-data.json.
const silver={name:'Platería Prueba',local:'TEST-1',status:'published',updatedOn:'2026-10-18',categories:['plata','esmeraldas'],services:['Anillos y cadenas con esmeraldas'],phone:'+573000000000',whatsapp:'573000000000'};
const weaving={...silver,name:'Taller Prueba',local:'TEST-2',categories:['oro','tejido'],services:['Tejido de manillas en oro']};
const rows=[silver,weaving];
test('Manilla queries return only registered weaving specialists',()=>{
 for(const q of ['Minery dime en qué local me tejen una manilla','¿Dónde tejen pulseras en oro?','¿Quién hace tejidos de manillas en oro?'])assert.deepEqual(directoryAnswer(q,rows).businesses,[weaving]);
});
test('Silver and emerald searches retain accents and combined specialties',()=>{
 assert.deepEqual(searchBusinesses(rows,{query:'plateria',category:'esmeraldas'}),[silver]);
 assert.deepEqual(directoryAnswer('¿Dónde venden anillos con esmeraldas?',rows).businesses,[silver]);
 assert.deepEqual(directoryAnswer('Busco plata con esmeraldas',rows).businesses,[silver]);
 assert.deepEqual(searchBusinesses(rows,{query:'TEST-2',category:'plata'}),[]);
});
test('Specific business contact and missing names never substitute another local',()=>{
 assert.deepEqual(directoryAnswer('Dame el teléfono de Platería Prueba',rows).businesses,[silver]);
 const none=directoryAnswer('Dame el teléfono de Joyería Inexistente',rows);assert.deepEqual(none.businesses,[]);assert.doesNotMatch(none.answer,/573000000000/);
 assert.match(directoryAnswer('¿Dónde tejen manillas?',[]).answer,/Todavía no tenemos/);
});
test('Only published complete records and safe contact links can be used',()=>{
 assert.deepEqual(publishedBusinesses({businesses:[silver,{...weaving,status:'draft'},{...silver,local:''},{...silver,categories:['comprador']}]}),[silver]);
 assert.deepEqual(contactLinks({phone:'javascript:alert(1)',whatsapp:'https://evil.example'}),{phone:null,whatsapp:null});
 assert.equal(contactLinks(silver).whatsapp,'https://wa.me/573000000000');
});
test('Mining gold buyers remain pending; education does not trigger directory',()=>{
 assert.equal(directoryIntent('¿Qué significa plata 925?'),null);
 assert.equal(directoryIntent('¿Cómo cuidar una esmeralda?'),null);
 const data=directoryAnswer('Tengo 20 gramos de oro puro, dónde lo puedo vender',rows);assert.equal(data.businesses.length,0);assert.match(data.answer,/pendiente/);
});
