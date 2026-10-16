import test from 'node:test';import assert from 'node:assert/strict';
import {settleLots,compareOffers,fabricationCost} from './public/business-math.js';
test('Liquidación conserva cada ley y aplica un solo descuento de operación',()=>{
 const r=settleLots(440000,[{gross:12,excluded:2,unit:'g',law:750,payout:90},{gross:1,excluded:0,unit:'castellano',law:999,payout:94}],10000);
 assert.equal(r.net,14.6);assert.ok(Math.abs(r.fine-12.0954)<1e-9);
 assert.ok(Math.abs(r.total-(7.5*440000*.9+4.6*.999*440000*.94-10000))<1e-8);
});
test('Rechaza peso excluido mayor al bruto, unidades desconocidas y descuentos excesivos',()=>{
 const row={gross:10,excluded:0,unit:'g',law:850,payout:90};
 assert.throws(()=>settleLots(440000,[{...row,excluded:10}]));assert.throws(()=>settleLots(440000,[{...row,unit:'oz'}]));assert.throws(()=>settleLots(440000,[row],1e9));assert.throws(()=>settleLots(Infinity,[row]));
});
test('Un mayor porcentaje puede dar un pago neto menor',()=>{
 const r=compareOffers(440000,10,850,[{payout:90,fixed:0,perGram:0},{payout:92,fixed:100000,perGram:0}]);
 assert.equal(r.winner,0);assert.equal(r.difference,25200);assert.equal(r.rows[0].total,3366000);
});
test('El costo por gramo usa material neto, no gramos finos',()=>{
 const r=compareOffers(440000,10,750,[{payout:90,fixed:1000,perGram:500},{payout:90,fixed:6000,perGram:0}]);assert.equal(r.winner,null);assert.equal(r.rows[0].fees,6000);
});
test('Presupuesto distingue margen sobre venta de recargo sobre costo',()=>{
 const r=fabricationCost({price:100, count:2,pieceWeight:10,law:750,loss:0,labor:300,stones:100,extras:100,margin:20});
 assert.equal(r.metal,1500);assert.equal(r.cost,2000);assert.equal(r.sale,2500);assert.equal(r.profit,500);assert.equal(r.unitSale,1250);
});
test('La merma de fabricación se compensa una sola vez',()=>{
 const r=fabricationCost({price:440000,count:40,pieceWeight:3,law:750,loss:2,labor:0,stones:0,extras:0,margin:0});
 assert.equal(r.finished,120);assert.ok(Math.abs(r.prepared*.98-120)<1e-9);assert.equal(r.sale,r.cost);
});
test('No permite márgenes imposibles ni costos negativos',()=>{
 const x={price:100,count:1,pieceWeight:1,law:750,loss:0,labor:0,stones:0,extras:0,margin:10};
 assert.throws(()=>fabricationCost({...x,margin:100}));assert.throws(()=>fabricationCost({...x,count:1.5}));assert.throws(()=>fabricationCost({...x,stones:-10}));assert.throws(()=>fabricationCost({...x,loss:100}));
});
