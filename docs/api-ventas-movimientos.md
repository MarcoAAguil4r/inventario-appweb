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
| POST | `/api/ventas` | Registra una venta con uno o varios productos |
| POST | `/api/productos/:id/venta` | Registra venta y descuenta stock |
| POST | `/api/productos/:id/danado` | Registra producto danado vendible |
| POST | `/api/productos/:id/merma` | Registra perdida o merma |
| GET | `/api/productos/movimientos/recientes` | Lista movimientos recientes |
| GET | `/api/productos/:id/movimientos` | Lista movimientos de un producto |
| GET | `/api/productos/resumen/dia?fecha=YYYY-MM-DD` | Devuelve resumen operativo de una fecha |

## POST /api/ventas

Registra una venta en una sola transaccion. Consolida productos repetidos, valida pertenencia del usuario, productos activos y stock suficiente antes de modificar existencias. El backend obtiene los precios desde la base de datos, calcula subtotales por linea, suma el total general y guarda el precio aplicado en `detalle_venta`.

Parametros requeridos:

| Campo | Ubicacion | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- | --- |
| `productos` | body | array | Si | Lineas de productos vendidos |
| `productos[].id_producto` | body | number | Si | ID del producto |
| `productos[].cantidad` | body | number | Si | Cantidad entera mayor a 0 |
| `nota` | body | string | No | Observacion de la venta |

Request:

```json
{
  "productos": [
    {
      "id_producto": 1,
      "cantidad": 2
    },
    {
      "id_producto": 5,
      "cantidad": 1
    }
  ],
  "nota": "Venta mostrador"
}
```

Respuesta esperada `201`:

```json
{
  "venta": {
    "id_venta": 80,
    "total": 150,
    "nota": "Venta mostrador"
  },
  "detalles": [
    {
      "id_detalle_venta": 1,
      "id_venta": 80,
      "id_producto": 1,
      "producto": "Cafe",
      "cantidad": 2,
      "precio_unitario": 65,
      "subtotal": 130
    },
    {
      "id_detalle_venta": 2,
      "id_venta": 80,
      "id_producto": 5,
      "producto": "Azucar",
      "cantidad": 1,
      "precio_unitario": 20,
      "subtotal": 20
    }
  ],
  "total": 150,
  "movimientos": [
    {
      "id_movimiento": 50,
      "id_producto": 1,
      "producto": "Cafe",
      "tipo_movimiento": "venta",
      "cantidad": 2,
      "stock_anterior": 10,
      "stock_nuevo": 8,
      "motivo": "Venta 80 | subtotal 130.00 | nota: Venta mostrador",
      "fecha": "2026-07-14T12:00:00.000Z"
    }
  ]
}
```

Si una linea no tiene stock suficiente, toda la venta se rechaza y no se descuenta ningun producto.

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

Registra una perdida definitiva de inventario. El responsable se toma del JWT, el cliente no puede definirlo y el costo de perdida se calcula automaticamente con `cantidad * precio_compra`.

Parametros requeridos:

| Campo | Ubicacion | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- | --- |
| `id` | path | number | Si | ID del producto |
| `cantidad` | body | number | Si | Cantidad entera mayor a 0 |
| `motivo` | body | string | Si | Motivo de la perdida |

Request:

```json
{
  "cantidad": 1,
  "motivo": "Producto caducado"
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

Devuelve ventas confirmadas, perdidas por mermas y balance de una fecha especifica.
Si `fecha` se omite, usa el dia actual del negocio. La fecha se valida con formato
`YYYY-MM-DD` y los limites del dia se calculan con zona horaria `America/Mexico_City`.
Las ventas con estado `CANCELADA` no se incluyen.

Parametros opcionales:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `fecha` | query | No | Fecha local del resumen en formato `YYYY-MM-DD` |

Respuesta esperada `200`:

```json
{
  "fecha": "2026-07-15",
  "zona_horaria": "America/Mexico_City",
  "ventas_confirmadas": 500,
  "perdidas": 80,
  "balance": 420
}
```

Respuesta esperada `400`:

```json
{
  "error": "Fecha invalida. Usa formato YYYY-MM-DD."
}
```

Errores comunes:

| Codigo | Caso |
| --- | --- |
| 400 | Fecha invalida |
| 401 | Token faltante, invalido o expirado |
