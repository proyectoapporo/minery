import test from 'node:test';
import assert from 'node:assert/strict';
import {readOperations,operationsCsv} from './public/history.js';
test('Historial corrupto o inaccesible no bloquea la calculadora',()=>{
  assert.deepEqual(readOperations({getItem:()=>'{'}),[]);
  assert.deepEqual(readOperations({getItem:()=>{throw Error()}}),[]);
  assert.deepEqual(readOperations({getItem:()=>'{"foo":1}'}),[]);
});
test('Historial conserva solo registros válidos y limita el tamaño',()=>{
  const row={at:'2026-10-16T12:00:00Z',type:'Compra',detail:'Ley 850',result:'COP 100'};
  const rows=readOperations({getItem:()=>JSON.stringify([null,...Array(201).fill(row)])});
  assert.equal(rows.length,200);assert.equal(rows[0].type,'Compra');
});
test('CSV protege fórmulas, separadores y comillas',()=>{
  const csv=operationsCsv([{at:'2026-10-16T12:00:00Z',type:'=1+1',detail:'Ley; "850"',result:'100'}]);
  assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"Ley; ""850"""'));
});
