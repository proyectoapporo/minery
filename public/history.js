// No interpreta contenido guardado como HTML ni como fórmulas de una hoja de cálculo.
export function readOperations(storage) {
  try {
    const rows = JSON.parse(storage.getItem('minery.operations') || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter(r => r && Number.isFinite(Date.parse(r.at)) &&
      ['type', 'detail', 'result'].every(k => typeof r[k] === 'string'))
      .slice(-200).map(r => ({at:r.at,type:r.type.slice(0,100),detail:r.detail.slice(0,5000),result:r.result.slice(0,200)}));
  } catch { return []; }
}
export function operationsCsv(rows) {
  const cell = value => {
    let text = String(value);
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [['fecha_utc','operacion','detalle','resultado'],
    ...rows.map(r=>[r.at,r.type,r.detail,r.result])]
    .map(row=>row.map(cell).join(';')).join('\r\n');
}
