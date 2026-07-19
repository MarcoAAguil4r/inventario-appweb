import test from 'node:test';
import assert from 'node:assert/strict';
import { updateProductGeneral, validateProductUpdate } from '../src/services/productUpdate.js';

const existingProduct = {
  id_producto: 1,
  id_usuario: 7,
  nombre: 'Cafe',
  categoria: 'Abarrotes',
  precio_compra: '40.00',
  precio_venta: '65.00',
  stock_actual: 5,
  stock_minimo: 2,
  activo: 1,
};

const validBody = {
  nombre: 'Cafe molido',
  categoria: 'Abarrotes premium',
  precio_compra: 42,
  precio_venta: 68,
  stock_minimo: 3,
};

function createConnection({ product = existingProduct, updatedProduct } = {}) {
  const calls = [];
  const finalProduct = updatedProduct ?? {
    ...existingProduct,
    ...validBody,
    stock_actual: existingProduct.stock_actual,
  };

  return {
    calls,
    connection: {
      async execute(sql, params) {
        calls.push({ sql, params });

        if (/^SELECT \*/.test(sql)) {
          return [[calls.filter((call) => /^SELECT \*/.test(call.sql)).length === 1 ? product : finalProduct]];
        }

        return [{ affectedRows: 1 }];
      },
    },
  };
}

test('valida edicion de nombre, categoria, precios y stock minimo', () => {
  const parsed = validateProductUpdate(validBody);

  assert.deepEqual(parsed, {
    data: validBody,
  });
});

test('rechaza stock_actual manipulado desde el contrato de actualizacion', () => {
  const parsed = validateProductUpdate({
    ...validBody,
    stock_actual: 99,
  });

  assert.deepEqual(parsed, {
    error: 'stock_actual no puede modificarse desde la edicion general.',
  });
});

test('actualiza campos permitidos sin modificar stock_actual ni registrar movimiento', async () => {
  const { calls, connection } = createConnection();
  const result = await updateProductGeneral({
    idParam: '1',
    idUsuario: 7,
    body: validBody,
    withTransactionFn: async (callback) => callback(connection),
  });

  const updateCall = calls.find((call) => /^UPDATE productos/.test(call.sql));
  const movementCall = calls.find((call) => /movimientos_inventario/.test(call.sql));

  assert.equal(result.status, 200);
  assert.equal(result.body.stock_actual, existingProduct.stock_actual);
  assert.equal(result.body.stock_minimo, validBody.stock_minimo);
  assert.ok(updateCall);
  assert.doesNotMatch(updateCall.sql, /stock_actual/);
  assert.deepEqual(updateCall.params, [
    validBody.nombre,
    validBody.categoria,
    validBody.precio_compra,
    validBody.precio_venta,
    validBody.stock_minimo,
    1,
    7,
  ]);
  assert.equal(movementCall, undefined);
});

test('rechaza precios o stock minimo negativos', () => {
  const parsed = validateProductUpdate({
    ...validBody,
    precio_venta: -1,
  });

  assert.deepEqual(parsed, {
    error: 'Precios y stock minimo deben ser numeros mayores o iguales a cero.',
  });
});

test('rechaza stock minimo decimal', () => {
  const parsed = validateProductUpdate({
    ...validBody,
    stock_minimo: 0.5,
  });

  assert.deepEqual(parsed, {
    error: 'El stock minimo debe ser un numero entero.',
  });
});

test('responde 400 para ID invalido sin abrir transaccion', async () => {
  let transactions = 0;
  const result = await updateProductGeneral({
    idParam: 'abc',
    idUsuario: 7,
    body: validBody,
    withTransactionFn: async () => {
      transactions += 1;
    },
  });

  assert.equal(transactions, 0);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Producto invalido.' });
});

test('responde 404 si el producto no existe o pertenece a otro usuario', async () => {
  const { calls, connection } = createConnection({ product: null });
  const result = await updateProductGeneral({
    idParam: '5',
    idUsuario: 7,
    body: validBody,
    withTransactionFn: async (callback) => callback(connection),
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'Producto no encontrado.' });
  assert.deepEqual(calls[0].params, [5, 7]);
});
