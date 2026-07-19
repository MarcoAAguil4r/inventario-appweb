import test from 'node:test';
import assert from 'node:assert/strict';
import { createSale, validateSalePayload } from '../src/services/sales.js';

const products = [
  {
    id_producto: 1,
    id_usuario: 7,
    nombre: 'Cafe',
    precio_venta: 65,
    stock_actual: 10,
    activo: 1,
  },
  {
    id_producto: 5,
    id_usuario: 7,
    nombre: 'Azucar',
    precio_venta: 20,
    stock_actual: 3,
    activo: 1,
  },
];

function createConnection({ rows = products, saleId = 80 } = {}) {
  const calls = [];
  const stocks = new Map(rows.map((product) => [product.id_producto, product.stock_actual]));
  let detailId = 1;
  let movementId = 50;
  const detailRows = [];
  const movementRows = [];

  return {
    calls,
    connection: {
      async execute(sql, params) {
        calls.push({ sql, params });

        if (/^SELECT \* FROM productos/.test(sql)) {
          return [rows.map((product) => ({ ...product, stock_actual: stocks.get(product.id_producto) }))];
        }

        if (/^INSERT INTO ventas/.test(sql)) {
          return [{ insertId: saleId }];
        }

        if (/^UPDATE productos SET stock_actual/.test(sql)) {
          stocks.set(params[1], params[0]);
          return [{ affectedRows: 1 }];
        }

        if (/^INSERT INTO detalle_venta/.test(sql)) {
          detailRows.push({
            id_detalle_venta: detailId,
            id_venta: params[0],
            id_producto: params[1],
            producto: rows.find((product) => product.id_producto === params[1])?.nombre,
            cantidad: params[2],
            precio_unitario: params[3],
            subtotal: params[4],
          });
          detailId += 1;
          return [{ insertId: detailId - 1 }];
        }

        if (/^INSERT INTO movimientos_inventario/.test(sql)) {
          movementRows.push({
            id_movimiento: movementId,
            id_producto: params[0],
            producto: rows.find((product) => product.id_producto === params[0])?.nombre,
            tipo_movimiento: params[1],
            cantidad: params[2],
            stock_anterior: params[3],
            stock_nuevo: params[4],
            motivo: params[5],
            fecha: '2026-07-14T12:00:00.000Z',
          });
          movementId += 1;
          return [{ insertId: movementId - 1 }];
        }

        if (/^SELECT\s+d\.id_detalle_venta/.test(sql)) {
          return [detailRows];
        }

        if (/^SELECT\s+m\.id_movimiento/.test(sql)) {
          return [movementRows];
        }

        return [[]];
      },
    },
  };
}

test('consolida productos repetidos en el contrato', () => {
  const parsed = validateSalePayload({
    productos: [
      { id_producto: 1, cantidad: 2 },
      { id_producto: 1, cantidad: 3 },
      { id_producto: 5, cantidad: 1 },
    ],
    nota: 'Venta mostrador',
  });

  assert.deepEqual(parsed.data.productos, [
    { id_producto: 1, cantidad: 5 },
    { id_producto: 5, cantidad: 1 },
  ]);
});

test('rechaza venta vacia y cantidades invalidas', () => {
  assert.deepEqual(validateSalePayload({ productos: [] }), {
    error: 'La venta debe contener al menos un producto.',
  });
  assert.deepEqual(validateSalePayload({ productos: [{ id_producto: 1, cantidad: 0 }] }), {
    error: 'Todas las cantidades deben ser enteras mayores que cero.',
  });
  assert.deepEqual(validateSalePayload({ productos: [{ id_producto: 1, cantidad: 0.1 }] }), {
    error: 'Todas las cantidades deben ser enteras mayores que cero.',
  });
});

test('registra venta con un producto', async () => {
  const { calls, connection } = createConnection();
  const result = await createSale({
    idUsuario: 7,
    body: { productos: [{ id_producto: 1, cantidad: 2 }], nota: 'Venta mostrador' },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.venta.total, 130);
  assert.equal(result.body.detalle.length, 1);
  assert.equal(result.body.movimientos[0].stock_anterior, 10);
  assert.equal(result.body.movimientos[0].stock_nuevo, 8);
  assert.equal(calls.filter((call) => /^INSERT INTO ventas/.test(call.sql)).length, 1);
});

test('registra venta con varios productos en una sola venta', async () => {
  const { calls, connection } = createConnection();
  const result = await createSale({
    idUsuario: 7,
    body: {
      productos: [
        { id_producto: 1, cantidad: 2 },
        { id_producto: 5, cantidad: 1 },
      ],
      nota: 'Venta mostrador',
    },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.venta.total, 150);
  assert.equal(result.body.detalle.length, 2);
  assert.equal(result.body.movimientos.length, 2);
  assert.equal(calls.filter((call) => /^INSERT INTO ventas/.test(call.sql)).length, 1);
  assert.equal(calls.filter((call) => /^UPDATE productos SET stock_actual/.test(call.sql)).length, 2);
});

test('rechaza toda la venta si una linea no tiene stock suficiente', async () => {
  const { calls, connection } = createConnection();
  const result = await createSale({
    idUsuario: 7,
    body: {
      productos: [
        { id_producto: 1, cantidad: 2 },
        { id_producto: 5, cantidad: 9 },
      ],
    },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Stock insuficiente para completar la venta.' });
  assert.equal(calls.some((call) => /^INSERT INTO ventas/.test(call.sql)), false);
  assert.equal(calls.some((call) => /^UPDATE productos SET stock_actual/.test(call.sql)), false);
});

test('rechaza productos inactivos', async () => {
  const { connection } = createConnection({ rows: [{ ...products[0], activo: 0 }] });
  const result = await createSale({
    idUsuario: 7,
    body: { productos: [{ id_producto: 1, cantidad: 1 }] },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Solo pueden venderse productos activos.' });
});

test('rechaza productos inexistentes o ajenos sin registrar venta', async () => {
  const { calls, connection } = createConnection({ rows: [products[0]] });
  const result = await createSale({
    idUsuario: 7,
    body: {
      productos: [
        { id_producto: 1, cantidad: 1 },
        { id_producto: 999, cantidad: 1 },
      ],
    },
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'Producto no encontrado.' });
  assert.equal(calls.some((call) => /^INSERT INTO ventas/.test(call.sql)), false);
  assert.equal(calls.some((call) => /^UPDATE productos SET stock_actual/.test(call.sql)), false);
});
