import { Router } from 'express';
import { withTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function generarFolio(id) {
  return `V-${String(id).padStart(6, '0')}`;
}

// POST /api/ventas — registrar venta formal
router.post('/', async (req, res, next) => {
  const items = req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe tener al menos un producto.' });
  }

  for (const item of items) {
    const cantidad = toNumber(item.cantidad);
    const precio = toNumber(item.precio_unitario);
    if (!Number.isInteger(Number(item.id_producto)) || cantidad <= 0 || precio <= 0) {
      return res.status(400).json({ error: 'Cada item debe tener id_producto, cantidad y precio_unitario válidos.' });
    }
  }

  try {
    const venta = await withTransaction(async (connection) => {

      //Verificar stock de todos los productos antes de tocar nada
      for (const item of items) {
        const [rows] = await connection.execute(
          'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
          [item.id_producto, req.user.id_usuario],
        );
        const producto = rows[0];
        if (!producto) {
          throw Object.assign(new Error(`Producto ${item.id_producto} no encontrado.`), { status: 404 });
        }
        if (!producto.activo) {
          throw Object.assign(new Error(`El producto "${producto.nombre}" está desactivado.`), { status: 400 });
        }
        if (Number(producto.stock_actual) < Number(item.cantidad)) {
          throw Object.assign(new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock_actual}.`), { status: 400 });
        }
      }

      const total = items.reduce((sum, item) => {
        return sum + toNumber(item.cantidad) * toNumber(item.precio_unitario);
      }, 0);

      const [ventaResult] = await connection.execute(
        `INSERT INTO ventas (id_usuario, folio, estado, total)
         VALUES (?, 'TEMP', 'CONFIRMADA', ?)`,
        [req.user.id_usuario, total],
      );
      const idVenta = ventaResult.insertId;
      const folio = generarFolio(idVenta);

      await connection.execute(
        'UPDATE ventas SET folio = ? WHERE id_venta = ?',
        [folio, idVenta],
      );

      // Insertar detalles, actualizar stock y registrar movimientos
      const detalles = [];
      for (const item of items) {
        const cantidad = toNumber(item.cantidad);
        const precioUnitario = toNumber(item.precio_unitario);
        const subtotal = cantidad * precioUnitario;

        // Detalle de venta
        await connection.execute(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idVenta, item.id_producto, cantidad, precioUnitario, subtotal],
        );

        // Stock actual antes de descontar
        const [rows] = await connection.execute(
          'SELECT stock_actual FROM productos WHERE id_producto = ? LIMIT 1',
          [item.id_producto],
        );
        const stockAnterior = Number(rows[0].stock_actual);
        const stockNuevo = stockAnterior - cantidad;

        // Actualizar stock
        await connection.execute(
          'UPDATE productos SET stock_actual = ? WHERE id_producto = ? AND id_usuario = ?',
          [stockNuevo, item.id_producto, req.user.id_usuario],
        );

        // Movimiento vinculado a la venta
        await connection.execute(
          `INSERT INTO movimientos_inventario
            (id_venta, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo)
           VALUES (?, ?, 'venta', ?, ?, ?, ?)`,
          [
            idVenta,
            item.id_producto,
            cantidad,
            stockAnterior,
            stockNuevo,
            `Venta ${folio} | precio unitario ${precioUnitario.toFixed(2)} | subtotal ${subtotal.toFixed(2)}`,
          ],
        );

        detalles.push({
          id_producto: item.id_producto,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal,
        });
      }

      return { id_venta: idVenta, folio, estado: 'CONFIRMADA', detalles, total };
    });

    return res.status(201).json(venta);

  } catch (error) {
    const status = error.status ?? 500;
    return res.status(status).json({ error: error.message });
  }
});

// GET /api/ventas — historial de ventas del usuario
router.get('/', async (req, res, next) => {
  try {
    const { query } = await import('../db.js');
    const ventas = await query(
      `SELECT
        v.id_venta,
        v.folio,
        v.estado,
        v.total,
        v.fecha
       FROM ventas v
       WHERE v.id_usuario = ?
       ORDER BY v.fecha DESC, v.id_venta DESC
       LIMIT 50`,
      [req.user.id_usuario],
    );

    return res.json(
      ventas.map((v) => ({
        ...v,
        total: Number(v.total),
      })),
    );
  } catch (error) {
    return next(error);
  }
});

// GET /api/ventas/:id — detalle de una venta
router.get('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID de venta inválido.' });

  try {
    const { query } = await import('../db.js');

    const [venta] = await query(
      'SELECT * FROM ventas WHERE id_venta = ? AND id_usuario = ? LIMIT 1',
      [id, req.user.id_usuario],
    );
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

    const detalles = await query(
      `SELECT
        dv.id_detalle,
        dv.id_producto,
        p.nombre AS producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal
       FROM detalle_venta dv
       INNER JOIN productos p ON p.id_producto = dv.id_producto
       WHERE dv.id_venta = ?`,
      [id],
    );

    return res.json({
      id_venta: venta.id_venta,
      folio: venta.folio,
      estado: venta.estado,
      total: Number(venta.total),
      fecha: venta.fecha,
      detalles: detalles.map((d) => ({
        ...d,
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;