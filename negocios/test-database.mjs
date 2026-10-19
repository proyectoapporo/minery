import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const module=process.env.PGLITE_TEST_MODULE?pathToFileURL(process.env.PGLITE_TEST_MODULE).href:'@electric-sql/pglite';
const {PGlite}=await import(module);const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('00000000-0000-4000-a000-000000000001'),('00000000-0000-4000-a000-000000000002'),('00000000-0000-4000-a000-000000000003');`);
await db.exec(await readFile(new URL('../database/negocios.sql',import.meta.url),'utf8'));
const actor='00000000-0000-4000-a000-000000000001',other='00000000-0000-4000-a000-000000000002',seller='00000000-0000-4000-a000-000000000003';let sequence=0;
const key=()=>`10000000-0000-4000-a000-${String(++sequence).padStart(12,'0')}`;
async function rpc(actor,action,payload={}){await db.exec('set role service_role');try{return (await db.query('select public.minery_business_dispatch($1::uuid,$2,$3::jsonb) as result',[actor,action,JSON.stringify(payload)])).rows[0].result}finally{await db.exec('reset role')}}
const a=await rpc(actor,'create_shop',{profile:{name:'Prueba A',nit:'Ficticio'}}),b=await rpc(other,'create_shop',{profile:{name:'Prueba B'}});
assert.equal((await rpc(actor,'create_shop',{profile:{name:'No duplicar'}})).shopId,a.shopId);
await assert.rejects(rpc(other,'state',{shopId:a.shopId}),/SHOP_FORBIDDEN/);
const piece={ref:'PL-TEST',name:'Anillo',material:'Plata',law:'925',weight:4.8,qty:1,cost:100,price:200};
await rpc(actor,'products',{products:[piece],requestKey:key()});let state=await rpc(actor,'state'),pid=state.products[0].id;
const request={requestKey:key(),client:'Ficticio',payment:'Efectivo',items:[{productId:pid,qty:1,price:250}]};
const sale=await rpc(actor,'sale',request),repeat=await rpc(actor,'sale',request);assert.equal(repeat.saleId,sale.saleId);
state=await rpc(actor,'state');assert.equal(state.products[0].qty,0);assert.equal(state.sales.length,1);assert.equal(state.sales[0].total,250);
await assert.rejects(rpc(actor,'sale',{...request,client:'Otro'}),/IDEMPOTENCY_CONFLICT/);
await assert.rejects(rpc(actor,'sale',{...request,requestKey:key()}),/INSUFFICIENT_STOCK/);
const pendingRequest={requestKey:key(),client:'Cliente provisional',payment:'Transferencia',items:[{...piece,ref:'PL-PEND',qty:2,price:220}]};
const sold=await rpc(actor,'sale',pendingRequest);state=await rpc(actor,'state');assert.equal(state.sales.length,2);assert.equal(state.sales[1].items[0].pending,true);
const resolution={requestKey:key(),saleId:sold.saleId,index:0,cost:110,provider:'Proveedor ficticio',document:'TEST-01'};
await rpc(actor,'resolve',resolution);await rpc(actor,'resolve',resolution);
state=await rpc(actor,'state');assert.equal(state.sales[1].items[0].pending,false);assert.equal(state.products.find(p=>p.ref==='PL-PEND').qty,0);assert.equal(state.movements.length,1);
await assert.rejects(rpc(actor,'resolve',{...resolution,requestKey:key()}),/ALREADY_RESOLVED/);
await rpc(actor,'settings',{requestKey:key(),profile:{name:'Nombre nuevo'}});state=await rpc(actor,'state');assert.equal(state.sales[0].store.name,'Prueba A');assert.equal(state.store.name,'Nombre nuevo');
// Transaction rollback: first provisional item must disappear if the second line is invalid.
await assert.rejects(rpc(actor,'sale',{requestKey:key(),client:'Rollback',payment:'Efectivo',items:[{...piece,ref:'ROLLBACK'}, {productId:pid,qty:1,price:20}]}),/INSUFFICIENT_STOCK/);
state=await rpc(actor,'state');assert.equal(state.products.some(p=>p.ref==='ROLLBACK'),false);assert.equal(state.sales.length,2);
await db.query('insert into minery_business.members(shop_id,user_id,role) values($1,$2,$3)',[a.shopId,seller,'seller']);
assert.equal((await rpc(seller,'state')).shopId,a.shopId);
await assert.rejects(rpc(seller,'settings',{requestKey:key(),profile:{name:'No autorizado'}}),/ROLE_FORBIDDEN/);
await assert.rejects(rpc(seller,'resolve',{...resolution,requestKey:key()}),/ROLE_FORBIDDEN/);
await db.query('update minery_business.members set active=false where user_id=$1',[seller]);await assert.rejects(rpc(seller,'state',{shopId:a.shopId}),/SHOP_FORBIDDEN/);
for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select * from minery_business.products'),/permission denied/);await assert.rejects(db.query('select public.minery_business_dispatch($1,$2,$3)',[actor,'state','{}']),/permission denied/);await db.exec('reset role')}
const policy=await db.query("select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='minery_business' and c.relkind='r' and not c.relrowsecurity");assert.equal(policy.rows[0].n,0);
console.log('PASS: PostgreSQL schema, business isolation, roles, deactivation, stock, rollback, idempotency, regularization, immutable store snapshot, RLS and RPC grants.');
await db.close();
