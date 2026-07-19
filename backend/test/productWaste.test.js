import test from 'node:test';
import assert from 'node:assert/strict';
import { listProductWastes, registerProductWaste, validateWastePayload } from '../src/services/productWaste.js';

const product = {
  id_producto: 4,
  id_usuario: 8,
  nombre: 'Nutri 1L',
  categoria: 'Bebidas',
  precio_compra: 40,
  precio_venta: 65,
  stock_actual: 15,
  stock_minimo: 2,
  activo: 1,
};

function createConnection({ existingProduct = product } = {}) {
  const calls = [];
  let updatedProduct = existingProduct;

  return {
    calls,
    connection: {
      async execute(sql, params) {
        calls.push({ sql, params });

        if (/^SELECT \* FROM productos/.test(sql)) {
          return [[updatedProduct]];
        }

        if (/INFORMATION_SCHEMA\.COLUMNS/.test(sql)) {
          return [[{ COLUMN_NAME: 'id_usuario' }]];
        }

        if (/^UPDATE productos SET stock_actual/.test(sql)) {
          updatedProduct = { ...updatedProduct, stock_actual: params[0] };
          return [{ affectedRows: 1 }];
        }

        return [{ insertId: 1 }];
      },
    },
  };
}

test('valida cantidad entera y motivo de merma', () => {
  assert.deepEqual(validateWastePayload({ cantidad: 2, motivo: 'Producto caducado' }), {
    data: {
      cantidad: 2,
      motivo: 'Producto caducado',
    },
  });
  assert.deepEqual(validateWastePayload({ cantidad: 0.5, motivo: 'Producto caducado' }), {
    error: 'Cantidad entera y motivo son requeridos.',
  });
  assert.deepEqual(validateWastePayload({ cantidad: 1, motivo: '' }), {
    error: 'Cantidad entera y motivo son requeridos.',
  });
});

test('registra responsable desde JWT, ignora usuario manipulado y calcula costo automaticamente', async () => {
  const { calls, connection } = createConnection();
  const result = await registerProductWaste({
    idParam: '4',
    idUsuario: 8,
    body: {
      cantidad: 2,
      motivo: 'Producto caducado',
      costo_perdida: 1,
      id_usuario: 999,
    },
    withTransactionFn: async (callback) => callback(connection),
  });

  const wasteInsert = calls.find((call) => /^INSERT INTO mermas/.test(call.sql));
  const movementInsert = calls.find((call) => /^INSERT INTO movimientos_inventario/.test(call.sql));

  assert.equal(result.status, 201);
  assert.equal(result.body.stock_actual, 13);
  assert.deepEqual(wasteInsert.params, [4, 8, 2, 'Producto caducado', 80]);
  assert.match(movementInsert.sql, /id_usuario/);
  assert.deepEqual(movementInsert.params, [4, 'merma', 2, 15, 13, 'Producto caducado', 8]);
});

test('consulta mermas con responsable aunque el usuario este inactivo', async () => {
  const rows = await listProductWastes({
    idUsuario: 8,
    queryFn: async (_sql, params) => {
      assert.deepEqual(params, [8]);
      return [
        {
          id_merma: 15,
          id_producto: 4,
          producto: 'Nutri 1L',
          cantidad: '2',
          motivo: 'Producto caducado',
          costo_perdida: '80.00',
          id_usuario: 8,
          responsable: 'Marco Aguilar',
          creado_en: '2026-07-15T12:00:00.000Z',
          fecha: '2026-07-15T12:00:00.000Z',
        },
      ];
    },
  });

  assert.deepEqual(rows, [
    {
      id_merma: 15,
      id_producto: 4,
      producto: 'Nutri 1L',
      cantidad: 2,
      motivo: 'Producto caducado',
      costo_perdida: 80,
      id_usuario: 8,
      responsable: 'Marco Aguilar',
      creado_en: '2026-07-15T12:00:00.000Z',
      fecha: '2026-07-15T12:00:00.000Z',
    },
  ]);
});
