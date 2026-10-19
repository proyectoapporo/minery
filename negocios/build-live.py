from pathlib import Path
root=Path(__file__).resolve().parent.parent
s=(root/'public/negocios.html').read_text()
s=s.replace('Minery Negocios · Prototipo','Minery Negocios · Acceso')
s=s.replace('DEMO INTERACTIVA · Datos guardados solo en este navegador · Usa información ficticia.','MINERY NEGOCIOS · Acceso privado · Comprobantes internos sin validación DIAN.')
s=s.replace('Prototipo · Datos de ejemplo','Acceso privado por almacén')
s=s.replace('Ventas, piezas y pendientes en un mismo lugar.','Ventas, piezas y pendientes de tu almacén.')
s=s.replace('VENTAS DE LA DEMO','VENTAS REGISTRADAS').replace('documentos de demostración','documentos internos').replace('Valores de demostración.','Datos de tu almacén.').replace('Valor final de demostración.','Valor final registrado.').replace('Total de demostración · COP','Total registrado · COP').replace('DEMO · NO FISCAL','COMPROBANTE INTERNO').replace('Comprobante de venta · Demo no fiscal','Comprobante de venta · No electrónico')
s=s.replace('Documento de demostración sin validación DIAN.','Documento interno sin validación DIAN.').replace('La demo registra la operación y prepara sus documentos.','El módulo registra la operación y prepara sus documentos.').replace('Se guarda en este navegador. No se envía ningún mensaje al cliente.','Se guarda en la base privada de tu almacén. El envío por WhatsApp sigue pendiente.').replace('El prototipo no es apto para operaciones reales.','')
s=s.replace('<div class="app">','<div class="app" id="business-shell" hidden>')
s=s.replace('<main id="main"></main>', '<button id="recover-operation" class="gold" hidden style="margin:16px 24px">Confirmar operación anterior antes de continuar →</button><main id="main"></main>')
s=s.replace('<script>','<section id="access-screen" style="max-width:480px;margin:8vh auto;padding:24px"><div class="eyebrow">MINERY NEGOCIOS</div><h1>Tu joyería.<br>En un solo lugar.</h1><div class="card"><p id="access-status" role="status">Comprobando conexión…</p><form id="login-form" hidden><label>Correo<input name="email" type="email" required autocomplete="username"></label><label style="margin-top:14px">Contraseña<input name="password" type="password" required autocomplete="current-password"></label><button class="primary" style="margin-top:20px;width:100%">Entrar al almacén</button></form><form id="onboard-form" hidden><label>Nombre comercial<input name="name" required maxlength="150"></label><button class="primary" style="margin-top:20px">Crear mi almacén</button></form></div><p class="muted">Cuenta privada para el equipo del comercio. El inventario y las ventas no son públicos.</p><a href="negocios.html" style="color:#806124">Explorar la demo con datos ficticios →</a></section><script>')
start=s.index('let data;try{');end=s.index("let page='home'",start)
s=s[:start]+"let data={products:[],sales:[],movements:[],store:{name:'Mi almacén'}};\nfunction save(){throw Error('Los datos reales solo pueden guardarse mediante el servidor.')}\n"+s[end:]
s=s.replace("name==='name'", "name==='name'")
s=s.replace("$('main').innerHTML=", "$('main').innerHTML=")
s=s.replace("function saveSale(e){e.preventDefault();", "async function saveSale(e){e.preventDefault();")
needle="const number='DEMO-'+String(data.sales.length+1).padStart(4,'0');"
s=s.replace(needle,"""try{const result=await liveCommand('sale',{client:f.client.trim(),phone:f.phone,payment:f.payment,items:cart.map(i=>i.productId?{productId:i.productId,qty:i.qty,price:i.price}:{ref:i.ref,name:i.name,material:i.material,law:i.law,weight:i.weight,qty:i.qty,price:i.price,stones:i.stones,image:i.image})});cart=[];selectedSale=result.saleId;go('documents');toast('Venta guardada en tu almacén.')}catch(err){toast(err.message)}return;"""+needle)
s=s.replace("$('item-form').onsubmit=e=>", "$('item-form').onsubmit=async e=>")
needle="else{data.products.push({...item,id:uid(),pending:false});save();$('modal').close();go('inventory')}"
s=s.replace(needle,"else{try{await liveCommand('products',{products:[item]});$('modal').close();go('inventory')}catch(err){toast(err.message);return}}")
s=s.replace("$('resolve-form').onsubmit=e=>", "$('resolve-form').onsubmit=async e=>")
needle="data.movements.push({...f,cost,qty:i.qty"
s=s.replace(needle,"try{await liveCommand('resolve',{saleId:s.id,index:Number(index),cost,provider:f.provider,document:f.document});$('modal').close();go('pending');toast('Ingreso regularizado y vinculado a su venta.')}catch(err){toast(err.message)}return;data.movements.push({...f,cost,qty:i.qty")
s=s.replace("$('settings-form').onsubmit=e=>{e.preventDefault();Object.assign(data.store,Object.fromEntries(new FormData(e.target)));save();go('settings');toast('Datos guardados para las nuevas ventas.')}","$('settings-form').onsubmit=async e=>{e.preventDefault();try{await liveCommand('settings',{profile:Object.fromEntries(new FormData(e.target))});go('settings');toast('Datos guardados para las nuevas ventas.')}catch(err){toast(err.message)}}")
s=s.replace('<button type="button" id="reset-demo" class="danger">Restablecer demo</button>','<button type="button" id="reset-demo">Cerrar sesión</button>')
a=s.index("$('reset-demo').onclick=()=>{");b=s.index('}}}}',a)+4
s=s[:a]+"$('reset-demo').onclick=logout}}"+s[b:]
s=s.replace("$('csv-confirm').onclick=()=>", "$('csv-confirm').onclick=async()=>")
s=s.replace("const n=csvRows.length;data.products.push(...csvRows);save();$('modal').close();go('inventory');toast(n+' piezas importadas a la demo.')", "const n=csvRows.length;try{await liveCommand('products',{products:csvRows});$('modal').close();go('inventory');toast(n+' piezas importadas.')}catch(err){toast(err.message)}")
s=s.replace('<option>Pago combinado</option>','')
s=s.replace("if(p.qty<=(existing?.qty||0))", "if(p.qty<=(existing?.qty||0))")
s=s.replace(");go('home');", ");startLive();")
s=s.replace('Usa un nombre de ejemplo','Nombre del comprador').replace('Usa solo datos ficticios. No hay cuentas de usuario ni sincronización; este prototipo no es apto para operaciones reales.','Los cambios se aplican a las ventas nuevas. Los documentos anteriores conservan los datos de su fecha de emisión.').replace('Esta entrada es de demostración. Conserva los documentos de procedencia en el sistema definitivo.','Conserva los documentos de procedencia de esta entrada.').replace('No se envía ningún mensaje al cliente.','El envío por WhatsApp aún no está activo.')
s=s.replace("'Pieza agregada al inventario de demostración.'","'Pieza guardada en el inventario.'")
# Remove dead demo mutation branches after the live handlers' return to avoid accidental local persistence.
a=s.index("return;const number='DEMO-'");b=s.index('\nfunction resolveModal',a)
s=s[:a]+"return;}"+s[b:]
a=s.index('return;data.movements.push');b=s.index('\nfunction printDocument',a)
s=s[:a]+"return;};}"+s[b:]
# Remove demo seed function; no fictitious business or customer state in the live app.
a=s.index('function seed(){');b=s.index('let data=',a);s=s[:a]+s[b:]
# Better contextual notices for live operations.
s=s.replace('Los datos son ficticios. Este prototipo no envía facturas a DIAN ni mensajes de WhatsApp.','Las ventas se guardan en tu almacén. La emisión electrónica y el envío por WhatsApp aún no están habilitados.')
s=s.replace('01 · Revisa las piezas de ejemplo','01 · Revisa las piezas del almacén')
s=s.replace("<p class=\"muted\">Los datos son ficticios", "<p class=\"muted\">Los datos son ficticios")
s=s.replace('Esta ficha no constituye','Esta ficha no constituye')
s=s.replace("const KEY='minery.negocios.demo.v1';", "")
s=s.replace('bind();window.scrollTo(0,0)', 'bind();applyRole();window.scrollTo(0,0)')
s=s.replace('minery-inventario-demo.csv','minery-inventario.csv')
code=(root/'negocios/live-client.js').read_text()
s=s.replace("'use strict';","'use strict';\n"+code)
(root/'public/negocios-app.html').write_text(s)
