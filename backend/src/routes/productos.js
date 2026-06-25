import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function estadoProducto(producto) {
  if (!producto.activo) return 'desactivado';
  if (Number(producto.stock_actual) <= 0) return 'agotado';
  if (Number(producto.stock_actual) <= Number(producto.stock_minimo)) return 'bajo stock';
  return 'disponible';
}

function mapProducto(producto) {
  return {
    ...producto,
    precio_compra: Number(producto.precio_compra),
    precio_venta: Number(producto.precio_venta),
    stock_actual: Number(producto.stock_actual),
    stock_minimo: Number(producto.stock_minimo),
    activo: Boolean(producto.activo),
    estado: estadoProducto(producto),
  };
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
  await connection.execute(
    `INSERT INTO movimientos_inventario
      (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      movimiento.id_producto,
      movimiento.tipo_movimiento,
      movimiento.cantidad,
      movimiento.stock_anterior,
      movimiento.stock_nuevo,
      movimiento.motivo,
    ],
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

router.get('/resumen/dia', async (req, res, next) => {
  try {
    const [resumen] = await query(
      `SELECT
        COALESCE(SUM(
          CASE
            WHEN m.stock_nuevo > m.stock_anterior
            THEN (m.stock_nuevo - m.stock_anterior) * (p.precio_venta - p.precio_compra)
            ELSE 0
          END
        ), 0) AS margen_potencial,
        COALESCE((
          SELECT SUM(mm.costo_perdida)
          FROM mermas mm
          INNER JOIN productos pm ON pm.id_producto = mm.id_producto
          WHERE pm.id_usuario = ? AND DATE(mm.creado_en) = CURRENT_DATE()
        ), 0) AS perdidas,
        COALESCE((
          SELECT SUM(pd.cantidad * pd.precio_reducido)
          FROM productos_danados pd
          INNER JOIN productos ppd ON ppd.id_producto = pd.id_producto_original
          WHERE ppd.id_usuario = ? AND pd.vendible = true AND DATE(pd.creado_en) = CURRENT_DATE()
        ), 0) AS valor_danado_vendible
      FROM movimientos_inventario m
      INNER JOIN productos p ON p.id_producto = m.id_producto
      WHERE p.id_usuario = ? AND DATE(m.fecha) = CURRENT_DATE()`,
      [req.user.id_usuario, req.user.id_usuario, req.user.id_usuario],
    );

    const margenPotencial = Number(resumen?.margen_potencial ?? 0);
    const perdidas = Number(resumen?.perdidas ?? 0);
    const valorDanadoVendible = Number(resumen?.valor_danado_vendible ?? 0);

    return res.json({
      margen_potencial: margenPotencial,
      ganancia_potencial: margenPotencial,
      perdidas,
      valor_danado_vendible: valorDanadoVendible,
      balance_potencial: margenPotencial - perdidas,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/movimientos/recientes', async (req, res, next) => {
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
        m.fecha
      FROM movimientos_inventario m
      INNER JOIN productos p ON p.id_producto = m.id_producto
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

router.get('/:id/movimientos', async (req, res, next) => {
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
        m.fecha
      FROM movimientos_inventario m
      INNER JOIN productos p ON p.id_producto = m.id_producto
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

router.get('/danados-vendibles', async (req, res, next) => {
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

router.get('/mermas', async (req, res, next) => {
  try {
    const mermas = await query(
      `SELECT
        m.id_merma,
        m.id_producto,
        p.nombre AS producto,
        m.cantidad,
        m.motivo,
        m.costo_perdida,
        m.creado_en
      FROM mermas m
      INNER JOIN productos p ON p.id_producto = m.id_producto
      WHERE p.id_usuario = ?
      ORDER BY m.creado_en DESC, m.id_merma DESC
      LIMIT 20`,
      [req.user.id_usuario],
    );

    return res.json(
      mermas.map((merma) => ({
        ...merma,
        cantidad: Number(merma.cantidad),
        costo_perdida: Number(merma.costo_perdida),
      })),
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
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

router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  const parsed = validarProducto(req.body);

  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Producto inválido.' });
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const producto = await withTransaction(async (connection) => {
      const actual = await obtenerProducto(connection, id, req.user.id_usuario);
      if (!actual) return null;

      await connection.execute(
        `UPDATE productos
         SET nombre = ?, categoria = ?, precio_compra = ?, precio_venta = ?, stock_actual = ?, stock_minimo = ?
         WHERE id_producto = ? AND id_usuario = ?`,
        [
          parsed.data.nombre,
          parsed.data.categoria,
          parsed.data.precio_compra,
          parsed.data.precio_venta,
          parsed.data.stock_actual,
          parsed.data.stock_minimo,
          id,
          req.user.id_usuario,
        ],
      );

      if (Number(actual.stock_actual) !== parsed.data.stock_actual) {
        await registrarMovimiento(connection, {
          id_producto: id,
          tipo_movimiento: 'actualizacion_stock',
          cantidad: Math.abs(parsed.data.stock_actual - Number(actual.stock_actual)),
          stock_anterior: Number(actual.stock_actual),
          stock_nuevo: parsed.data.stock_actual,
          motivo: 'Actualización manual de producto',
        });
      }

      return obtenerProducto(connection, id, req.user.id_usuario);
    });

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.json(mapProducto(producto));
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/danado', async (req, res, next) => {
  const id = Number(req.params.id);
  const cantidad = toNumber(req.body.cantidad);
  const precioReducido = toNumber(req.body.precio_reducido);
  const descripcion = String(req.body.descripcion_dano ?? '').trim();

  if (!Number.isInteger(id) || cantidad <= 0 || precioReducido < 0 || !descripcion) {
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

router.post('/:id/merma', async (req, res, next) => {
  const id = Number(req.params.id);
  const cantidad = toNumber(req.body.cantidad);
  const motivo = String(req.body.motivo ?? '').trim();
  const costoPerdida = toNumber(req.body.costo_perdida);

  if (!Number.isInteger(id) || cantidad <= 0 || costoPerdida < 0 || !motivo) {
    return res.status(400).json({ error: 'Cantidad, motivo y costo de pérdida son requeridos.' });
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
        'INSERT INTO mermas (id_producto, cantidad, motivo, costo_perdida) VALUES (?, ?, ?, ?)',
        [id, cantidad, motivo, costoPerdida],
      );
      await registrarMovimiento(connection, {
        id_producto: id,
        tipo_movimiento: 'merma',
        cantidad,
        stock_anterior: Number(producto.stock_actual),
        stock_nuevo: stockNuevo,
        motivo,
      });

      return { producto: await obtenerProducto(connection, id, req.user.id_usuario) };
    });

    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.status(201).json(mapProducto(result.producto));
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/venta', async (req, res, next) => {
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
    return res.status(201).json({ producto: mapProducto(result.producto), total: result.total });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/desactivar', async (req, res, next) => {
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
