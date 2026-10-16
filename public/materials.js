import {positive} from './math.js';

export function materialWeight({shape,length,width,thickness,diameter,density}) {
  const rho=positive(density,'Densidad');
  let volume;
  if(shape==='sheet') volume=positive(length,'Largo')*positive(width,'Ancho')*positive(thickness,'Espesor');
  else if(shape==='wire') volume=Math.PI*(positive(diameter,'Diámetro')/2)**2*positive(length,'Largo');
  else if(shape==='ring') {
    const d=positive(diameter,'Diámetro interior'),t=positive(thickness,'Espesor');
    volume=Math.PI*(d+t)*t*positive(width,'Ancho');
  } else throw Error('Selecciona una forma válida.');
  const grams=volume/1000*rho;
  if(!Number.isFinite(grams)||grams<=0) throw Error('Las medidas superan el rango de cálculo.');
  return {grams,volumeCm3:volume/1000};
}

export function quoteMessage(snapshot,{client='',description='',validity=2}={}) {
  const days=positive(validity,'Vigencia');
  if(!Number.isSafeInteger(days)||days>30)throw Error('La vigencia debe ser de 1 a 30 días calendario.');
  const clean=s=>String(s).replace(/[\r\n\u0000-\u001f]/g,' ').trim().slice(0,160);
  return `*COTIZACIÓN MINERY*\n${snapshot.id} · ${snapshot.date}\nCliente: ${clean(client)||'Sin especificar'}\nDescripción: ${clean(description)||snapshot.title}\n${snapshot.title}: ${snapshot.total}\n${snapshot.rows.map(r=>r.join(': ')).join('\n')}\n${snapshot.explanation}\nReferencia: ${snapshot.reference}\nVigencia: ${days} días calendario desde la emisión.\nPresupuesto estimado, sujeto a confirmación. No es factura ni comprobante de pago.`;
}
