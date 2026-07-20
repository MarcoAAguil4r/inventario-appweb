import { mapProducto } from './productDetail.js';

function parseInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(', ');
}

export function validateWastePayload(body) {
  const cantidad = parseInteger(body.cantidad);
  const motivo = String(body.motivo ?? '').trim();

  if (Number.isNaN(cantidad) || cantidad <= 0 || !motivo) {
    return { error: 'Cantidad entera y motivo son requeridos.' };
  }

  return {
    data: {
      cantidad,
      motivo,
    },
  };
}

async function getTableColumns(connection, tableName, columnNames) {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME IN (${placeholders(columnNames.length)})`,
    [tableName, ...columnNames],
  );

  return new Set(columns.map((column) => column.COLUMN_NAME));
}

async function insertInventoryMovement(connection, movimiento) {
  const columns = ['id_producto', 'tipo_movimiento', 'cantidad', 'stock_anterior', 'stock_nuevo', 'motivo'];
  const values = [
    movimiento.id_producto,
    movimiento.tipo_movimiento,
    movimiento.cantidad,
    movimiento.stock_anterior,
    movimiento.stock_nuevo,
    movimiento.motivo,
  ];
  const movementColumns = await getTableColumns(connection, 'movimientos_inventario', ['id_usuario']);

  if (movementColumns.has('id_usuario')) {
    columns.push('id_usuario');
    values.push(movimiento.id_usuario);
  }

  await connection.execute(
    `INSERT INTO movimientos_inventario (${columns.join(', ')})
     VALUES (${placeholders(columns.length)})`,
    values,
  );
}

export function mapWaste(row) {
  return {
    ...row,
    cantidad: Number(row.cantidad),
    costo_perdida: Number(row.costo_perdida),
    id_usuario: Number(row.id_usuario),
    responsable: row.responsable ?? null,
    fecha: row.fecha ?? row.creado_en,
  };
}

export async function listProductWastes({ idUsuario, queryFn }) {
  const mermas = await queryFn(
    `SELECT
      m.id_merma,
      m.id_producto,
      p.nombre AS producto,
      m.cantidad,
      m.motivo,
      m.costo_perdida,
      m.id_usuario,
      u.nombre AS responsable,
      m.creado_en,
      m.creado_en AS fecha
     FROM mermas m
     INNER JOIN productos p ON p.id_producto = m.id_producto
     LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario
     WHERE p.id_usuario = ?
     ORDER BY m.creado_en DESC, m.id_merma DESC
     LIMIT 20`,
    [idUsuario],
  );

  return mermas.map(mapWaste);
}

export async function registerProductWaste({ idParam, idUsuario, body, withTransactionFn }) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: 400,
      body: { error: 'Producto invalido.' },
    };
  }

  const parsed = validateWastePayload(body);

  if (parsed.error) {
    return {
      status: 400,
      body: { error: parsed.error },
    };
  }

  const result = await withTransactionFn(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
      [id, idUsuario],
    );
    const producto = rows[0];

    if (!producto) return { status: 404, body: { error: 'Producto no encontrado.' } };
    if (!producto.activo) return { status: 400, body: { error: 'No se puede modificar un producto desactivado.' } };
    if (Number(producto.stock_actual) < parsed.data.cantidad) {
      return { status: 400, body: { error: 'Stock insuficiente.' } };
    }

    const stockAnterior = Number(producto.stock_actual);
    const stockNuevo = stockAnterior - parsed.data.cantidad;
    const costoPerdida = parsed.data.cantidad * Number(producto.precio_compra);

    await connection.execute(
      'UPDATE productos SET stock_actual = ? WHERE id_producto = ? AND id_usuario = ?',
      [stockNuevo, id, idUsuario],
    );
    await connection.execute(
      'INSERT INTO mermas (id_producto, id_usuario, cantidad, motivo, costo_perdida) VALUES (?, ?, ?, ?, ?)',
      [id, idUsuario, parsed.data.cantidad, parsed.data.motivo, costoPerdida],
    );
    await insertInventoryMovement(connection, {
      id_producto: id,
      id_usuario: idUsuario,
      tipo_movimiento: 'merma',
      cantidad: parsed.data.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      motivo: parsed.data.motivo,
    });

    const [updatedRows] = await connection.execute(
      'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
      [id, idUsuario],
    );

    return {
      status: 201,
      body: mapProducto(updatedRows[0]),
    };
  });

  return result;
}
