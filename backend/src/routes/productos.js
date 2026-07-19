import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendInventoryAlert } from '../services/email.js';
import { getProductDetail, mapProducto } from '../services/productDetail.js';
import { adjustProductStock } from '../services/productStockAdjustment.js';
import { updateProductGeneral } from '../services/productUpdate.js';
import { listProductWastes, registerProductWaste } from '../services/productWaste.js';
import { getOperationalSummary } from '../services/operationalSummary.js';

const router = Router();
const requireAdmin = requireRole('admin');

router.use(requireAuth);

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function validarProducto(body) {
  const nombre = String(body.nombre ?? '').trim();
  const categoria = String(body.categoria ?? '').trim();
  const precioCompra = toNumber(body.precio_compra);
  const precioVenta = toNumber(body.precio_venta);
  const stockActual = toNumber(body.stock_actual);
  const stockMinimo = toNumber(body.stock_minimo);

  if (!nombre || !categoria) {
    return { error: 'Nombre y categoría son requeridos.' };
  }

  if ([precioCompra, precioVenta, stockActual, stockMinimo].some((value) => Number.isNaN(value) || value < 0)) {
    return { error: 'Precios y stocks deben ser números mayores o iguales a cero.' };
  }

  if (![stockActual, stockMinimo].every(Number.isInteger)) {
    return { error: 'Los stocks deben ser numeros enteros.' };
  }

  return {
    data: {
      nombre,
      categoria,
      precio_compra: precioCompra,
      precio_venta: precioVenta,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
    },
  };
}

async function obtenerProducto(connection, id, idUsuario) {
  const [rows] = await connection.execute(
    'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
    [id, idUsuario],
  );
  return rows[0];
}

async function registrarMovimiento(connection, movimiento) {
  const columns = ['id_producto', 'tipo_movimiento', 'cantidad', 'stock_anterior', 'stock_nuevo', 'motivo'];
  const values = [
    movimiento.id_producto,
    movimiento.tipo_movimiento,
    movimiento.cantidad,
    movimiento.stock_anterior,
    movimiento.stock_nuevo,
    movimiento.motivo,
  ];

  if (movimiento.id_usuario) {
    columns.push('id_usuario');
    values.push(movimiento.id_usuario);
  }

  await connection.execute(
    `INSERT INTO movimientos_inventario (${columns.join(', ')})
     VALUES (${columns.map(() => '?').join(', ')})`,
    values,
  );
}

router.get('/', async (req, res, next) => {
  try {
    const productos = await query(
      'SELECT * FROM productos WHERE id_usuario = ? ORDER BY activo DESC, nombre ASC',
      [req.user.id_usuario],
    );
    return res.json(productos.map(mapProducto));
  } catch (error) {
    return next(error);
  }
});

