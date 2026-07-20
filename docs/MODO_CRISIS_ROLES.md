# Modo crisis: roles operativos por negocio

## Cambio solicitado

Se implemento un cambio importante de control de acceso: el dueno se registra como `propietario` y desde el panel puede crear usuarios del negocio con rol `encargado` o `vendedor`.

## Impacto tecnico

- Se agrego `id_propietario` en `usuarios` para agrupar el equipo del negocio dentro del MVP.
- El JWT incluye `id_propietario` y el backend usa ese valor para consultar el inventario compartido del negocio.
- Las ventas, mermas, ajustes y movimientos conservan el `id_usuario` responsable real.
- El frontend muestra secciones y acciones segun permisos, no solo segun el nombre del rol.
- Los usuarios legacy con rol `admin` se normalizan como `propietario`.

## Decisiones tomadas

- `propietario`: todo, reportes, usuarios, cancelar ventas y ajustar stock.
- `encargado`: registrar/editar productos, ajustar stock, registrar merma y consultar inventario.
- `vendedor`: ver productos activos, registrar ventas y ver sus ventas.
- El panel del propietario solo permite crear/asignar `encargado` y `vendedor`; no permite crear otro propietario.
- El registro publico crea al dueno como `propietario`; los empleados se crean desde el panel.

## Que se modifico

- `backend/src/services/roles.js`: mapa formal de roles, permisos y compatibilidad `admin` -> `propietario`.
- `backend/src/routes/usuarios.js`: endpoints para listar, crear, cambiar rol y activar/desactivar usuarios del negocio.
- `backend/src/routes/productos.js`: permisos por operacion e inventario consultado por propietario.
- `backend/src/routes/ventas.js` y `backend/src/services/sales.js`: vendedor ve sus ventas; propietario ve el equipo y puede cancelar.
- `app/inventario/page.tsx`: se agrego seccion `Usuarios` y filtrado de menu/acciones por permisos.
- `backend/src/migrations/20260720_add_user_owner_and_roles.sql`: migracion para `id_propietario` y roles legacy.

## Que no se modifico

- No se creo una tabla separada `comercios`; el MVP usa `usuarios.id_propietario` como agrupador del negocio.
- No se agrego recuperacion/cambio de password para empleados desde el panel.
- No se permite que un empleado elija o eleve su propio rol.
- No se borran usuarios; se activan o desactivan para conservar historial.

## Trade-offs

- Usar `id_propietario` es mas simple y seguro para el MVP que introducir una entidad `comercios` completa en este punto.
- La solucion permite operar por negocio sin migrar todas las tablas a `id_comercio`, pero una version multi-sucursal formal deberia agregar esa tabla.
- El frontend mejora la experiencia, pero la seguridad real queda en backend con permisos.

## Evidencia tecnica

- `npm --prefix backend test`: 58/58 pruebas pasando.
- `npx tsc --noEmit`: sin errores.
- `npx eslint app/inventario/page.tsx app/registro/page.tsx lib/api.ts backend/src backend/test`: sin errores.
- `npm run build`: build de Next.js correcto.
