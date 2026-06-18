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

async function obtenerProducto(connection, id) {
  const [rows] = await connection.execute('SELECT * FROM productos WHERE id_producto = ? LIMIT 1', [id]);
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

router.get('/', async (_req, res, next) => {
  try {
    const productos = await query('SELECT * FROM productos ORDER BY activo DESC, nombre ASC');
    return res.json(productos.map(mapProducto));
  } catch (error) {
    return next(error);
  }
});

router.get('/movimientos/recientes', async (_req, res, next) => {
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
      ORDER BY m.fecha DESC, m.id_movimiento DESC
      LIMIT 12`,
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

router.get('/danados-vendibles', async (_req, res, next) => {
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
      WHERE d.vendible = true
      ORDER BY d.creado_en DESC, d.id_producto_danado DESC
      LIMIT 20`,
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

router.get('/mermas', async (_req, res, next) => {
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
      ORDER BY m.creado_en DESC, m.id_merma DESC
      LIMIT 20`,
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
          (nombre, categoria, precio_compra, precio_venta, stock_actual, stock_minimo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
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

      return obtenerProducto(connection, result.insertId);
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
      const actual = await obtenerProducto(connection, id);
      if (!actual) return null;

      await connection.execute(
        `UPDATE productos
         SET nombre = ?, categoria = ?, precio_compra = ?, precio_venta = ?, stock_actual = ?, stock_minimo = ?
         WHERE id_producto = ?`,
        [
          parsed.data.nombre,
          parsed.data.categoria,
          parsed.data.precio_compra,
          parsed.data.precio_venta,
          parsed.data.stock_actual,
          parsed.data.stock_minimo,
          id,
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

      return obtenerProducto(connection, id);
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
      const producto = await obtenerProducto(connection, id);
      if (!producto) return { status: 404, error: 'Producto no encontrado.' };
      if (!producto.activo) return { status: 400, error: 'No se puede modificar un producto desactivado.' };
      if (Number(producto.stock_actual) < cantidad) return { status: 400, error: 'Stock insuficiente.' };

      const stockNuevo = Number(producto.stock_actual) - cantidad;

      await connection.execute('UPDATE productos SET stock_actual = ? WHERE id_producto = ?', [stockNuevo, id]);
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

      return { producto: await obtenerProducto(connection, id) };
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
      const producto = await obtenerProducto(connection, id);
      if (!producto) return { status: 404, error: 'Producto no encontrado.' };
      if (!producto.activo) return { status: 400, error: 'No se puede modificar un producto desactivado.' };
      if (Number(producto.stock_actual) < cantidad) return { status: 400, error: 'Stock insuficiente.' };

      const stockNuevo = Number(producto.stock_actual) - cantidad;

      await connection.execute('UPDATE productos SET stock_actual = ? WHERE id_producto = ?', [stockNuevo, id]);
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

      return { producto: await obtenerProducto(connection, id) };
    });

    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.status(201).json(mapProducto(result.producto));
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
      const actual = await obtenerProducto(connection, id);
      if (!actual) return null;

      await connection.execute('UPDATE productos SET activo = false WHERE id_producto = ?', [id]);
      await registrarMovimiento(connection, {
        id_producto: id,
        tipo_movimiento: 'desactivacion',
        cantidad: 0,
        stock_anterior: Number(actual.stock_actual),
        stock_nuevo: Number(actual.stock_actual),
        motivo,
      });

      return obtenerProducto(connection, id);
    });

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.json(mapProducto(producto));
  } catch (error) {
    return next(error);
  }
});

export default router;
