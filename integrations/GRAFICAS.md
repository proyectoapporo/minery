# Gráficas externas de oro y plata

Panel Minery: `public/mercado.html`. Portada y navegación enlazan «Gráficas». Dos columnas en escritorio; pestañas de oro/plata en móvil, operables por teclado.

La página local `market-widget.html?metal=gold|silver` inserta el código oficial de GoldPrice y SilverPrice con `COP-o-1d`. Cada widget vive en iframe sandbox sin same-origin, por lo que el script de terceros no puede leer la sesión, la página principal ni los datos del negocio. Se usa HTTPS y se conserva atribución. La carga de una imagen no se presenta como confirmación de actualidad: el usuario debe consultar el timestamp que imprime el proveedor.

No se extraen ni guardan datos numéricos de las gráficas. No hay llamadas a GoldAPI desde este panel. Los cálculos y la consulta diaria permanecen separados.

## WordPress / Elementor

`integrations/elementor-market.html` es un fragmento HTML independiente para insertar una sola vez en un widget HTML de Elementor. Mantiene las dos atribuciones y enlaces alternativos. Ese fragmento carga el código oficial directamente en la página pública, como propone el proveedor; no pegarlo en páginas privadas de gestión. La versión de Minery usa aislamiento mediante iframe.

## Fuentes verificadas

- https://goldprice.org/gold-price-charts.html — código oficial de inserción, atributos y scripts para oro/plata.
- https://goldprice.org/spot-gold.html — permite adaptar el HTML conservando enlace textual a GoldPrice.
- https://goldprice.org/gold-price-colombia.html
- https://silverprice.org/silver-price-colombia.html

## Límites observados

El entorno de comprobación recibe HTTP 403 al descargar los scripts del proveedor por HTTPS. No se intentó eludir esa respuesta. Por ello la carga de la gráfica y la selección COP requieren prueba en el navegador del dominio publicado. No se garantiza disponibilidad, frecuencia ni datos intradía de un proveedor externo no controlado por Minery. Si el script no carga, se muestra aviso tras 15 segundos y siempre existe enlace al proveedor. No sustituir los datos por series simuladas ni ocultar la atribución.

El panel no se considera publicado hasta verificar el despliegue de Netlify. No está probado con el WordPress del usuario, que aún no se ha conectado.