router.get('/resumen/dia', requireAdmin, async (req, res, next) => {
  try {
    const result = await getOperationalSummary({
      idUsuario: req.user.id_usuario,
      fecha: req.query.fecha,
      queryFn: query,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.get('/movimientos/recientes', requireAdmin, async (req, res, next) => {
  try {
    const movimientos = await query(
      `SELECT
        m.id_movimiento,
        m.id_producto,
        p.nombre AS producto,
        m.tipo_movimiento,
        m.cantidad,
        m.stock_anterior,
        m.stock_nuevo,
        m.motivo,
        m.fecha,
        m.id_usuario,
        u.nombre AS responsable
      FROM movimientos_inventario m
      INNER JOIN productos p ON p.id_producto = m.id_producto
      LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario
      WHERE p.id_usuario = ?
      ORDER BY m.fecha DESC, m.id_movimiento DESC
      LIMIT 12`,
      [req.user.id_usuario],
    );

    return res.json(
      movimientos.map((movimiento) => ({
        ...movimiento,
        cantidad: Number(movimiento.cantidad),
        stock_anterior: Number(movimiento.stock_anterior),
        stock_nuevo: Number(movimiento.stock_nuevo),
      })),
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/movimientos', requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Producto inválido.' });

  try {
    const movimientos = await query(
      `SELECT
        m.id_movimiento,
        m.id_producto,
        p.nombre AS producto,
        m.tipo_movimiento,
        m.cantidad,
        m.stock_anterior,
        m.stock_nuevo,
        m.motivo,
        m.fecha,
        m.id_usuario,
        u.nombre AS responsable
      FROM movimientos_inventario m
      INNER JOIN productos p ON p.id_producto = m.id_producto
      LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario
      WHERE p.id_usuario = ? AND m.id_producto = ?
      ORDER BY m.fecha DESC, m.id_movimiento DESC`,
      [req.user.id_usuario, id],
    );

    return res.json(
      movimientos.map((movimiento) => ({
        ...movimiento,
        cantidad: Number(movimiento.cantidad),
        stock_anterior: Number(movimiento.stock_anterior),
        stock_nuevo: Number(movimiento.stock_nuevo),
      })),
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/danados-vendibles', requireAdmin, async (req, res, next) => {
  try {
    const danados = await query(
      `SELECT
        d.id_producto_danado,
        d.id_producto_original,
        p.nombre AS producto,
        d.cantidad,
        d.precio_reducido,
        d.descripcion_dano,
        d.vendible,
        d.activo,
        d.creado_en
      FROM productos_danados d
      INNER JOIN productos p ON p.id_producto = d.id_producto_original
      WHERE p.id_usuario = ? AND d.vendible = true
      ORDER BY d.creado_en DESC, d.id_producto_danado DESC
      LIMIT 20`,
      [req.user.id_usuario],
    );

    return res.json(
      danados.map((danado) => ({
        ...danado,
        cantidad: Number(danado.cantidad),
        precio_reducido: Number(danado.precio_reducido),
        vendible: Boolean(danado.vendible),
        activo: Boolean(danado.activo),
      })),
    );
  } catch (error) {
    return next(error);
  }
});

router.get('/mermas', requireAdmin, async (req, res, next) => {
  try {
    const mermas = await listProductWastes({
      idUsuario: req.user.id_usuario,
      queryFn: query,
    });

    return res.json(mermas);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await getProductDetail({
      idParam: req.params.id,
      idUsuario: req.user.id_usuario,
      queryFn: query,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  const parsed = validarProducto(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const producto = await withTransaction(async (connection) => {
      const [result] = await connection.execute(
        `INSERT INTO productos
          (id_usuario, nombre, categoria, precio_compra, precio_venta, stock_actual, stock_minimo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id_usuario,
          parsed.data.nombre,
          parsed.data.categoria,
          parsed.data.precio_compra,
          parsed.data.precio_venta,
          parsed.data.stock_actual,
          parsed.data.stock_minimo,
        ],
      );

      await registrarMovimiento(connection, {
        id_producto: result.insertId,
        tipo_movimiento: 'registro_inicial',
        cantidad: parsed.data.stock_actual,
        stock_anterior: 0,
        stock_nuevo: parsed.data.stock_actual,
        motivo: 'Registro inicial de producto',
      });

      return obtenerProducto(connection, result.insertId, req.user.id_usuario);
    });

    return res.status(201).json(mapProducto(producto));
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = await updateProductGeneral({
      idParam: req.params.id,
      idUsuario: req.user.id_usuario,
      body: req.body,
      withTransactionFn: withTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/ajustes', requireAdmin, async (req, res, next) => {
  try {
    const result = await adjustProductStock({
      idParam: req.params.id,
      idUsuario: req.user.id_usuario,
      body: req.body,
      withTransactionFn: withTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/danado', requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const cantidad = toNumber(req.body.cantidad);
  const precioReducido = toNumber(req.body.precio_reducido);
  const descripcion = String(req.body.descripcion_dano ?? '').trim();

  if (!Number.isInteger(id) || !Number.isInteger(cantidad) || cantidad <= 0 || precioReducido < 0 || !descripcion) {
    return res.status(400).json({ error: 'Cantidad, precio reducido y descripción son requeridos.' });
  }

  try {
    const result = await withTransaction(async (connection) => {
      const producto = await obtenerProducto(connection, id, req.user.id_usuario);
      if (!producto) return { status: 404, error: 'Producto no encontrado.' };
      if (!producto.activo) return { status: 400, error: 'No se puede modificar un producto desactivado.' };
      if (Number(producto.stock_actual) < cantidad) return { status: 400, error: 'Stock insuficiente.' };

      const stockNuevo = Number(producto.stock_actual) - cantidad;

      await connection.execute('UPDATE productos SET stock_actual = ? WHERE id_producto = ? AND id_usuario = ?', [
        stockNuevo,
        id,
        req.user.id_usuario,
      ]);
      await connection.execute(
        `INSERT INTO productos_danados
          (id_producto_original, cantidad, precio_reducido, descripcion_dano, vendible, activo)
         VALUES (?, ?, ?, ?, true, true)`,
        [id, cantidad, precioReducido, descripcion],
      );
      await registrarMovimiento(connection, {
        id_producto: id,
        tipo_movimiento: 'producto_danado_vendible',
        cantidad,
        stock_anterior: Number(producto.stock_actual),
        stock_nuevo: stockNuevo,
        motivo: descripcion,
      });

      return { producto: await obtenerProducto(connection, id, req.user.id_usuario) };
    });

    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.status(201).json(mapProducto(result.producto));
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/merma', requireAdmin, async (req, res, next) => {
  try {
    const result = await registerProductWaste({
      idParam: req.params.id,
      idUsuario: req.user.id_usuario,
      body: req.body,
      withTransactionFn: withTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/venta', async (req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/ventas>; rel="successor-version"');
  res.setHeader('Warning', '299 - "POST /api/productos/:id/venta es legacy; usa POST /api/ventas"');

  const id = Number(req.params.id);
  const cantidad = toNumber(req.body.cantidad);
  const precioUnitario = toNumber(req.body.precio_unitario);
  const nota = String(req.body.nota ?? '').trim();

  if (!Number.isInteger(id) || !Number.isInteger(cantidad) || cantidad <= 0 || (!Number.isNaN(precioUnitario) && precioUnitario < 0)) {
    return res.status(400).json({ error: 'Producto, cantidad entera y precio unitario valido son requeridos.' });
  }

  try {
    const result = await withTransaction(async (connection) => {
      const producto = await obtenerProducto(connection, id, req.user.id_usuario);
      if (!producto) return { status: 404, error: 'Producto no encontrado.' };
      if (!producto.activo) return { status: 400, error: 'No se puede vender un producto desactivado.' };
      if (Number(producto.stock_actual) < cantidad) return { status: 400, error: 'Stock insuficiente para completar la venta.' };

      const stockNuevo = Number(producto.stock_actual) - cantidad;
      const precioFinal = Number.isNaN(precioUnitario) ? Number(producto.precio_venta) : precioUnitario;
      const total = cantidad * precioFinal;
      const motivo = [
        `Venta registrada por ${cantidad} unidad(es)`,
        `precio unitario ${precioFinal.toFixed(2)}`,
        `total ${total.toFixed(2)}`,
        nota ? `nota: ${nota}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await connection.execute('UPDATE productos SET stock_actual = ? WHERE id_producto = ? AND id_usuario = ?', [
        stockNuevo,
        id,
        req.user.id_usuario,
      ]);

      await registrarMovimiento(connection, {
        id_producto: id,
        tipo_movimiento: 'venta',
        cantidad,
        stock_anterior: Number(producto.stock_actual),
        stock_nuevo: stockNuevo,
        motivo,
      });

      return { producto: await obtenerProducto(connection, id, req.user.id_usuario), total };
    });

    if (result.error) return res.status(result.status).json({ error: result.error });

    const producto = mapProducto(result.producto);
    let alerta = null;

    if (producto.activo && producto.stock_actual <= producto.stock_minimo) {
      try {
        alerta = await sendInventoryAlert({
          subject: `Stock bajo: ${producto.nombre}`,
          text: `El producto ${producto.nombre} quedo con ${producto.stock_actual} unidades. Minimo configurado: ${producto.stock_minimo}.`,
          html: `<p>El producto <strong>${producto.nombre}</strong> quedo con ${producto.stock_actual} unidades.</p><p>Minimo configurado: ${producto.stock_minimo}.</p>`,
        });
      } catch (alertError) {
        console.error('[Inventory alert error]', {
          productId: producto.id_producto,
          message: alertError.message,
          code: alertError.code,
        });
        alerta = {
          delivered: false,
          error: 'No se pudo enviar la alerta de stock bajo.',
        };
      }
    }

    return res.status(201).json({ producto, total: result.total, alerta });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/desactivar', requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const motivo = String(req.body.motivo ?? 'Producto desactivado').trim();

  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Producto inválido.' });

  try {
    const producto = await withTransaction(async (connection) => {
      const actual = await obtenerProducto(connection, id, req.user.id_usuario);
      if (!actual) return null;

      await connection.execute('UPDATE productos SET activo = false WHERE id_producto = ? AND id_usuario = ?', [
        id,
        req.user.id_usuario,
      ]);
      await registrarMovimiento(connection, {
        id_producto: id,
        tipo_movimiento: 'desactivacion',
        cantidad: 0,
        stock_anterior: Number(actual.stock_actual),
        stock_nuevo: Number(actual.stock_actual),
        motivo,
      });

      return obtenerProducto(connection, id, req.user.id_usuario);
    });

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.json(mapProducto(producto));
  } catch (error) {
    return next(error);
  }
});

export default router;
