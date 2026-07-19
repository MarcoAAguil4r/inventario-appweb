# Modo crisis: control de permisos por rol

## Cambio solicitado

Se implemento un cambio importante de control de acceso: el rol `admin` ahora protege operaciones criticas del inventario. Los usuarios autenticados que no sean `admin` pueden consultar productos y registrar ventas, pero no pueden modificar inventario sensible.

## Impacto tecnico

- Se agrego middleware reusable de autorizacion por rol en el backend.
- Las rutas criticas de productos ahora responden `403 Forbidden` cuando el JWT no contiene el rol requerido.
- El frontend lee el usuario guardado y oculta opciones administrativas a roles no-admin.
- La carga inicial del inventario evita consultar endpoints administrativos cuando el usuario no es admin.
- El punto de venta se conserva disponible para usuarios autenticados.

## Decisiones tomadas

- `admin` queda como rol requerido para altas, ediciones, ajustes, mermas, productos danados, reportes e historial.
- `POST /api/ventas` se mantiene disponible para cualquier usuario autenticado porque el flujo operativo de ventas no debe bloquearse.
- El registro actual sigue creando usuarios con rol `admin`, para no romper el comportamiento existente del MVP.
- La respuesta para falta de permisos usa `403`, porque el usuario esta autenticado pero no autorizado.

## Que se modifico

- `backend/src/middleware/auth.js`: se agrego `requireRole`.
- `backend/src/routes/productos.js`: se aplico `requireRole('admin')` a operaciones criticas.
- `app/inventario/page.tsx`: se ocultaron opciones administrativas para usuarios no-admin y se evitan llamadas protegidas.
- `lib/api.ts`: se agrego lectura segura del usuario guardado.
- `backend/test/authRole.test.js`: se agregaron pruebas del middleware de rol.

## Que no se modifico

- No se cambio la estructura de la tabla `usuarios`, porque ya existe la columna `rol`.
- No se agrego CRUD de usuarios.
- No se cambio el flujo de login ni el formato del JWT.
- No se bloqueo el punto de venta para usuarios no-admin.
- No se eliminaron endpoints legacy, solo se mantiene compatibilidad.

## Trade-offs

- Se gana seguridad y separacion de responsabilidades con bajo riesgo.
- Todavia no hay administracion visual de usuarios; los roles deben asignarse desde base de datos o futuras pantallas.
- El frontend oculta opciones, pero la proteccion real esta en backend.
- Mantener el registro como `admin` evita romper el MVP, aunque en produccion real convendria crear usuarios nuevos con rol operativo por defecto.

## Evidencia tecnica

- Pruebas backend:
  - `requireRole('admin')` permite usuarios admin.
  - `requireRole('admin')` rechaza usuarios con rol diferente.
  - `requireRole('admin')` rechaza solicitudes sin usuario.
- Validaciones ejecutadas:
  - `npm --prefix backend test`
  - `npx tsc --noEmit`
  - `npx eslint ...`
  - `npm run build`
