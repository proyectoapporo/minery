# Activar el asistente de Minery

El código está preparado; activarlo requiere la configuración siguiente. Minery es independiente de cualquier otro proyecto. No copiar claves de otros sistemas.

## 1. Supabase: habilitar consulta segura

En el proyecto `qktnueimdaokppysqqts`, abrir SQL Editor y ejecutar **knowledge/enable-assistant.sql**. No repetir la importación inicial: los artículos ya están cargados.

El archivo incorpora dos funciones: búsqueda de hasta seis artículos revisados o declaraciones comerciales identificadas, y control persistente de uso. Conserva las tablas privadas. Las funciones solo son ejecutables por el rol del servidor. Los documentos pendientes de revisión y los ejemplos de precios del usuario no alimentan las respuestas.

Los resultados de verificación deben mostrar artículos al buscar `golfi`; los permisos `anon` y `authenticated` deben ser false y `service_role` true. El código SQL está preparado, pero el acceso disponible al asistente de desarrollo no permitió ejecutarlo en el proyecto remoto: verificar los resultados antes de activar.

## 2. Netlify: variables de Functions / Production

En el proyecto `minery`, configuración de variables de entorno:

| Nombre | Valor |
|---|---|
| SUPABASE_URL | https://qktnueimdaokppysqqts.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Clave legacy `service_role` del proyecto de Minery, solo servidor |
| OPENAI_API_KEY | Clave de un proyecto OpenAI dedicado a Minery |
| OPENAI_MODEL | gpt-5-mini |
| ASSISTANT_ENABLED | true, solo después de configurar lo anterior |

`GOLDAPI_KEY` se conserva para cotizaciones. No incluir secretos en código, capturas, mensajes de chat, CSV o archivos públicos. Una clave publishable/anon no sirve como service_role. Esta integración utiliza la clave JWT legacy del rol servidor para autenticación REST; no colocar una clave secreta de formato diferente en el encabezado Bearer sin adaptar la autenticación.

Crear una clave OpenAI con acceso al modelo y configurar presupuesto/alertas del proyecto en su plataforma. Las llamadas consumen saldo de API. El servidor limita inicialmente a 100 solicitudes diarias globales y 20 por hora por dirección de conexión, con contadores persistentes en Supabase. Son límites de solicitudes, no un tope monetario garantizado. Los fallos también pueden consumir una solicitud. El identificador se guarda como HMAC; no se almacena la IP en esos contadores y se eliminan periodos anteriores a dos días.

## 3. Publicar y verificar

Publicar la versión más reciente de `proyectoapporo/minery` en Netlify y abrir `/asistente.html`. `/api/assistant` con GET debe devolver `enabled:true` y `configured:true`. Este estado solo comprueba presencia de configuración, no validez de claves o conectividad.

Probar: “¿Qué es golfi?”, “¿Por qué nacional e italiano tienen precios diferentes?”, “¿Qué es azogue?”, “Con precio acordado 440000 COP/g fino, 20 g ley 850 y pago 90 %, ¿cuánto corresponde?”. El último resultado esperado es 6.732.000 COP.

Después probar consulta de precio actual y confirmar fecha y referencia. Si falta un dato de cálculo, debe solicitarlo. Si falla la cotización, no debe proporcionar un precio supuesto.

Esta versión aún no recibe fotografías, notas de voz ni mensajes de WhatsApp. El botón de compartir cotizaciones existente prepara mensajes manuales y es distinto de este asistente.

## Tratamiento de conversaciones

La interfaz mantiene hasta cuatro mensajes previos en memoria durante la sesión y los envía con la pregunta. No persiste chats en localStorage ni en las tablas de conocimiento. El backend envía pregunta y contexto a OpenAI con `store:false`; esto no sustituye las políticas de retención y registro de los proveedores. No enviar claves o datos personales de clientes. Los documentos recuperados se tratan como datos, no como instrucciones.

## Verificación realizada

43 pruebas locales aprobadas, incluida configuración, validación de entradas, aislamiento del proyecto, errores, fuentes, cuota persistente y cálculos con servicios simulados. No se ha probado una respuesta real de OpenAI ni el SQL contra el Supabase remoto, pendientes de configuración. No afirmar que el asistente está operativo hasta completar estas verificaciones.

Documentación: https://developers.openai.com/api/docs/models/gpt-5-mini y https://supabase.com/docs/guides/api/securing-your-api
