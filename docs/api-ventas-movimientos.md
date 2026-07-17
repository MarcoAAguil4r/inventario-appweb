# API de ventas y movimientos de inventario

## Funcion

La API de ventas y movimientos registra salidas de inventario, productos danados, mermas y consultas de historial. Cada operacion valida stock, pertenece al usuario autenticado y registra trazabilidad en `movimientos_inventario`.

Base URL:

```txt
https://backend-production-a051.up.railway.app
```

Todas las rutas requieren:

```txt
Authorization: Bearer <token>
```

## Endpoints principales

| Metodo | Endpoint | Funcion |
| --- | --- | --- |
| POST | `/api/productos/:id/venta` | Registra venta y descuenta stock |
| POST | `/api/productos/:id/danado` | Registra producto danado vendible |
| POST | `/api/productos/:id/merma` | Registra perdida o merma |
| GET | `/api/productos/movimientos/recientes` | Lista movimientos recientes |
| GET | `/api/productos/:id/movimientos` | Lista movimientos de un producto |
| GET | `/api/productos/resumen/dia` | Devuelve resumen financiero del dia |

## POST /api/productos/:id/venta

Registra una venta, calcula el total y descuenta unidades del stock. Si el stock queda menor o igual al minimo, puede disparar una alerta externa por correo.

Parametros requeridos:

| Campo | Ubicacion | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- | --- |
| `id` | path | number | Si | ID del producto vendido |
| `cantidad` | body | number | Si | Cantidad entera mayor a 0 |
| `precio_unitario` | body | number | No | Precio usado para la venta |
| `nota` | body | string | No | Observacion de la venta |

Request:

```json
{
  "cantidad": 1,
  "precio_unitario": 65,
  "nota": "venta mostrador"
}
```

Respuesta esperada `201`:

```json
{
  "producto": {
    "id_producto": 1,
    "nombre": "Cafe",
    "stock_actual": 9,
    "stock_minimo": 2,
    "estado": "disponible"
  },
  "total": 65,
  "alerta": null
}
```

Respuesta esperada con bajo stock:

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
    "provider": "resend",
    "external_id": "email_id",
    "delivered": true,
    "subject": "Stock bajo: Cafe"
  }
}
```

## POST /api/productos/:id/danado

Registra unidades danadas pero vendibles con precio reducido. Descuenta el stock del producto original.

Parametros requeridos:

| Campo | Ubicacion | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- | --- |
| `id` | path | number | Si | ID del producto |
| `cantidad` | body | number | Si | Cantidad mayor a 0 |
| `precio_reducido` | body | number | Si | Precio de venta reducido |
| `descripcion_dano` | body | string | Si | Descripcion del dano |

Request:

```json
{
  "cantidad": 1,
  "precio_reducido": 30,
  "descripcion_dano": "Empaque maltratado"
}
```

Respuesta esperada `201`: producto actualizado con menor stock.

## POST /api/productos/:id/merma

Registra una perdida definitiva de inventario.

Parametros requeridos:

| Campo | Ubicacion | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- | --- |
| `id` | path | number | Si | ID del producto |
| `cantidad` | body | number | Si | Cantidad mayor a 0 |
| `motivo` | body | string | Si | Motivo de la perdida |
| `costo_perdida` | body | number | Si | Costo asociado a la perdida |

Request:

```json
{
  "cantidad": 1,
  "motivo": "Producto caducado",
  "costo_perdida": 40
}
```

Respuesta esperada `201`: producto actualizado con menor stock.

## GET /api/productos/movimientos/recientes

Devuelve los ultimos 12 movimientos del usuario autenticado.

Respuesta esperada `200`:

```json
[
  {
    "id_movimiento": 10,
    "id_producto": 1,
    "producto": "Cafe",
    "tipo_movimiento": "venta",
    "cantidad": 1,
    "stock_anterior": 10,
    "stock_nuevo": 9,
    "motivo": "Venta registrada por 1 unidad(es)",
    "fecha": "2026-07-05T17:00:00.000Z"
  }
]
```

## GET /api/productos/:id/movimientos

Lista el historial completo de movimientos de un producto.

Parametros requeridos:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | path | Si | ID numerico del producto |

Respuesta esperada `200`: arreglo JSON de movimientos asociados al producto.

## GET /api/productos/resumen/dia

Devuelve ventas, perdidas, valor danado vendible y balance potencial del dia actual.

Respuesta esperada `200`:

```json
{
  "margen_potencial": 100,
  "ganancia_potencial": 100,
  "ventas_dia": 65,
  "perdidas": 40,
  "valor_danado_vendible": 30,
  "balance_potencial": 25
}
```

Errores comunes:

| Codigo | Caso |
| --- | --- |
| 400 | Cantidad invalida o stock insuficiente |
| 401 | Token faltante, invalido o expirado |
| 404 | Producto no encontrado |
