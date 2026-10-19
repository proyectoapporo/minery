const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../public/negocios.html'),'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const elements=new Map();
function elem(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',hidden:true,value:'',checked:true,disabled:false,style:{},classList:{toggle(){}},addEventListener(){},showModal(){},close(){},append(){},remove(){}});return elements.get(id)}
const context={console,Intl,Date,Math,JSON,Number,String,Object,Array,Set,Error,RegExp,encodeURIComponent,structuredClone,crypto:{randomUUID:()=>require('node:crypto').randomUUID()},setTimeout:()=>1,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:elem,querySelectorAll:()=>[],createElement:()=>elem('temporary'),head:{append(){}}},window:{scrollTo(){},print(){}},confirm:()=>true,FormData:class{constructor(form){this.form=form}*[Symbol.iterator](){yield*Object.entries(this.form.values)}}};
vm.createContext(context);vm.runInContext(script,context);
function run(code){return vm.runInContext(code,context)}
run(`assertPlaceholder=undefined`);
assert.equal(run('data.products.length'),4);
run(`go('sale');addProduct('p1');saveSale({preventDefault(){},target:{values:{client:'Cliente prueba',phone:'',payment:'Efectivo'}}})`);
assert.equal(run('data.products.find(p=>p.id===\'p1\').qty'),0);assert.equal(run('data.sales.length'),2);assert.equal(run('data.sales.at(-1).number'),'DEMO-0002');
run(`go('sale');addProduct('p1')`);assert.equal(run('cart.length'),0);
run(`cart.push({name:'Sin inventario',ref:'PEND-TEST',material:'Plata',law:'925',weight:3,qty:2,price:100000,cost:null,pending:true});saveSale({preventDefault(){},target:{values:{client:'Otra prueba',payment:'Efectivo',phone:''}}})`);
assert.equal(run('pending().length'),2);const count=run('data.sales.length');
run(`resolveModal(data.sales.at(-1).id+':0');document.getElementById('resolve-form').onsubmit({preventDefault(){},target:{values:{cost:'60000',provider:'Proveedor ejemplo',document:'Entrada-1',operator:'Admin'}}})`);
assert.equal(run('pending().length'),1);assert.equal(run('data.sales.length'),count);assert.equal(run(`data.products.find(p=>p.ref==='PEND-TEST').qty`),0);assert.equal(run('data.movements.at(-1).qty'),2);
run(`data.store.name='Cambio';selectedSale=data.sales[1].id`);assert.notEqual(run('selected().store.name'),'Cambio');
assert.equal(run(String.raw`parseCSV('ref,name\n"A,1","Anillo ""azul"""')[1][1]`),'Anillo "azul"');
assert.throws(()=>run(String.raw`parseCSV('ref,name\n"broken')`));
for(const size of ['58','80','letter']){run(`docSize='${size}';docType='sale';printDocument()`);assert.ok(elem('print-area').innerHTML.includes('DEMO-0002'));assert.equal(run('data.sales.length'),count)}
for(const type of ['sale','warranty','piece']){run(`docType='${type}';go('documents')`);assert.ok(elem('main').innerHTML.includes('DEMO · NO FISCAL'))}
assert.ok(run(`esc('<script>')`).includes('&lt;'));
for(const p of ['home','inventory','sale','pending','documents','settings'])run(`go('${p}')`);
console.log('PASS: navigation, sale and stock, no-stock guard, unlisted sale, regularization, store snapshots, CSV parser, document formats, reprint without duplicate, escaping.');
