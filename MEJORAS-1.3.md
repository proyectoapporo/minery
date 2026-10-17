# Minery 1.3: centro de experiencia

Cambios del 17 de octubre de 2026:

- Portada por intención: tengo una joya, trabajo en joyería, trabajo en minería y quiero aprender.
- Cuatro recorridos con siguientes pasos y enlaces que seleccionan la calculadora adecuada.
- Biblioteca de 24 fichas editoriales, buscador sin distinción de tildes, filtros y favoritos.
- Cada ficha muestra fuentes, fecha, límites y herramienta para aplicar lo aprendido. Las afirmaciones comerciales y los ejemplos de precios del chat no se publican como fichas revisadas.
- Casos locales de piezas con datos pendientes o declarados, evidencia de ley aportada por el usuario, referencia con fecha y cálculo neto. No se valora todo el peso de materiales desconocidos o recubiertos como oro.
- Guardar, reabrir, archivar/restaurar, copiar o descargar casos y exportar JSON. Límite de 100 casos por navegador.
- Mi espacio reúne casos activos, favoritos y las operaciones guardadas existentes. Sin sincronización remota ni datos de clientes.
- Menú móvil nativo accesible, página de metodología y navegación consistente en guías y chat.
- Chat utiliza la ruta directa de la función desplegada. La activación de Supabase/OpenAI sigue pendiente; no se anuncia como operativo.
- Base de compra plegable y registros de la portada agrupados para dar espacio a los recorridos.

## Contenido

La biblioteca es una exportación pública de `knowledge/seed.json`. Regenerar con `python scripts/build-library.py`. No publica la base SQLite, credenciales ni conversaciones. Los cambios de la semilla no se sincronizan automáticamente con Supabase: requieren un proceso editorial/importación independiente.

## Verificación

50 pruebas locales pasan, incluidos búsqueda, filtros, valoración y rechazo de materiales recubiertos o referencias antiguas, y enlaces/anclas de todas las páginas. En navegador se comprobaron favorito, lectura con fuentes, creación de caso con cotización real, recarga y Mi espacio, selección de calculadora por ruta y navegación móvil de 390 px sin desbordamiento horizontal. Las validaciones del asistente mantienen servicios externos simulados; no se ha activado una cuenta OpenAI ni conectado WhatsApp.

## Pendiente

Activar y verificar asistente real con la configuración de ASISTENTE-CONFIGURACION.md. Sincronización entre dispositivos, fotografías de casos, cursos con evaluación y balance completo de materiales requieren una fase posterior; esta versión no los presenta como existentes.
