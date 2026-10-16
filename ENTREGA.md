# Entrega Minery

## Archivos principales
- `public/index.html`: interfaz y contenido educativo.
- `public/style.css`: identidad Minery y adaptación a móvil.
- `public/app.js`: formularios, referencia, gráfica, historial y exportación.
- `public/math.js`: motor matemático compartible con futuros canales.
- `netlify/functions/quote.mjs`: cotización internacional desde el servidor.
- `netlify.toml`: configuración del despliegue.
- `.env.example`: nombres de variables, sin credenciales.

## Verificación después de desplegar
1. Inicio responde 200 y carga estilos y módulos JavaScript.
2. Sin precio ingresado, no aparecen bases ni resultados monetarios ficticios.
3. Con referencia 440000, peso 20, ley 850 y pago 90: total 6732000 COP.
4. 100 g ley 999 a 750: 33.2 g de liga; 133.2 g finales.
5. Piezas de 3 g: 44 piezas y 1.2 g de sobrante, sin merma.
6. Sin clave, la cotización informa que falta configuración.
7. Con clave, comprobar fecha, unidad y moneda usando una respuesta real; aún no verificado en esta entrega por falta de credenciales.
8. Guardar dos referencias, comprobar gráfica, recargar y exportar CSV.

## Estado de integraciones
Lista para configurar: GoldAPI XAU/USD desde servidor.
Manual: tasa USD/COP y porcentajes de compra.
Sin implementar: Supabase, WhatsApp, IA conversacional y cotizaciones históricas del mercado.

No se modificaron cuentas ni se publicó automáticamente esta entrega.

## Actualización 1.1
Se agregan public/business.js y public/business-math.js. business.test.js verifica lotes, ofertas, fabricación y entradas inválidas. La interfaz fue comprobada con dos lotes de distinta ley, una oferta de mayor porcentaje pero menor neto, y un presupuesto con mano de obra y margen. Verificada persistencia de presupuesto e invalidación al editar costos; ancho móvil sin desbordamiento. La generación final del PDF depende de la impresión del navegador.


## Corrección de precio automático (1.1.1)
El flujo principal consulta GoldAPI XAU/COP al abrir, sin tasa USD/COP manual. El precio manual se mueve a una opción avanzada. Esta sección sustituye las indicaciones anteriores sobre XAU/USD y cambio manual. La clave debe estar en Functions/Production de Netlify. Se probó el precio real y las bases sin intervención manual.

