# Activación del piloto de Minery Negocios

Base verificada: proyecto Supabase qktnueimdaokppysqqts. Las tablas y funciones ya están instaladas. No volver a ejecutar el esquema.

## 1. Cuenta administradora

En Supabase → Authentication → Users → Add user → Create new user. El propietario elige su correo y contraseña directamente en el panel. Si usa un alta manual confirmada por el administrador, comprobar que el correo quede confirmado. No enviar contraseñas por chat ni guardarlas en GitHub.

## 2. Servidor Netlify

La última comprobación de `https://minery.netlify.app/.netlify/functions/business?status=1` devolvió 404. Antes de publicar, confirmar que Netlify ya permite despliegues: el aviso anterior indicaba una pausa por créditos. No se ha contratado ni cambiado ningún plan.

En el proyecto Minery → Project configuration → Environment variables, configurar en el contexto Production y alcance Functions:

| Variable | Valor |
| --- | --- |
| SUPABASE_URL | https://qktnueimdaokppysqqts.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Clave privada del proyecto correcto, copiada directamente de Supabase al gestor de secretos de Netlify |
| MINERY_BUSINESS_ORIGIN | Origen HTTPS real del módulo, sin ruta ni barra final; por ejemplo https://minery.netlify.app si ese es el dominio que se va a utilizar |
| MINERY_BUSINESS_ENABLED | true |

Mantener las variables del asistente y las cotizaciones que ya existan. No reemplazar todo el conjunto. No poner la clave privada en HTML ni compartirla en capturas. No usar una clave publishable/anon en el lugar de service_role.

Después iniciar un nuevo despliegue completo de la rama main de proyectoapporo/minery, con carpeta pública `public` y funciones de `netlify/functions`, según netlify.toml. Verificar que aparezca la función business.

## 3. Comprobación sin datos personales

```
node scripts/check-business-deployment.mjs https://DOMINIO-REAL
```

Este chequeo no crea ventas ni usuarios. Debe pasar antes de entrar al sistema.

## 4. Prueba acompañada del flujo real

Entrar por `/negocios-app.html`. Crear el almacén y completar nombre, razón social, NIT, dirección, teléfono y condiciones de garantía. Probar con una pieza y cliente de prueba claramente identificados, sin mezclar esa operación con ventas comerciales. Confirmar inventario, consecutivo, aislamiento de usuarios, reintento sin duplicación, regularización, POS/carta y sesión. Conservar los registros de prueba identificados y definir con el responsable el tratamiento antes de comenzar operación comercial; no borrar movimientos silenciosamente.

El piloto registra ventas y comprobantes internos. No está integrado con facturación electrónica DIAN ni con envío real de WhatsApp. Los precios son finales y no hay liquidación fiscal en esta versión. No presentarlo como un reemplazo de la facturación electrónica existente.

## 5. Antes de operar

Confirmar respaldo y restauración, política de acceso/retención, formatos y garantía con el comercio, y conexión con la facturación vigente. Falta verificar estos puntos en el despliegue real; las pruebas locales no equivalen a esa activación.
