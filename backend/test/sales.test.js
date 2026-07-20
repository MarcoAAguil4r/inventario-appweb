import test from 'node:test';
import assert from 'node:assert/strict';
import { cancelSale, createSale, getSaleDetail, listSales, validateSalePayload } from '../src/services/sales.js';

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

        if (/INFORMATION_SCHEMA\.COLUMNS/.test(sql)) {
          if (params[0] === 'ventas') {
            return [[{ COLUMN_NAME: 'folio' }, { COLUMN_NAME: 'nota' }, { COLUMN_NAME: 'estado' }]];
          }

          return [[{ COLUMN_NAME: 'id_detalle_venta' }]];
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

        if (/^SELECT\s+d\.(id_detalle_venta|id_detalle)/.test(sql)) {
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
  assert.equal(result.body.total, 130);
  assert.equal(result.body.detalle.length, 1);
  assert.deepEqual(result.body.detalles.map(({ id_producto, precio_unitario, cantidad, subtotal }) => ({
    id_producto,
    precio_unitario,
    cantidad,
    subtotal,
  })), [
    {
      id_producto: 1,
      precio_unitario: 65,
      cantidad: 2,
      subtotal: 130,
    },
  ]);
  assert.equal(result.body.movimientos[0].stock_anterior, 10);
  assert.equal(result.body.movimientos[0].stock_nuevo, 8);
  assert.equal(calls.filter((call) => /^INSERT INTO ventas/.test(call.sql)).length, 1);
  assert.match(calls.find((call) => /^INSERT INTO ventas/.test(call.sql)).sql, /folio/);
  assert.match(calls.find((call) => /^INSERT INTO ventas/.test(call.sql)).sql, /estado/);
  assert.equal(calls.find((call) => /^INSERT INTO ventas/.test(call.sql)).params.at(-1), 'CONFIRMADA');
  assert.deepEqual(calls.find((call) => /^INSERT INTO detalle_venta/.test(call.sql)).params, [80, 1, 2, 65, 130]);
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
  assert.equal(result.body.total, 150);
  assert.equal(result.body.detalle.length, 2);
  assert.deepEqual(result.body.detalles.map(({ id_producto, precio_unitario, cantidad, subtotal }) => ({
    id_producto,
    precio_unitario,
    cantidad,
    subtotal,
  })), [
    {
      id_producto: 1,
      precio_unitario: 65,
      cantidad: 2,
      subtotal: 130,
    },
    {
      id_producto: 5,
      precio_unitario: 20,
      cantidad: 1,
      subtotal: 20,
    },
  ]);
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

test('lista ventas por fecha con folio, estado, responsable y totales', async () => {
  const calls = [];
  const result = await listSales({
    idUsuario: 7,
    fecha: '2026-07-15',
    getDayBoundsFn: () => ({ startUtc: '2026-07-15 06:00:00', endUtc: '2026-07-16 06:00:00' }),
    queryFn: async (sql, params) => {
      calls.push({ sql, params });
      if (/INFORMATION_SCHEMA\.COLUMNS/.test(sql)) {
        return [{ COLUMN_NAME: 'folio' }, { COLUMN_NAME: 'estado' }];
      }
      return [
        {
          id_venta: 80,
          folio: 'V001',
          total: '150.00',
          estado: 'CONFIRMADA',
          nota: 'Venta mostrador',
          creado_en: '2026-07-15T12:00:00.000Z',
          responsable: 'Marco',
          total_productos: '3',
          lineas: '2',
        },
      ];
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body[0].total, 150);
  assert.equal(result.body[0].total_productos, 3);
  assert.equal(result.body[0].lineas, 2);
  assert.deepEqual(calls.find((call) => /FROM ventas/.test(call.sql)).params, [7, 7, 7, '2026-07-15 06:00:00', '2026-07-16 06:00:00']);
});

test('lista ventas con esquema legacy que usa fecha y no folio', async () => {
  const calls = [];
  const result = await listSales({
    idUsuario: 7,
    fecha: '2026-07-19',
    getDayBoundsFn: () => ({ startUtc: '2026-07-19 06:00:00', endUtc: '2026-07-20 06:00:00' }),
    queryFn: async (sql, params) => {
      calls.push({ sql, params });
      if (/INFORMATION_SCHEMA\.COLUMNS/.test(sql)) {
        return [{ COLUMN_NAME: 'fecha' }, { COLUMN_NAME: 'estado' }];
      }
      return [
        {
          id_venta: 81,
          folio: 'VENTA-81',
          total: '75.00',
          estado: 'CONFIRMADA',
          nota: null,
          creado_en: '2026-07-19T12:00:00.000Z',
          responsable: 'Marco',
          total_productos: '1',
          lineas: '1',
        },
      ];
    },
  });

  const salesCall = calls.find((call) => /FROM ventas/.test(call.sql));

  assert.equal(result.status, 200);
  assert.equal(result.body[0].folio, 'VENTA-81');
  assert.match(salesCall.sql, /v\.fecha AS creado_en/);
  assert.match(salesCall.sql, /CONCAT\('VENTA-', v\.id_venta\) AS folio/);
  assert.deepEqual(salesCall.params, [7, 7, 7, '2026-07-19 06:00:00', '2026-07-20 06:00:00']);
});

test('rechaza fecha invalida al listar ventas', async () => {
  const result = await listSales({
    idUsuario: 7,
    fecha: '2026/07/15',
    getDayBoundsFn: () => null,
    queryFn: async () => [],
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Fecha invalida. Usa formato YYYY-MM-DD.' });
});

test('consulta detalle formal de venta con lineas y movimientos', async () => {
  const result = await getSaleDetail({
    idUsuario: 7,
    idParam: '80',
    queryFn: async (sql, params) => {
      if (/INFORMATION_SCHEMA\.COLUMNS/.test(sql)) {
        if (params[0] === 'detalle_venta') return [{ COLUMN_NAME: 'id_detalle_venta' }];
        return [{ COLUMN_NAME: 'folio' }, { COLUMN_NAME: 'estado' }];
      }

      if (/FROM ventas/.test(sql)) {
        return [
          {
            id_venta: 80,
            folio: 'V001',
            total: '150.00',
            estado: 'CONFIRMADA',
            nota: 'Venta mostrador',
            creado_en: '2026-07-15T12:00:00.000Z',
            responsable: 'Marco',
          },
        ];
      }

      if (/FROM detalle_venta/.test(sql)) {
        return [
          {
            id_detalle_venta: 1,
            id_venta: 80,
            id_producto: 1,
            producto: 'Cafe',
            cantidad: '2',
            precio_unitario: '65.00',
            subtotal: '130.00',
          },
        ];
      }

      return [
        {
          id_movimiento: 50,
          id_producto: 1,
          producto: 'Cafe',
          tipo_movimiento: 'venta',
          cantidad: '2',
          stock_anterior: '10',
          stock_nuevo: '8',
          motivo: 'Venta 80',
          fecha: '2026-07-15T12:00:00.000Z',
        },
      ];
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.total, 150);
  assert.equal(result.body.detalles[0].subtotal, 130);
  assert.equal(result.body.movimientos[0].stock_nuevo, 8);
});

test('cancela venta confirmada, devuelve stock y registra movimientos atomicos', async () => {
  const calls = [];
  const result = await cancelSale({
    idUsuario: 7,
    idParam: '80',
    body: { motivo: 'Error de captura' },
    withTransactionFn: async (callback) =>
      callback({
        async execute(sql, params) {
          calls.push({ sql, params });

          if (/FROM ventas/.test(sql)) {
            return [[{ id_venta: 80, total: '150.00', estado: 'CONFIRMADA' }]];
          }

          if (/FROM detalle_venta/.test(sql)) {
            return [
              [
                { id_producto: 1, cantidad: 2, stock_actual: 8, nombre: 'Cafe' },
                { id_producto: 5, cantidad: 1, stock_actual: 2, nombre: 'Azucar' },
              ],
            ];
          }

          return [{ affectedRows: 1 }];
        },
      }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.estado, 'CANCELADA');
  assert.equal(calls.some((call) => /^UPDATE ventas SET estado = 'CANCELADA'/.test(call.sql)), true);
  assert.equal(calls.filter((call) => /^UPDATE productos SET stock_actual/.test(call.sql)).length, 2);
  assert.equal(calls.filter((call) => /^INSERT INTO movimientos_inventario/.test(call.sql)).length, 2);
});

test('no cancela una venta ya cancelada', async () => {
  const calls = [];
  const result = await cancelSale({
    idUsuario: 7,
    idParam: '80',
    withTransactionFn: async (callback) =>
      callback({
        async execute(sql, params) {
          calls.push({ sql, params });
          return [[{ id_venta: 80, total: '150.00', estado: 'CANCELADA' }]];
        },
      }),
  });

  assert.equal(result.status, 409);
  assert.deepEqual(result.body, { error: 'La venta ya esta cancelada.' });
  assert.equal(calls.some((call) => /^UPDATE productos SET stock_actual/.test(call.sql)), false);
});
