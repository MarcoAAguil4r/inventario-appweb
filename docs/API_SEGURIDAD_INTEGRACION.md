# API propia, seguridad e integracion externa

## API propia

Base local: `http://localhost:4000`

| Metodo | Endpoint | Auth | Descripcion |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Estado del backend |
| POST | `/api/auth/register` | No | Registra usuario y devuelve JWT |
| POST | `/api/auth/login` | No | Autentica usuario y devuelve JWT |
| POST | `/api/auth/forgot-password` | No | Solicita recuperacion de contrasena con respuesta neutra |
| POST | `/api/auth/reset-password` | No | Cambia la contrasena con token valido de un solo uso |
| GET | `/api/productos` | Bearer JWT | Lista productos del usuario |
| POST | `/api/productos` | Bearer JWT | Crea producto |
| PUT | `/api/productos/:id` | Bearer JWT | Actualiza producto |
| POST | `/api/productos/:id/venta` | Bearer JWT | Registra venta y puede enviar alerta externa |
| POST | `/api/productos/:id/danado` | Bearer JWT | Registra producto danado vendible |
| POST | `/api/productos/:id/merma` | Bearer JWT | Registra merma |
| PATCH | `/api/productos/:id/desactivar` | Bearer JWT | Desactiva producto |
| GET | `/api/productos/:id/movimientos` | Bearer JWT | Lista movimientos de un producto |
| POST | `/api/alertas/email-prueba` | Bearer JWT | Prueba directa de integracion externa de email |

## API externa utilizada

Proveedor: Resend Email API.

Archivo de integracion: `backend/src/services/email.js`.

Variables:

```env
EMAIL_PROVIDER="mock"
RESEND_API_KEY="re_..."
EMAIL_FROM="Inventario <onboarding@resend.dev>"
ALERT_EMAIL_TO="destino@example.com"
RESET_PASSWORD_URL="http://localhost:3000/reset-password"
```

Modo `mock`: no usa red y devuelve una respuesta controlada para evidencia local.

Modo `resend`: envia `POST https://api.resend.com/emails` con `Authorization: Bearer RESEND_API_KEY`.

## Seguridad basica implementada

- Autenticacion con JWT en `POST /api/auth/login` y `POST /api/auth/register`.
- Proteccion de rutas con middleware `requireAuth` en productos y alertas.
- Passwords hasheados con bcrypt.
- Recuperacion de contrasena con token aleatorio, guardado como hash SHA-256, expiracion de 30 minutos y un solo uso.
- Respuesta neutra en `forgot-password` para no revelar si un correo existe.
- Validacion de datos en auth, productos, ventas, mermas y alertas.
- Manejo centralizado de errores en `backend/src/app.js`.
- Variables de entorno en `backend/.env.example`.

## Evidencia obligatoria

### 1. Autenticacion funcionando

Request:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"correo\":\"admin@example.com\",\"password\":\"Password123\"}"
```

Response esperado:

```json
{
  "token": "jwt...",
  "usuario": {
    "id_usuario": 1,
    "nombre": "Admin",
    "correo": "admin@example.com",
    "rol": "admin"
  }
}
```

Prueba de ruta protegida sin token:

```bash
curl http://localhost:4000/api/productos
```

Response esperado:

```json
{
  "error": "Token de autenticacion requerido."
}
```

### 2. Recuperacion de contrasena segura

Solicitar recuperacion:

```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"correo\":\"admin@example.com\"}"
```

Response esperado:

```json
{
  "ok": true,
  "message": "Si el correo existe, enviaremos instrucciones para recuperar la contrasena."
}
```

La misma respuesta debe aparecer aunque el correo no exista. Esto evita enumeracion de usuarios.

El token no se devuelve por JSON ni se guarda en claro. Se envia por correo usando la API externa configurada. En base de datos solo queda `token_hash`, `expires_at` y `used_at`.

Cambiar contrasena con el token recibido por correo:

```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"TOKEN_DEL_CORREO\",\"password\":\"NuevoPassword123\",\"confirmPassword\":\"NuevoPassword123\"}"
```

Response esperado:

```json
{
  "ok": true,
  "message": "Contrasena actualizada correctamente."
}
```

Prueba de seguridad: reutilizar el mismo token debe fallar.

```json
{
  "error": "Token invalido o expirado."
}
```

### 3. Request/response de API propia

Crear producto:

```bash
curl -X POST http://localhost:4000/api/productos \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Cafe\",\"categoria\":\"Abarrotes\",\"precio_compra\":40,\"precio_venta\":65,\"stock_actual\":2,\"stock_minimo\":1}"
```

Response esperado:

```json
{
  "id_producto": 1,
  "nombre": "Cafe",
  "categoria": "Abarrotes",
  "precio_compra": 40,
  "precio_venta": 65,
  "stock_actual": 2,
  "stock_minimo": 1,
  "activo": true,
  "estado": "disponible"
}
```

### 4. Flujo completo con API externa

Con `EMAIL_PROVIDER=mock`, vender una unidad para dejar el producto en stock bajo:

```bash
curl -X POST http://localhost:4000/api/productos/1/venta \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d "{\"cantidad\":1,\"precio_unitario\":65,\"nota\":\"venta mostrador\"}"
```

Response esperado con evidencia de integracion:

```json
{
  "producto": {
    "id_producto": 1,
    "nombre": "Cafe",
    "stock_actual": 1,
    "stock_minimo": 1,
    "estado": "bajo stock"
  },
  "total": 65,
  "alerta": {
    "provider": "mock",
    "external_id": "mock_...",
    "delivered": true,
    "to": "tu-correo@example.com",
    "subject": "Stock bajo: Cafe"
  }
}
```

Prueba directa del proveedor:

```bash
curl -X POST http://localhost:4000/api/alertas/email-prueba \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d "{\"asunto\":\"Prueba Resend\",\"mensaje\":\"Mensaje de prueba para validar la integracion externa.\"}"
```

Response esperado:

```json
{
  "ok": true,
  "integration": "email",
  "email": {
    "provider": "mock",
    "external_id": "mock_...",
    "delivered": true
  }
}
```
