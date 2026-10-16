# Minery

Aplicación de oro para mineros, compradores, compraventas y talleres de Colombia.

## Precio automático
Al abrir la página se consulta `/api/quote`. La función de servidor consulta GoldAPI `XAU/COP`, recibe el precio de la onza en pesos y divide entre 31.1034768 para obtener COP por gramo fino. El usuario NO tiene que escribir el precio ni el tipo de cambio. Las bases del 88 al 94 % y las calculadoras utilizan ese dato.

La fecha del dato aparece en hora de Colombia. La página vuelve a consultar según el intervalo del servidor (300 segundos por defecto), mientras esté abierta y visible. La frecuencia de consulta no garantiza un precio nuevo en cada respuesta. Si el proveedor entrega un dato de más de 15 minutos, se identifica como último dato disponible.

El precio acordado manualmente queda en una sección opcional. Editarlo detiene las actualizaciones; el botón Actualizar precio vuelve al dato del mercado. Se conserva el origen en cada operación.

## Ejecutar
Node.js 22 o superior. Sin dependencias de producción.

```sh
npm test
npm run check
npm run dev
```

Abre http://127.0.0.1:4174. Para usar GoldAPI localmente copia `.env.example` a `.env` y agrega una clave válida. `.env` no se sube a GitHub ni se incluye en el ZIP.

## Netlify
- Repositorio con todos los archivos y rama `main`.
- Base directory y build command vacíos; publish directory: `public`.
- `netlify.toml` configura `netlify/functions` y redirige `/api/quote`.
- Agrega `GOLDAPI_KEY` como variable del proyecto, con alcance Functions y contexto Production. Debe contener la clave, sin comillas ni el prefijo `GOLDAPI_KEY=` en el valor.
- Opcional: `QUOTE_CACHE_SECONDS=300`.
- Después de guardar variables, ejecuta un nuevo despliegue completo de la rama de producción. Revisa que se despliegue la función `quote`.
- `/api/quote` debe responder HTTP 200 con `currency: COP`, `metal: XAU`, `gram`, `ounce`, `quotedAt` y `source`. Un 503 `NOT_CONFIGURED` indica que esa función desplegada no recibió la variable, no que el visitante deba ingresar el precio.

El ZIP es el proyecto completo para GitHub y despliegue con funciones. Netlify Drop por sí solo no prepara estas funciones de servidor.

## Herramientas
- Compra por peso neto, ley exacta y porcentaje de pago.
- Bajar ley con liga sin oro, subir ley y mezclar dos lotes.
- Rendimiento de piezas y material para pedidos con merma configurable.
- Liquidación de hasta 50 lotes: pesos bruto/excluido/neto, gramos o castellanos de 4.6 g, ley y porcentaje por lote, descuento adicional único.
- Comparador de dos ofertas con costos fijos y por gramo neto.
- Cotización de fabricación: metal, merma no recuperable, liga, piedras, mano de obra y margen sobre venta. Precio antes de impuestos.
- Guardado local de operaciones y referencias, gráfica de referencias guardadas, CSV, copia e impresión para guardar PDF.

## Supuestos
Ley en milésimas: 999 no es 1000. 18K es ley 750; 14K exacto no es ley 585. La ley proviene del ensayo, no del origen o de una fotografía. Las fórmulas conservan oro fino; la liga para bajar ley se supone sin oro. La merma es una pérdida proporcional uniforme; los recortes recuperables se contabilizan aparte. El comparador solo compara los importes ingresados. Los comprobantes son referencias, no facturas ni recibos de pago.

## Claves, cuota y datos
La clave se utiliza solo en el servidor. Se valida metal, moneda, precio, unidad y fecha. No se usa un precio inventado cuando el proveedor falla. Se identifican acceso rechazado y límites de consultas. La caché es por instancia y no garantiza un límite global entre instancias de Netlify. Configura el intervalo y el plan según el uso esperado; 300 segundos equivalen a 288 intervalos en 24 horas por instancia activa.

Los cálculos y el historial permanecen en el navegador, sin sincronización entre dispositivos. La gráfica no es un histórico completo del mercado. Cuentas de usuario, Supabase, WhatsApp y asistente de IA todavía no están implementados.

## Verificación
Pruebas de cálculo, conservación del oro fino, lotes, ofertas, fabricación, historial, CSV, caché y concurrencia, credenciales, moneda COP, errores y límites del proveedor. Verificación local real de GoldAPI XAU/COP y de la carga automática en el navegador.
