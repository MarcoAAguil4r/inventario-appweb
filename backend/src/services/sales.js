function parseInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
}

export function validateSalePayload(body) {
  const productos = Array.isArray(body.productos) ? body.productos : [];
  const nota = String(body.nota ?? '').trim();
  const consolidated = new Map();

  if (productos.length === 0) {
    return { error: 'La venta debe contener al menos un producto.' };
  }

  for (const item of productos) {
    const idProducto = parseInteger(item?.id_producto);
    const cantidad = parseInteger(item?.cantidad);

    if (Number.isNaN(idProducto) || idProducto <= 0) {
      return { error: 'Todos los productos deben tener un ID valido.' };
    }

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      return { error: 'Todas las cantidades deben ser enteras mayores que cero.' };
    }

    consolidated.set(idProducto, (consolidated.get(idProducto) ?? 0) + cantidad);
  }

  return {
    data: {
      productos: [...consolidated.entries()].map(([id_producto, cantidad]) => ({ id_producto, cantidad })),
      nota,
    },
  };
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(', ');
}

function mapMovimiento(row) {
  return {
    ...row,
    cantidad: Number(row.cantidad),
    stock_anterior: Number(row.stock_anterior),
    stock_nuevo: Number(row.stock_nuevo),
  };
}

function createSaleFolio() {
  return `V${Date.now().toString(36).toUpperCase()}`.slice(0, 20);
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

async function getDetailSaleIdColumn(connection) {
  const columns = await getTableColumns(connection, 'detalle_venta', ['id_detalle_venta', 'id_detalle']);

  return columns.has('id_detalle_venta') ? 'id_detalle_venta' : 'id_detalle';
}

export async function createSale({ idUsuario, body, withTransactionFn }) {
  const parsed = validateSalePayload(body);

  if (parsed.error) {
    return {
      status: 400,
      body: { error: parsed.error },
    };
  }

  return withTransactionFn(async (connection) => {
    const ids = parsed.data.productos.map((item) => item.id_producto);
    const [productosRows] = await connection.execute(
      `SELECT * FROM productos WHERE id_usuario = ? AND id_producto IN (${placeholders(ids.length)}) FOR UPDATE`,
      [idUsuario, ...ids],
    );
    const productsById = new Map(productosRows.map((producto) => [Number(producto.id_producto), producto]));

    for (const item of parsed.data.productos) {
      const producto = productsById.get(item.id_producto);

      if (!producto) {
        return { status: 404, body: { error: 'Producto no encontrado.' } };
      }

      if (!producto.activo) {
        return { status: 400, body: { error: 'Solo pueden venderse productos activos.' } };
      }

      if (item.cantidad > Number(producto.stock_actual)) {
        return { status: 400, body: { error: 'Stock insuficiente para completar la venta.' } };
      }
    }

    const total = parsed.data.productos.reduce((sum, item) => {
      const producto = productsById.get(item.id_producto);
      return sum + item.cantidad * Number(producto.precio_venta);
    }, 0);

    const salesColumns = await getTableColumns(connection, 'ventas', ['folio', 'nota', 'estado']);
    const insertColumns = ['id_usuario', 'total'];
    const insertValues = [idUsuario, total];

    if (salesColumns.has('folio')) {
      insertColumns.push('folio');
      insertValues.push(createSaleFolio());
    }

    if (salesColumns.has('nota')) {
      insertColumns.push('nota');
      insertValues.push(parsed.data.nota || null);
    }

    if (salesColumns.has('estado')) {
      insertColumns.push('estado');
      insertValues.push('CONFIRMADA');
    }

    const [saleResult] = await connection.execute(
      `INSERT INTO ventas (${insertColumns.join(', ')}) VALUES (${placeholders(insertColumns.length)})`,
      insertValues,
    );
    const idVenta = saleResult.insertId;
    const movimientosIds = [];

    for (const item of parsed.data.productos) {
      const producto = productsById.get(item.id_producto);
      const stockAnterior = Number(producto.stock_actual);
      const stockNuevo = stockAnterior - item.cantidad;
      const precioUnitario = Number(producto.precio_venta);
      const subtotal = item.cantidad * precioUnitario;

      await connection.execute(
        'UPDATE productos SET stock_actual = ? WHERE id_producto = ? AND id_usuario = ?',
        [stockNuevo, item.id_producto, idUsuario],
      );
      await connection.execute(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [idVenta, item.id_producto, item.cantidad, precioUnitario, subtotal],
      );
      const motivo = [
        `Venta ${idVenta}`,
        `subtotal ${subtotal.toFixed(2)}`,
        parsed.data.nota ? `nota: ${parsed.data.nota}` : '',
      ]
        .filter(Boolean)
        .join(' | ');
      const [movementResult] = await connection.execute(
        `INSERT INTO movimientos_inventario
          (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item.id_producto, 'venta', item.cantidad, stockAnterior, stockNuevo, motivo],
      );

      movimientosIds.push(movementResult.insertId);
    }

    const detailIdColumn = await getDetailSaleIdColumn(connection);
    const [detalle] = await connection.execute(
      `SELECT
        d.${detailIdColumn} AS id_detalle_venta,
        d.id_venta,
        d.id_producto,
        p.nombre AS producto,
        d.cantidad,
        d.precio_unitario,
        d.subtotal
       FROM detalle_venta d
       INNER JOIN productos p ON p.id_producto = d.id_producto
       WHERE d.id_venta = ?
       ORDER BY d.${detailIdColumn} ASC`,
      [idVenta],
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
       WHERE m.id_movimiento IN (${placeholders(movimientosIds.length)})
       ORDER BY m.id_movimiento ASC`,
      movimientosIds,
    );

    const detalles = detalle.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    }));

    return {
      status: 201,
      body: {
        venta: {
          id_venta: idVenta,
          total,
          nota: parsed.data.nota || null,
        },
        detalles,
        detalle: detalles,
        total,
        movimientos: movimientos.map(mapMovimiento),
      },
    };
  });
}
