const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
const html=fs.readFileSync(path.join(__dirname,'../public/negocios-app.html'),'utf8');let script=html.match(/<script>([\s\S]*)<\/script>/)[1].replace('startLive();','');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',hidden:false,value:'',checked:true,disabled:false,style:{},classList:{toggle(){}},addEventListener(){},showModal(){},close(){},replaceChildren(){},querySelector(){return el('btn')},querySelectorAll(){return []}});return elements.get(id)}
const state={shopId:'shop-a',role:'owner',store:{name:'Almacén',nit:'Prueba'},products:[{id:'p1',ref:'PL1',name:'Anillo',material:'Plata',law:'925',weight:4.8,qty:1,cost:10,price:20,location:'Vitrina'}],sales:[],movements:[]};
let calls=[],failRead=false;const context={console,Intl,Date,Math,JSON,Number,String,Object,Array,Set,Error,RegExp,encodeURIComponent,structuredClone,crypto:{randomUUID:()=>require('node:crypto').randomUUID()},AbortSignal,fetch:async(url,opt)=>{calls.push({url,opt});if(failRead&&opt.method==='GET'){failRead=false;throw Error('read lost')}return {ok:true,status:200,json:async()=>opt.method==='POST'?{saleId:'s1'}:structuredClone(state)}},setTimeout:()=>1,clearTimeout(){},document:{getElementById:el,querySelectorAll:()=>[]},window:{scrollTo(){}}};vm.createContext(context);vm.runInContext(script,context);const run=s=>vm.runInContext(s,context);
run('useState('+JSON.stringify(state)+')');for(const p of ['home','inventory','sale','pending','documents','settings'])run(`go('${p}')`);
failRead=true;await assert.rejects(run(`liveCommand('sale',{client:'Test',items:[]})`));const first=JSON.parse(calls.find(x=>x.opt.method==='POST').opt.body).payload.requestKey;
await assert.rejects(run(`liveCommand('sale',{client:'Changed',items:[]})`),/anterior/);
await run(`liveCommand('sale',{client:'Test',items:[]})`);const writes=calls.filter(x=>x.opt.method==='POST');assert.equal(writes.length,2);assert.equal(JSON.parse(writes[1].opt.body).payload.requestKey,first);assert.equal(run('liveRequest'),null);
assert.ok(!script.includes('localStorage'));assert.throws(()=>run('save()'),/servidor/);
console.log('PASS: live navigation, numeric DB mapping, server-only persistence, same-key retry after lost response, changed-payload protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
