# Deploy del Inventario

Esta app se despliega en dos servicios:

- Frontend: Vercel, desde la raiz del repo.
- Backend y MySQL: Railway.

## Backend en Railway

Crear un proyecto en Railway conectado al mismo repositorio.

Configuracion del servicio:

```txt
Root directory: backend
Start command: npm start
Healthcheck path: /api/health
```

Variables de entorno:

```env
DATABASE_URL="mysql://usuario:password@host:3306/inventario"
JWT_SECRET="cambia-esto-por-un-secreto-largo"
CORS_ORIGIN="https://tu-frontend.vercel.app"
FRONTEND_URL="https://tu-frontend.vercel.app"
```

No configures `PORT` si Railway lo asigna automaticamente.

Despues del deploy, probar:

```txt
https://tu-backend.railway.app/api/health
```

Debe responder:

```json
{ "ok": true, "service": "inventario-backend" }
```

## Frontend en Vercel con backend externo

Crear un proyecto en Vercel conectado al mismo repositorio.

Configuracion:

```txt
Framework preset: Next.js
Root directory: ./
Build command: npm run build
Output directory: dejar vacio/default
```

Variable de entorno:

```env
NEXT_PUBLIC_API_URL="https://tu-backend.railway.app"
```

Cada vez que cambies `NEXT_PUBLIC_API_URL`, haz redeploy del frontend.

## Ajuste final de CORS

Cuando Vercel genere la URL final del frontend, volver a Railway y actualizar:

```env
CORS_ORIGIN="https://tu-frontend.vercel.app"
FRONTEND_URL="https://tu-frontend.vercel.app"
```

Luego redeploy/restart del backend.

## Flujo esperado

```txt
Usuario -> Vercel frontend -> Railway backend -> MySQL
```
