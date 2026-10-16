# Minery: referencias de producto y prioridades

Fecha: 16 de octubre de 2026. Mercado objetivo: mineros, compradores de oro, compraventas y talleres de Colombia. Este documento es investigación y propuesta, no un compromiso de funciones implementadas.

## Alcance y evidencia

Se revisaron páginas oficiales y descripciones públicas. No se contrataron planes, no se enviaron mensajes a sus asistentes ni se validó el funcionamiento interno de las funciones anunciadas. Una página de marketing no demuestra precisión, disponibilidad ni número de usuarios. No se puede afirmar exclusividad de Minery por no encontrar un competidor idéntico.

## Referencias

| Producto | Función anunciada u observable | Aplicación propuesta a Minery |
|---|---|---|
| [Precio del Oro Colombia](https://preciodeloro.com.co/calculadora-de-oro/) | Varias piezas, ley personalizada para oro de mina, gramos/castellanos, descuento de piedras, presupuesto y ganancia/pérdida | Liquidación de múltiples lotes; pesos bruto, no metálico y neto separados; presupuesto inverso |
| [Kitco ScrapIt](https://applications.kitco.com/product/scrapit-web) | Purezas editables, porcentaje del valor de mercado, varios metales, monedas y unidades | Perfiles de negocio y tablas de pago configurables; varios lotes sin aplicar ley dos veces |
| [Carit](https://www.getcarit.com/) | Pesos de anillos, alambre, lámina y tubo; aleaciones; tallas; cotización con material, trabajo y margen | Herramientas de fabricación por dimensiones; presupuesto completo de la joya |
| [Smelter](https://tetsuolab.com/smelter/) | Aleaciones, ley, fundición, registro de taller, materiales y academia | Historial de lotes y rendimientos medidos; aprendizaje junto al cálculo |
| [Joyeros App](https://joyeros.app/herramientas) | Herramientas de ligas y taller, cotización de chatarra, costos y márgenes; plataforma de inventario y ventas | Calculadoras públicas que llevan al usuario a guardar y gestionar su trabajo. La página no fue legible en el extractor web actual; sus herramientas se revisaron previamente mediante HTML público |
| [JoyeroKit](https://joyerokit.com/funcionalidades) | Metal, merma, piedras, mano de obra, margen, PDFs, seguimiento de piezas y catálogo | Cotización identificada y versionada con logo; estados del pedido y seguimiento para clientes |
| [YMIR de JoyeroKit](https://joyerokit.com/ia) | Dictado por voz, extracción de campos y resumen antes de confirmar | WhatsApp con notas de voz; el usuario confirma gramos, ley y porcentaje antes de calcular o guardar |
| [Reva](https://revaworkspace.com/) | Conversaciones, notas de voz, solicitudes y estados de pedidos conectados a equipos | Convertir conversaciones en pedidos con responsables, fechas y trazabilidad |
| [VISOR de Synergics](https://www.synergicssolutions.com/ai-for-jewellery) | Consulta en lenguaje natural de datos del negocio y resumen diario por WhatsApp; consultas de metal entregado, recibido y merma | Preguntas sobre la propia operación y boletines personalizados con permiso del usuario |

## Hallazgos

1. Cotización, porcentajes y calculadoras no son una categoría nueva. La facilidad local y el flujo completo importan más que el número de herramientas.
2. WhatsApp e IA ya aparecen en ofertas del sector. No presentarlos como una invención exclusiva.
3. La competencia se extiende del cálculo al registro de lo ocurrido: cotización, aceptación, material entregado, trabajo, devolución de sobrantes y liquidación.
4. La voz ayuda si extrae campos y solicita confirmar ambigüedades. El cálculo debe seguir en funciones matemáticas verificadas.
5. Hay modelos gratuitos con límites y funciones de pago. La existencia de suscripciones no demuestra que nuestros clientes vayan a pagar.

## Prioridades propuestas

### Primero: precisión y compra de oro
- Referencia de oro y cambio USD/COP con origen y fecha separados. Conservar cuál se usó en cada cálculo.
- Liquidación de varios lotes con leyes distintas, sin confundir mezcla física con suma de valores.
- Separar peso bruto, piedras/otros componentes y peso neto. Para oro recuperado, distinguir información de ensayo y humedad cuando corresponda.
- Comparar dos ofertas usando la misma referencia y mostrando descuentos y total neto.
- Conversor de gramos y onza troy; castellano y unidades locales con equivalencias visibles y confirmadas con usuarios.
- Comprobante de cotización compartible con fecha, entradas, porcentaje, fuente y desglose.

### Después: oficio y continuidad
- Material, liga, pérdidas estimadas, recortes recuperables, mano de obra, piedras, costos y margen en campos distintos.
- Balance de metal por lote: entregado, agregado, producido, recuperado y pérdida no recuperada. No definir todo sobrante como merma.
- Historial sincronizado, cuentas y permisos. Mantener la calculadora básica accesible sin registro.
- Aplicación web instalable con cálculos sin conexión y aviso de antigüedad de la referencia. No prometer precio en vivo sin conexión.
- WhatsApp de texto; después voz, confirmación de campos, consulta de operaciones propias y alertas con límites.

### Más adelante: gestión del negocio
- Pedidos, anticipos, responsables y fechas; estado para el cliente.
- Inventario por masa, ley y costo; separar oro propio y de terceros.
- Informes de rendimiento y margen real por trabajo, no únicamente valor del metal.
- Directorio y comparación de compradores solo con ofertas verificadas, fecha y condiciones. No inventar una base local universal.
- CAD/3D, catálogo, fotografía y punto de venta únicamente después de validar demanda.

## Límites de producto

- Oro metálico con ley 850/1000 no es mineral con ley expresada en g/t. Un módulo de mineral requeriría otro modelo: masa, humedad, recuperación, ensayo, costos y unidades explícitos. No reutilizar la fórmula de joyería sin adaptación.
- Una fotografía no confirma pureza, peso, tratamientos ni origen de una gema. Si se agrega ayuda visual debe describir o estimar, sin presentarse como ensayo o certificado.
- Precio de referencia, oferta de un comprador y precio de joya terminada son tres cantidades diferentes.
- Dato actualizado en la interfaz no equivale a dato nuevo de mercado. Cada referencia debe conservar la hora del proveedor.

## Validación comercial recomendada

Probar los mismos casos con mineros, compraventas y joyeros por separado. Observar tareas reales y repetición de uso. Medir liquidaciones guardadas, cotizaciones compartidas, repetición semanal y disposición a pagar por funciones concretas. No usar el entusiasmo de una entrevista como prueba de compra.

## Relación con el estado actual

Minery tiene seis calculadoras, referencias manuales, conector GoldAPI XAU/USD, cambio USD/COP manual, historial local y CSV. El historial de operaciones es local. WhatsApp, cuentas, sincronización, balanza de taller, PDF, datos históricos de mercado y cotización automática del dólar no están implementados. Esta investigación no los activa ni cambia la aplicación automáticamente.
