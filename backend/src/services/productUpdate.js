import { mapProducto } from './productDetail.js';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function hasField(body, field) {
  return Object.prototype.hasOwnProperty.call(body ?? {}, field);
}

export function validateProductUpdate(body) {
  if (hasField(body, 'stock_actual')) {
    return { error: 'stock_actual no puede modificarse desde la edicion general.' };
  }

  const nombre = String(body.nombre ?? '').trim();
  const categoria = String(body.categoria ?? '').trim();
  const precioCompra = toNumber(body.precio_compra);
  const precioVenta = toNumber(body.precio_venta);
  const stockMinimo = toNumber(body.stock_minimo);

  if (!nombre || !categoria) {
    return { error: 'Nombre y categoria son requeridos.' };
  }

  if ([precioCompra, precioVenta, stockMinimo].some((value) => Number.isNaN(value) || value < 0)) {
    return { error: 'Precios y stock minimo deben ser numeros mayores o iguales a cero.' };
  }

  if (!Number.isInteger(stockMinimo)) {
    return { error: 'El stock minimo debe ser un numero entero.' };
  }

  return {
    data: {
      nombre,
      categoria,
      precio_compra: precioCompra,
      precio_venta: precioVenta,
      stock_minimo: stockMinimo,
    },
  };
}

export async function updateProductGeneral({ idParam, idUsuario, body, withTransactionFn }) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: 400,
      body: { error: 'Producto invalido.' },
    };
  }

  const parsed = validateProductUpdate(body);

  if (parsed.error) {
    return {
      status: 400,
      body: { error: parsed.error },
    };
  }

  const producto = await withTransactionFn(async (connection) => {
    const [actualRows] = await connection.execute(
      'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
      [id, idUsuario],
    );
    const actual = actualRows[0];

    if (!actual) return null;

    await connection.execute(
      `UPDATE productos
       SET nombre = ?, categoria = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?
       WHERE id_producto = ? AND id_usuario = ?`,
      [
        parsed.data.nombre,
        parsed.data.categoria,
        parsed.data.precio_compra,
        parsed.data.precio_venta,
        parsed.data.stock_minimo,
        id,
        idUsuario,
      ],
    );

    const [updatedRows] = await connection.execute(
      'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
      [id, idUsuario],
    );

    return updatedRows[0];
  });

  if (!producto) {
    return {
      status: 404,
      body: { error: 'Producto no encontrado.' },
    };
  }

  return {
    status: 200,
    body: mapProducto(producto),
  };
}
