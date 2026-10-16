import test from 'node:test';
import assert from 'node:assert/strict';
import {materialWeight,quoteMessage} from './public/materials.js';
test('Chapa convierte mm cúbicos a cm cúbicos',()=>assert.equal(materialWeight({shape:'sheet',length:10,width:10,thickness:10,density:19.32}).grams,19.32));
test('Hilo y argolla conservan el volumen geométrico',()=>{assert.ok(Math.abs(materialWeight({shape:'wire',length:100,diameter:2,density:10}).grams-Math.PI)<1e-12);assert.ok(Math.abs(materialWeight({shape:'ring',diameter:18,width:4,thickness:2,density:15}).grams-Math.PI*20*2*4/1000*15)<1e-12)});
test('Rechaza medidas inválidas, infinito y desbordamiento',()=>{for(const length of ['',-1,'abc',Infinity,1e308])assert.throws(()=>materialWeight({shape:'sheet',length,width:100,thickness:100,density:15}));assert.throws(()=>materialWeight({shape:'other',density:15}))});
test('Mensaje conserva referencia y no permite vigencias imposibles',()=>{const s={id:'MIN-1',date:'16/10/2026',title:'Pedido',total:'100 COP',rows:[['Metal','80 COP']],explanation:'Estimación',reference:'90 COP/g'};assert.match(quoteMessage(s,{client:'Ana\nHola'}),/Ana Hola/);assert.match(quoteMessage(s),/90 COP\/g/);assert.throws(()=>quoteMessage(s,{validity:1.5}));assert.throws(()=>quoteMessage(s,{validity:31}))});
