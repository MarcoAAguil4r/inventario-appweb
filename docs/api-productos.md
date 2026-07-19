# API de gestion de productos

## Funcion

La API de productos administra el catalogo de inventario de cada usuario autenticado. Permite listar, crear, actualizar, desactivar y consultar productos danados o mermas asociadas al inventario.

Base URL:

```txt
https://backend-production-a051.up.railway.app
```

Todas las rutas requieren autenticacion:

```txt
Authorization: Bearer <token>
```

Formato:

- Request: `Content-Type: application/json`
- Response: JSON

## Endpoints principales

| Metodo | Endpoint | Funcion |
| --- | --- | --- |
| GET | `/api/productos` | Lista productos del usuario |
| GET | `/api/productos/:id` | Consulta el detalle de un producto del usuario |
| POST | `/api/productos` | Crea un producto |
| PUT | `/api/productos/:id` | Actualiza un producto |
| POST | `/api/productos/:id/ajustes` | Registra entrada o salida manual de stock |
| PATCH | `/api/productos/:id/desactivar` | Desactiva un producto |
| GET | `/api/productos/danados-vendibles` | Lista productos danados vendibles |
| GET | `/api/productos/mermas` | Lista mermas registradas |

## GET /api/productos

Devuelve los productos pertenecientes al usuario autenticado.

Parametros requeridos:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `Authorization` | header | Si | Token JWT |

Respuesta esperada `200`:

```json
[
  {
    "id_producto": 1,
    "nombre": "Cafe",
    "categoria": "Abarrotes",
    "precio_compra": 40,
    "precio_venta": 65,
    "stock_actual": 10,
    "stock_minimo": 2,
    "activo": true,
    "estado": "disponible"
  }
]
```

## GET /api/productos/:id

Devuelve el detalle de un producto por identificador. La consulta filtra por el usuario autenticado, por lo que un producto inexistente o perteneciente a otro usuario responde como no encontrado.

Parametros requeridos:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `Authorization` | header | Si | Token JWT |
| `id` | path | Si | ID numerico del producto |

Respuesta esperada `200`:

```json
{
  "id_producto": 1,
  "nombre": "Cafe",
  "categoria": "Abarrotes",
  "precio_compra": 40,
  "precio_venta": 65,
  "stock_actual": 5,
  "stock_minimo": 2,
  "activo": true,
  "estado": "disponible"
}
```

Los productos inactivos tambien pueden consultarse y conservan su estado:

```json
{
  "id_producto": 1,
  "nombre": "Cafe",
  "categoria": "Abarrotes",
  "precio_compra": 40,
  "precio_venta": 65,
  "stock_actual": 5,
  "stock_minimo": 2,
  "activo": false,
  "estado": "desactivado"
}
```

## POST /api/productos

Crea un producto y registra un movimiento inicial de inventario.

Parametros requeridos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `nombre` | string | Si | Nombre del producto |
| `categoria` | string | Si | Categoria del producto |
| `precio_compra` | number | Si | Costo de compra, minimo 0 |
| `precio_venta` | number | Si | Precio de venta, minimo 0 |
| `stock_actual` | number | Si | Existencia inicial, minimo 0 |
| `stock_minimo` | number | Si | Umbral de bajo stock, minimo 0 |

Request:

```json
{
  "nombre": "Cafe",
  "categoria": "Abarrotes",
  "precio_compra": 40,
  "precio_venta": 65,
  "stock_actual": 10,
  "stock_minimo": 2
}
```

Respuesta esperada `201`:

```json
{
  "id_producto": 1,
  "nombre": "Cafe",
  "categoria": "Abarrotes",
  "precio_compra": 40,
  "precio_venta": 65,
  "stock_actual": 10,
  "stock_minimo": 2,
  "activo": true,
  "estado": "disponible"
}
```

## PUT /api/productos/:id

Actualiza los datos generales de un producto sin modificar el stock actual. Los cambios de stock deben realizarse desde los modulos operativos que registran trazabilidad.

Parametros requeridos:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | path | Si | ID numerico del producto |
| `nombre` | body | Si | Nombre actualizado |
| `categoria` | body | Si | Categoria actualizada |
| `precio_compra` | body | Si | Costo actualizado |
| `precio_venta` | body | Si | Precio actualizado |
| `stock_minimo` | body | Si | Stock minimo actualizado |

Request:

```json
{
  "nombre": "Cafe molido",
  "categoria": "Abarrotes",
  "precio_compra": 42,
  "precio_venta": 68,
  "stock_minimo": 2
}
```

Respuesta esperada `200`: producto actualizado en formato JSON conservando `stock_actual`.

Si el payload incluye `stock_actual`, la API responde `400` y no modifica el producto.

## POST /api/productos/:id/ajustes

Registra una entrada o salida manual de stock. La actualizacion del producto y el movimiento historico se ejecutan en una transaccion.

Parametros requeridos:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | path | Si | ID numerico del producto |
| `tipo` | body | Si | `entrada` o `salida` |
| `cantidad` | body | Si | Entero mayor que cero |
| `motivo` | body | Si | Motivo del ajuste |

Request:

```json
{
  "tipo": "entrada",
  "cantidad": 10,
  "motivo": "Correccion por conteo fisico"
}
```

Respuesta esperada `201`:

```json
{
  "producto": {
    "id_producto": 10,
    "nombre": "Cafe",
    "categoria": "Abarrotes",
    "precio_compra": 40,
    "precio_venta": 65,
    "stock_actual": 30,
    "stock_minimo": 2,
    "activo": true,
    "estado": "disponible"
  },
  "movimiento": {
    "id_movimiento": 50,
    "id_producto": 10,
    "producto": "Cafe",
    "tipo_movimiento": "ajuste_entrada",
    "cantidad": 10,
    "stock_anterior": 20,
    "stock_nuevo": 30,
    "motivo": "Correccion por conteo fisico",
    "fecha": "2026-07-14T12:00:00.000Z"
  }
}
```

Para salidas, la API usa `ajuste_salida` y rechaza la operacion si el stock quedaria negativo.

## PATCH /api/productos/:id/desactivar

Marca un producto como inactivo y registra un movimiento de desactivacion.

Parametros requeridos:

| Parametro | Ubicacion | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | path | Si | ID numerico del producto |
| `motivo` | body | No | Motivo de desactivacion |

Request:

```json
{
  "motivo": "Producto descontinuado"
}
```

Respuesta esperada `200`:

```json
{
  "id_producto": 1,
  "nombre": "Cafe",
  "activo": false,
  "estado": "desactivado"
}
```

## GET /api/productos/danados-vendibles

Lista productos danados marcados como vendibles.

Respuesta esperada `200`: arreglo JSON con productos danados, cantidad, precio reducido y descripcion del dano.

## GET /api/productos/mermas

Lista mermas registradas para productos del usuario.

Respuesta esperada `200`: arreglo JSON con producto, cantidad, motivo, costo de perdida y fecha.

Errores comunes:

| Codigo | Caso |
| --- | --- |
| 400 | Datos invalidos o negativos |
| 401 | Token faltante, invalido o expirado |
| 404 | Producto no encontrado |
