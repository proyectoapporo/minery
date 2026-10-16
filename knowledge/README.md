# Base de conocimiento de Minery

Repositorio de conocimiento para el futuro asistente web y de WhatsApp. La base local real es `minery.sqlite3`, generada con Python estándar, sin credenciales ni servicios de pago.

## Uso

Desde la raíz del proyecto:

```powershell
python knowledge/manage.py build
python knowledge/manage.py search "golfi"
python knowledge/manage.py search "azogue"
python knowledge/manage.py verify
```

`seed.json` es la fuente editable y portable. SQLite contiene temas, artículos, fuentes, relaciones de citas, términos populares, documentos y fragmentos buscables. El importador usa una transacción, conserva los identificadores y reconstruye el índice. No elimina artículos ajenos al conjunto importado.

Los HTML educativos y la investigación de competencia se conservan completos en `documents` y se fragmentan para búsqueda. No se importa el historial bruto del chat, claves API, archivos `.env`, datos personales ni conversaciones con clientes.

## Estados y uso por el asistente

- `reviewed`: síntesis editorial contrastada con las fuentes indicadas en esta investigación. No equivale a aval de laboratorio ni revisión independiente por experto.
- `commercial_claim`: afirmación publicada por un proveedor; no verificada físicamente ni recomendación del negocio.
- `user_example`: ejemplo aportado por el usuario, nunca precio de mercado confirmado.
- Los documentos importados son material de consulta pendiente de revisión por fragmento. No deben publicarse automáticamente como respuestas verificadas.

Cada artículo conserva fuentes, fecha de revisión, alcance y advertencias. Las tarifas y cotizaciones deben consultarse por separado y con fecha; no se convierten en hechos permanentes. La base no contiene un servicio de cotización.

Reglas del futuro asistente: citar la fuente; distinguir hechos, ejemplos y afirmaciones comerciales; no diagnosticar pureza por foto, sello, origen, imán o densidad; no calcular valor de laminado como si toda la pieza fuera 750; usar el motor matemático probado para operaciones; distinguir g/t de milésimas; informar límites de los ensayos; evitar procedimientos improvisados con mercurio, cianuro o ácidos.

## Destino remoto pendiente

El usuario importó los datos a su proyecto Supabase de Minery y mostró resultados de 30 artículos, 16 fuentes, 108 términos y 20 fragmentos. No está conectada a WhatsApp. Los proyectos de Ridera no se utilizan por defecto. Los datos pueden migrarse desde `seed.json` o SQLite a PostgreSQL conservando identificadores y relaciones. No se necesitan embeddings para conservar o buscar este conocimiento; se pueden incorporar después de validar la recuperación y sus costos.

El usuario identificó su proyecto independiente de Minery mediante una captura. La conexión actual no tiene permisos sobre él. `import-minery.sql` está preparado para ejecutarse exclusivamente en ese proyecto desde su SQL Editor. Crea el esquema privado `minery_knowledge`, activa RLS y no concede lectura a visitantes ni usuarios del sitio. Solo concede lectura al rol de servidor `service_role`; su clave nunca debe incluirse en el navegador. La importación inicial fue ejecutada por el usuario y sus recuentos se comprobaron mediante capturas; esta sesión no dispone de acceso remoto directo. No volver a ejecutarla para activar el asistente: utilizar enable-assistant.sql y seguir ../ASISTENTE-CONFIGURACION.md.

Para regenerar el SQL después de editar los contenidos:

```powershell
python knowledge/manage.py build
python knowledge/export_postgres.py
```

Las calculadoras existentes quedan conservadas también como documentos de código; deben ejecutarse con sus pruebas, no tratarse como instrucciones recuperadas del asistente.
