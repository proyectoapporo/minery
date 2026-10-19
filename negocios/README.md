# Minery Negocios — primera base persistente

## Estado

Código implementado y pruebas locales ejecutadas. **Base instalada en Supabase; servidor web pendiente de activación en Netlify.** El 19 de octubre de 2026 se confirmó acceso al proyecto correcto `qktnueimdaokppysqqts`, con estado ACTIVE_HEALTHY. Se aplicaron `minery_business_private_core` y `minery_business_audit_indexes`. No se modificaron los proyectos de Ridera.

Verificación remota: seis tablas privadas con RLS; sin SELECT para anon/authenticated; RPC SECURITY INVOKER ejecutable solo por service_role; rechazo de llamadas sin actor. No hay usuarios de Auth todavía. Falta crear el administrador, configurar el servidor, desplegar y probar el flujo completo con cuentas reales.

La demo independiente sigue en `public/negocios.html`. La aplicación preparada para el servidor es `public/negocios-app.html`, con inicio de sesión, alta del primer almacén, inventario/importación CSV, ventas, pendientes, configuración y documentos imprimibles.

## Arquitectura y permisos

- Supabase Auth verifica correo y contraseña; el servidor comprueba el usuario con `/auth/v1/user` en cada operación.
- Sesión de hasta una hora en cookie HttpOnly, Secure, SameSite=Strict, limitada a la función. Requiere HTTPS. No se guardan credenciales ni ventas en localStorage.
- `MINERY_BUSINESS_ORIGIN` fija el único origen que puede enviar operaciones. No hay CORS abierto.
- `minery_business` es un esquema privado. Todas sus tablas tienen RLS. `anon` y `authenticated` no tienen acceso al esquema ni ejecución del RPC.
- La función pública es SECURITY INVOKER, exclusiva de service_role. La función de Netlify verifica la sesión y pasa la identidad obtenida del servidor, nunca una identidad elegida por el navegador.
- Membresías activas y permisos se consultan en base en cada operación: owner administra y vende, seller vende, warehouse ingresa y regulariza, viewer consulta. La administración/invitación de miembros aún no tiene interfaz.
- La transacción serializa los cambios de un mismo almacén, calcula totales, reserva consecutivo y descuenta inventario de forma consistente.
- Una clave idempotente impide repetir ventas/entradas cuando se reintenta una operación. Ante respuesta perdida, el botón «Confirmar operación anterior» reutiliza los datos y clave originales mientras la página siga abierta.
- Las ventas guardan instantánea de datos comerciales y condiciones de garantía.

## Activación web pendiente (base de Minery ya instalada)

1. Acceso confirmado a `qktnueimdaokppysqqts`; no volver a aplicar el esquema.
2. Las dos migraciones están aplicadas. `database/negocios.sql` e `database/negocios-indexes.sql` son copias de los cambios iniciales, no scripts que deban repetirse.
3. Ejecutar verificaciones y advisors en ese proyecto. Comprobar grants y probar con dos cuentas/almacenes diferentes. Las pruebas locales no sustituyen esta validación.
4. Crear/invitar el usuario inicial mediante la administración de Supabase Auth, sin insertar contraseñas manualmente en SQL. El propietario entra y crea el almacén desde la aplicación. Mantener el registro público de cuentas deshabilitado si no se desea autoservicio.
5. Configurar en Netlify, con alcance Functions y producción: `SUPABASE_URL` del proyecto, `SUPABASE_SERVICE_ROLE_KEY` como secreto, `MINERY_BUSINESS_ORIGIN` con el origen HTTPS real sin barra final y `MINERY_BUSINESS_ENABLED=true`.
6. Hacer un despliegue completo con la función `business`. `/.netlify/functions/business?status=1` debe devolver enabled true sin revelar claves.
7. Probar alta, venta, doble clic/reintento, venta simultánea de la última pieza con dos sesiones, regularización, cambio de sesión y reimpresión. Probar las impresoras físicas y el navegador móvil.

La clave privada jamás se copia a WordPress, Elementor, WPCode del navegador ni HTML. Si WordPress es la web pública, puede enlazar a este módulo en un subdominio del mismo proyecto Netlify. No pegar directamente esta página en un dominio distinto: los endpoints y cookies requieren el mismo origen.

## Pruebas reproducibles

```
npm ci
npm test
npm run check
npm run business:test
```

`@electric-sql/pglite` está fijado como dependencia de desarrollo y ejecuta PostgreSQL local para las pruebas del esquema y las funciones. La prueba no usa ninguna base remota. Verifica aislamiento, roles, desactivación, stock, reversión por error, reintentos, regularización y snapshots. No equivale a una prueba de concurrencia con múltiples conexiones remotas.

Para regenerar la interfaz conectada desde la demo y su adaptador:

```
npm run business:build
```

La prueba de gateway usa Auth/HTTP simulados. La del cliente comprueba su lógica con DOM simulado. La revisión visual en navegador sigue pendiente.

## Límites de esta primera versión

- Es un primer módulo de piloto, no una contabilidad completa: faltan liquidación fiscal, descuentos configurables, pagos parciales, devoluciones, cierres de caja y asientos.
- La emisión electrónica DIAN y WhatsApp no están conectadas. El documento es un comprobante interno; la garantía describe lo declarado por el comercio y no autentica la joya.
- Usuarios de equipo se asignan por administración segura; falta su panel de invitaciones y recuperación de contraseña desde la app.
- Las fotografías reducidas se guardan con la ficha en base en este primer piloto. Para catálogos grandes se necesita almacenamiento privado de objetos, URLs temporales y paginación; no cargar masivamente imágenes en producción con esta versión.
- La recuperación idempotente se mantiene en memoria de esta pestaña. Si se cierra tras un error incierto, revisar las ventas guardadas antes de volver a registrar la operación.
- Falta política de retención de datos, configuración y ensayo de respaldos, y validación de seguridad del despliegue real antes de uso comercial.

## Fuentes técnicas revisadas

Documentación de Supabase: RLS, SECURITY INVOKER y permisos de funciones. Changelog revisado el 19 de octubre de 2026: cambios recientes de cifrados TLS y PostgreSQL; no se usan cifrados obsoletos ni operadores personalizados afectados. No se modificaron extensiones ni funciones de otros sistemas.

## Advisors tras la instalación

Las cuatro observaciones de claves foráneas sin índice de minery_business se corrigieron con índices para actor, creador y venta. Las observaciones informativas de RLS sin políticas son intencionales: las tablas son privadas, no hay grants a roles de navegador, y service_role es el único acceso del servidor. No abrir políticas públicas para eliminar esas observaciones. Los índices nuevos aún no usados son esperables antes de operar. No se modificaron los avisos del esquema minery_knowledge, que es independiente.

Referencia del aviso informativo: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
