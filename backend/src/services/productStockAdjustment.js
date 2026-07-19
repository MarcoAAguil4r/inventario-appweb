import { mapProducto } from './productDetail.js';

function parseInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
}

export function validateStockAdjustment(body) {
  const tipo = String(body.tipo ?? '').trim();
  const cantidad = parseInteger(body.cantidad);
  const motivo = String(body.motivo ?? '').trim();

  if (!['entrada', 'salida'].includes(tipo)) {
    return { error: 'Tipo de ajuste invalido.' };
  }

  if (Number.isNaN(cantidad) || cantidad <= 0) {
    return { error: 'La cantidad debe ser un entero mayor que cero.' };
  }

  if (!motivo) {
    return { error: 'El motivo es requerido.' };
  }

  return {
    data: {
      tipo,
      cantidad,
      motivo,
    },
  };
}

export async function adjustProductStock({ idParam, idUsuario, body, withTransactionFn }) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: 400,
      body: { error: 'Producto invalido.' },
    };
  }

  const parsed = validateStockAdjustment(body);

  if (parsed.error) {
    return {
      status: 400,
      body: { error: parsed.error },
    };
  }

  const result = await withTransactionFn(async (connection) => {
    const [productos] = await connection.execute(
      'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
      [id, idUsuario],
    );
    const producto = productos[0];

    if (!producto) return { status: 404, body: { error: 'Producto no encontrado.' } };

    const stockAnterior = Number(producto.stock_actual);
    const stockNuevo =
      parsed.data.tipo === 'entrada'
        ? stockAnterior + parsed.data.cantidad
        : stockAnterior - parsed.data.cantidad;

    if (stockNuevo < 0) {
      return {
        status: 400,
        body: { error: 'Stock insuficiente para completar el ajuste.' },
      };
    }

    await connection.execute('UPDATE productos SET stock_actual = ? WHERE id_producto = ? AND id_usuario = ?', [
      stockNuevo,
      id,
      idUsuario,
    ]);

    const tipoMovimiento = parsed.data.tipo === 'entrada' ? 'ajuste_entrada' : 'ajuste_salida';
    const [movementResult] = await connection.execute(
      `INSERT INTO movimientos_inventario
        (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tipoMovimiento, parsed.data.cantidad, stockAnterior, stockNuevo, parsed.data.motivo],
    );

    const [productosActualizados] = await connection.execute(
      'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
      [id, idUsuario],
    );
    const [movimientos] = await connection.execute(
      `SELECT
        m.id_movimiento,
        m.id_producto,
        p.nombre AS producto,
        m.tipo_movimiento,
        m.cantidad,
        m.stock_anterior,
        m.stock_nuevo,
        m.motivo,
        m.fecha
       FROM movimientos_inventario m
       INNER JOIN productos p ON p.id_producto = m.id_producto
       WHERE m.id_movimiento = ? AND p.id_usuario = ?
       LIMIT 1`,
      [movementResult.insertId, idUsuario],
    );

    return {
      status: 201,
      body: {
        producto: mapProducto(productosActualizados[0]),
        movimiento: {
          ...movimientos[0],
          cantidad: Number(movimientos[0].cantidad),
          stock_anterior: Number(movimientos[0].stock_anterior),
          stock_nuevo: Number(movimientos[0].stock_nuevo),
        },
      },
    };
  });

  return result;
}
