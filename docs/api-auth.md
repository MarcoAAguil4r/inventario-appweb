# API de autenticacion

## Funcion

La API de autenticacion permite registrar usuarios, iniciar sesion y recuperar contrasenas. Genera tokens JWT para acceder a rutas protegidas y usa respuestas neutras en recuperacion para no revelar si un correo existe.

Base URL:

```txt
https://backend-production-a051.up.railway.app
```

Formato:

- Request: `Content-Type: application/json`
- Response: JSON
- Token en rutas protegidas: `Authorization: Bearer <token>`

## Endpoints principales

| Metodo | Endpoint | Funcion |
| --- | --- | --- |
| POST | `/api/auth/register` | Registra un usuario y devuelve JWT |
| POST | `/api/auth/login` | Autentica usuario y devuelve JWT |
| POST | `/api/auth/forgot-password` | Solicita correo de recuperacion |
| POST | `/api/auth/reset-password` | Restablece contrasena con token |

## POST /api/auth/register

Registra un usuario activo con rol `admin`.

Parametros requeridos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `nombre` | string | Si | Nombre del usuario |
| `correo` | string | Si | Correo con formato valido |
| `password` | string | Si | Minimo 8 caracteres, con letra y numero |
| `confirmPassword` | string | Si | Debe coincidir con `password` |

Request:

```json
{
  "nombre": "Admin",
  "correo": "admin@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

Respuesta esperada `201`:

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

## POST /api/auth/login

Valida credenciales y devuelve un JWT con expiracion de 8 horas.

Parametros requeridos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `correo` | string | Si | Correo registrado |
| `password` | string | Si | Contrasena del usuario |

Request:

```json
{
  "correo": "admin@example.com",
  "password": "Password123"
}
```

Respuesta esperada `200`:

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

## POST /api/auth/forgot-password

Solicita un enlace de recuperacion. Si el correo existe, se crea un token aleatorio, se guarda solo su hash y se envia el link por correo externo.

Parametros requeridos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `correo` | string | Si | Correo de la cuenta |

Request:

```json
{
  "correo": "admin@example.com"
}
```

Respuesta esperada `200`:

```json
{
  "ok": true,
  "message": "Si el correo existe, enviaremos instrucciones para recuperar la contrasena."
}
```

## POST /api/auth/reset-password

Actualiza la contrasena usando un token de recuperacion valido. El token expira en 30 minutos y solo puede usarse una vez.

Parametros requeridos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `token` | string | Si | Token recibido por correo |
| `password` | string | Si | Nueva contrasena |
| `confirmPassword` | string | Si | Confirmacion de la nueva contrasena |

Request:

```json
{
  "token": "TOKEN_DEL_CORREO",
  "password": "NuevoPassword123",
  "confirmPassword": "NuevoPassword123"
}
```

Respuesta esperada `200`:

```json
{
  "ok": true,
  "message": "Contrasena actualizada correctamente."
}
```

Errores comunes:

| Codigo | Caso |
| --- | --- |
| 400 | Datos invalidos, passwords no coinciden o token expirado |
| 401 | Credenciales incorrectas |
| 409 | Correo ya registrado |
