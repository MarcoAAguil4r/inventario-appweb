# API externa: Resend Email API

## Funcion

El sistema integra Resend Email API para enviar correos transaccionales. Esta integracion se usa para recuperar contrasenas, enviar alertas de bajo stock y ejecutar una prueba manual de envio desde la API propia.

Archivo de integracion:

```txt
backend/src/services/email.js
```

Endpoint externo utilizado:

```http
POST https://api.resend.com/emails
```

## Configuracion requerida

Variables de entorno:

| Variable | Requerida | Descripcion |
| --- | --- | --- |
| `EMAIL_PROVIDER` | Si | Debe ser `resend` para envio real |
| `RESEND_API_KEY` | Si | API key privada de Resend |
| `EMAIL_FROM` | Si | Remitente autorizado por Resend |
| `ALERT_EMAIL_TO` | Si para alertas | Destinatario de alertas de inventario |
| `RESET_PASSWORD_URL` | Si para recuperacion | URL del frontend para restablecer contrasena |

Ejemplo:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Inventario <onboarding@resend.dev>
ALERT_EMAIL_TO=admin@example.com
RESET_PASSWORD_URL=https://inventario-appweb-frontend.vercel.app/reset-password
```

## Autenticacion con Resend

La llamada externa usa Bearer Token en el header `Authorization`.

Headers enviados:

```http
Authorization: Bearer RESEND_API_KEY
Content-Type: application/json
```

La API key no se escribe en el codigo fuente. Se lee desde variables de entorno en Railway.

## Payload enviado a Resend

Parametros requeridos por el backend:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `from` | string | Si | Remitente configurado en `EMAIL_FROM` |
| `to` | string | Si | Destinatario del correo |
| `subject` | string | Si | Asunto del correo |
| `html` | string | No | Cuerpo HTML |
| `text` | string | No | Cuerpo en texto plano |

Ejemplo de payload externo:

```json
{
  "from": "Inventario <onboarding@resend.dev>",
  "to": "admin@example.com",
  "subject": "Recuperacion de contrasena",
  "html": "<p>Usa este enlace para cambiar tu contrasena.</p>",
  "text": "Usa este enlace para cambiar tu contrasena."
}
```

## Respuesta esperada

Resend responde con un identificador de correo. El backend normaliza la respuesta para no exponer detalles internos del proveedor.

Respuesta normalizada:

```json
{
  "provider": "resend",
  "external_id": "email_id_de_resend",
  "delivered": true,
  "to": "admin@example.com",
  "subject": "Recuperacion de contrasena"
}
```

## Uso dentro del sistema

### Recuperacion de contrasena

Endpoint propio que dispara la integracion:

```http
POST /api/auth/forgot-password
```

Flujo:

1. El usuario envia su correo.
2. El backend genera un token aleatorio.
3. Guarda solo el hash del token.
4. Construye el enlace con `RESET_PASSWORD_URL`.
5. Envia el correo mediante Resend.

Respuesta de la API propia:

```json
{
  "ok": true,
  "message": "Si el correo existe, enviaremos instrucciones para recuperar la contrasena."
}
```

### Alerta de bajo stock

Endpoint propio que puede disparar la integracion:

```http
POST /api/productos/:id/venta
```

Condicion:

- Si despues de vender, `stock_actual <= stock_minimo`, se envia correo de alerta.

Respuesta esperada con evidencia:

```json
{
  "alerta": {
    "provider": "resend",
    "external_id": "email_id_de_resend",
    "delivered": true,
    "subject": "Stock bajo: Cafe"
  }
}
```

### Prueba directa

Endpoint propio para validar la integracion:

```http
POST /api/alertas/email-prueba
```

Parametros requeridos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `asunto` | string | No | Asunto del correo |
| `mensaje` | string | Si | Mensaje minimo de 10 caracteres |

Request:

```json
{
  "asunto": "Prueba Resend",
  "mensaje": "Mensaje de prueba para validar la integracion externa."
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "integration": "email",
  "email": {
    "provider": "resend",
    "external_id": "email_id_de_resend",
    "delivered": true
  }
}
```

## Manejo de errores

| Codigo | Caso |
| --- | --- |
| 400 | Faltan asunto o contenido |
| 500 | Falta configuracion de variables de entorno |
| 502 | Resend rechazo el envio |

Notas de seguridad:

- `RESEND_API_KEY` se configura solo como variable de entorno.
- La API key no debe subirse al repositorio.
- El token de recuperacion de contrasena no se devuelve por JSON.
- Solo se guarda el hash del token en la base de datos.
