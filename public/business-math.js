import {positive,fineness} from './math.js';

export function nonnegative(value,label){
  const n=Number(String(value).replace(',','.'));
  if(!Number.isFinite(n)||n<0)throw Error(`${label}: escribe un número igual o mayor que cero.`);
  return n;
}
function percent(value,label,max=100){const n=positive(value,label);if(n>max)throw Error(`${label}: no puede superar ${max} %.`);return n;}
export function settleLots(price,lots,discount=0){
  price=positive(price,'Referencia COP por gramo fino');
  if(!Array.isArray(lots)||!lots.length||lots.length>50)throw Error('Agrega entre 1 y 50 lotes.');
  const rows=lots.map((lot,index)=>{
    const factor=lot.unit==='castellano'?4.6:lot.unit==='g'?1:NaN;
    if(!Number.isFinite(factor))throw Error('Unidad de lote no válida.');
    const gross=positive(lot.gross,`Peso del lote ${index+1}`)*factor;
    const excluded=nonnegative(lot.excluded,`Partes sin oro del lote ${index+1}`)*factor;
    if(excluded>=gross)throw Error(`Lote ${index+1}: el peso descontado debe ser menor que el peso bruto.`);
    const law=fineness(lot.law,`Ley del lote ${index+1}`);
    const payout=percent(lot.payout,`Pago del lote ${index+1}`);
    const net=gross-excluded,fine=net*law/1000,market=fine*price,payment=market*payout/100;
    return{gross,excluded,net,fine,law,payout,market,payment};
  });
  const sum=key=>rows.reduce((a,r)=>a+r[key],0);
  discount=nonnegative(discount,'Descuento adicional de la operación');
  const subtotal=sum('payment');if(discount>subtotal)throw Error('El descuento adicional supera el pago de los lotes.');
  const result={rows,gross:sum('gross'),excluded:sum('excluded'),net:sum('net'),fine:sum('fine'),market:sum('market'),subtotal,discount,total:subtotal-discount};
  if(!Object.values(result).filter(v=>typeof v==='number').every(Number.isFinite))throw Error('Las cantidades superan el rango de cálculo.');
  return result;
}
export function compareOffers(price,weight,law,offers){
  price=positive(price,'Precio');weight=positive(weight,'Peso neto');law=fineness(law);
  const fine=weight*law/1000,market=fine*price;
  if(!Array.isArray(offers)||offers.length!==2)throw Error('Se requieren dos ofertas.');
  const rows=offers.map(o=>{
    const payout=percent(o.payout,'Porcentaje de pago'),fixed=nonnegative(o.fixed,'Costo fijo'),perGram=nonnegative(o.perGram,'Costo por gramo de material neto');
    const fees=fixed+perGram*weight,gross=market*payout/100,total=gross-fees;
    if(!Number.isFinite(total)||total<0)throw Error('Los costos de una oferta superan su pago o el rango de cálculo.');
    return{payout,fixed,perGram,fees,gross,total,effective:total/market*100};
  });
  const difference=Math.abs(rows[0].total-rows[1].total);
  return{rows,fine,market,difference,winner:difference<0.005?null:rows[0].total>rows[1].total?0:1};
}
export function fabricationCost({price,count,pieceWeight,law,loss,labor,stones,extras,margin}){
  price=positive(price,'Precio');count=positive(count,'Cantidad de piezas');if(!Number.isSafeInteger(count))throw Error('La cantidad debe ser un entero positivo.');
  pieceWeight=positive(pieceWeight,'Peso terminado por pieza');law=fineness(law);
  loss=nonnegative(loss,'Merma');margin=nonnegative(margin,'Margen');
  if(loss>=100||margin>=100)throw Error('Merma y margen deben ser menores al 100 %.');
  labor=nonnegative(labor,'Mano de obra del pedido');stones=nonnegative(stones,'Piedras del pedido');extras=nonnegative(extras,'Liga y otros costos del pedido');
  const finished=count*pieceWeight,prepared=finished/(1-loss/100),fine=prepared*law/1000,metal=fine*price;
  const cost=metal+labor+stones+extras,sale=cost/(1-margin/100),profit=sale-cost;
  if(![finished,prepared,fine,metal,cost,sale,profit].every(Number.isFinite))throw Error('Las cantidades superan el rango de cálculo.');
  return{finished,prepared,fine,metal,labor,stones,extras,cost,sale,profit,unitSale:sale/count,margin};
}
