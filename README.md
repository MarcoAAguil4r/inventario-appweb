# inventario-appweb

MVP de gestión de inventario congruente con la justificación técnica del proyecto:

- Frontend: React/Next.js + Tailwind CSS
- Backend: Node.js + Express.js
- Base de datos: MySQL
- Autenticación: JWT + bcrypt
- Deploy: Vercel para frontend y Railway para backend

## Estructura

```txt
app/
  login/page.tsx
  inventario/page.tsx
backend/
  src/server.js
  src/routes/auth.js
  src/routes/productos.js
  src/schema.sql
  src/seed.js
lib/
  api.ts
```

## Inicio local

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Variables del frontend:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Variables del backend:

```env
DATABASE_URL="mysql://usuario:password@host:3306/inventario"
JWT_SECRET="cambia-este-secreto-en-produccion"
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

## Base de datos

1. Crea una base de datos MySQL.
2. Ejecuta el contenido de `backend/src/schema.sql`.
3. Crea el usuario inicial:

```bash
cd backend
npm run seed
```

Credenciales por defecto del seed:

```txt
Correo: admin@inventario.local
Contraseña: Admin123!
```

Puedes cambiarlas con `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` y `SEED_USER_NAME`.

## Flujo principal

- Login con correo y contraseña.
- Inventario protegido por JWT.
- Registro de productos con categoría, precios, stock actual y stock mínimo.
- Visualización de estado: disponible, bajo stock, agotado o desactivado.
- Actualización de producto y stock.
- Registro de producto dañado vendible con precio reducido.
- Registro de merma o pérdida total.
- Desactivación lógica de producto sin eliminar historial.
- Registro de movimientos importantes en `movimientos_inventario`.

## Deploy

Frontend en Vercel:

- Configura `NEXT_PUBLIC_API_URL` con la URL del backend de Railway.
- Ejecuta build de Next.

Backend en Railway:

- Root directory: `backend`
- Start command: `npm start`
- Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`, `PORT`
- Usa una base MySQL cloud y ejecuta `schema.sql`.

## Validación

Checklist mínimo:

- Login correcto genera JWT.
- Login incorrecto muestra error.
- Endpoints protegidos rechazan solicitudes sin token.
- Crear producto aparece en inventario.
- Bajo stock se marca cuando `stock_actual <= stock_minimo`.
- Editar producto refleja cambios.
- Daño leve descuenta stock y crea producto dañado vendible.
- Merma descuenta stock y registra pérdida.
- Desactivar producto conserva historial.
