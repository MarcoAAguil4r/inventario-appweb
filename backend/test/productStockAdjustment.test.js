import test from 'node:test';
import assert from 'node:assert/strict';
import { adjustProductStock, validateStockAdjustment } from '../src/services/productStockAdjustment.js';

const product = {
  id_producto: 10,
  id_usuario: 7,
  nombre: 'Cafe',
  categoria: 'Abarrotes',
  precio_compra: 40,
  precio_venta: 65,
  stock_actual: 20,
  stock_minimo: 2,
  activo: 1,
};

function createAdjustmentConnection({ initialProduct = product, movementId = 50 } = {}) {
  const calls = [];
  let currentStock = initialProduct?.stock_actual ?? 0;

  return {
    calls,
    connection: {
      async execute(sql, params) {
        calls.push({ sql, params });

        if (/^SELECT \* FROM productos/.test(sql)) {
          return [[initialProduct ? { ...initialProduct, stock_actual: currentStock } : undefined]];
        }

        if (/^UPDATE productos SET stock_actual/.test(sql)) {
          currentStock = params[0];
          return [{ affectedRows: 1 }];
        }

        if (/^INSERT INTO movimientos_inventario/.test(sql)) {
          return [{ insertId: movementId }];
        }

        if (/^SELECT\s+m\.id_movimiento/.test(sql)) {
          const insertCall = calls.find((call) => /^INSERT INTO movimientos_inventario/.test(call.sql));
          const [, tipoMovimiento, cantidad, stockAnterior, stockNuevo, motivo] = insertCall.params;

          return [[
            {
              id_movimiento: movementId,
              id_producto: product.id_producto,
              producto: product.nombre,
              tipo_movimiento: tipoMovimiento,
              cantidad,
              stock_anterior: stockAnterior,
              stock_nuevo: stockNuevo,
              motivo,
              fecha: '2026-07-14T12:00:00.000Z',
            },
          ]];
        }

        return [[]];
      },
    },
  };
}

test('valida ajuste de entrada', () => {
  assert.deepEqual(validateStockAdjustment({ tipo: 'entrada', cantidad: 10, motivo: 'Conteo fisico' }), {
    data: {
      tipo: 'entrada',
      cantidad: 10,
      motivo: 'Conteo fisico',
    },
  });
});

test('rechaza cantidad cero, negativa y motivo vacio', () => {
  assert.deepEqual(validateStockAdjustment({ tipo: 'entrada', cantidad: 0, motivo: 'Conteo' }), {
    error: 'La cantidad debe ser un entero mayor que cero.',
  });
  assert.deepEqual(validateStockAdjustment({ tipo: 'entrada', cantidad: -1, motivo: 'Conteo' }), {
    error: 'La cantidad debe ser un entero mayor que cero.',
  });
  assert.deepEqual(validateStockAdjustment({ tipo: 'entrada', cantidad: 1, motivo: '   ' }), {
    error: 'El motivo es requerido.',
  });
});

test('registra entrada aumentando stock y generando movimiento historico', async () => {
  const { calls, connection } = createAdjustmentConnection();
  const result = await adjustProductStock({
    idParam: '10',
    idUsuario: 7,
    body: { tipo: 'entrada', cantidad: 10, motivo: 'Correccion por conteo fisico' },
    withTransactionFn: async (callback) => callback(connection),
  });
  const updateCall = calls.find((call) => /^UPDATE productos SET stock_actual/.test(call.sql));
  const insertCall = calls.find((call) => /^INSERT INTO movimientos_inventario/.test(call.sql));

  assert.equal(result.status, 201);
  assert.equal(result.body.producto.stock_actual, 30);
  assert.equal(result.body.movimiento.tipo_movimiento, 'ajuste_entrada');
  assert.equal(result.body.movimiento.stock_anterior, 20);
  assert.equal(result.body.movimiento.stock_nuevo, 30);
  assert.deepEqual(updateCall.params, [30, 10, 7]);
  assert.deepEqual(insertCall.params, [10, 'ajuste_entrada', 10, 20, 30, 'Correccion por conteo fisico', 7]);
});

test('registra salida disminuyendo stock', async () => {
  const { connection } = createAdjustmentConnection();
  const result = await adjustProductStock({
    idParam: '10',
    idUsuario: 7,
    body: { tipo: 'salida', cantidad: 4, motivo: 'Ajuste por conteo' },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.producto.stock_actual, 16);
  assert.equal(result.body.movimiento.tipo_movimiento, 'ajuste_salida');
  assert.equal(result.body.movimiento.stock_anterior, 20);
  assert.equal(result.body.movimiento.stock_nuevo, 16);
});

test('rechaza salida mayor al stock sin actualizar ni insertar movimiento', async () => {
  const { calls, connection } = createAdjustmentConnection();
  const result = await adjustProductStock({
    idParam: '10',
    idUsuario: 7,
    body: { tipo: 'salida', cantidad: 25, motivo: 'Conteo fisico' },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Stock insuficiente para completar el ajuste.' });
  assert.equal(calls.some((call) => /^UPDATE productos SET stock_actual/.test(call.sql)), false);
  assert.equal(calls.some((call) => /^INSERT INTO movimientos_inventario/.test(call.sql)), false);
});

test('responde 404 cuando el producto no existe o pertenece a otro usuario', async () => {
  const { calls, connection } = createAdjustmentConnection({ initialProduct: null });
  const result = await adjustProductStock({
    idParam: '10',
    idUsuario: 7,
    body: { tipo: 'entrada', cantidad: 1, motivo: 'Conteo' },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'Producto no encontrado.' });
  assert.deepEqual(calls[0].params, [10, 7]);
});
