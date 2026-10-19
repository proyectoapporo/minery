# Minery Negocios — prototipo navegable

Abrir `public/negocios.html` en el navegador o visitar `/negocios.html` en el despliegue de Minery. Es un único HTML sin dependencias externas; también se puede descargar y abrir localmente.

Incluye inicio, inventario con filtro e importación/exportación CSV, nueva venta, ingreso provisional con fotografía, alertas de inventario, regularización vinculada, documentos y configuración del almacén. Imprime comprobante, garantía o ficha en carta/A4 y tirilla de 58/80 mm. El PDF se genera con «Guardar como PDF» del navegador.

La demo tiene datos ficticios y almacenamiento en `localStorage`. No tiene autenticación, sincronización, contabilidad, cálculo de impuestos, facturación DIAN ni envío por WhatsApp. El selector de factura electrónica está deshabilitado y la vista previa de WhatsApp no envía mensajes. No usar datos reales ni operar un negocio con este prototipo.

Una venta sin ficha crea una alerta. Completar su costo, proveedor, documento de entrada y responsable registra una entrada/salida vinculada con saldo cero sin duplicar la venta. Las ventas nuevas guardan una copia de los datos del almacén y la garantía para conservar sus documentos al cambiar la configuración.

Prueba funcional sin navegador:

```
node prototype/check-prototype.cjs
```

Se comprobaron navegación, venta y existencias, venta sin inventario, regularización, instantánea de datos del almacén, CSV con comillas, formatos de documento, reimpresión sin duplicados y escape de contenido. Queda pendiente la revisión visual en navegador y la prueba física de impresoras.
