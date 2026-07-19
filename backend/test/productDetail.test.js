import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductDetail } from '../src/services/productDetail.js';

const activeProduct = {
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

test('consulta un producto activo del usuario autenticado', async () => {
  const calls = [];
  const result = await getProductDetail({
    idParam: '1',
    idUsuario: 7,
    queryFn: async (sql, params) => {
      calls.push({ sql, params });
      return [activeProduct];
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(calls[0].params, [1, 7]);
  assert.match(calls[0].sql, /id_usuario = \?/);
  assert.deepEqual(result.body, {
    ...activeProduct,
    precio_compra: 40,
    precio_venta: 65,
    stock_actual: 5,
    stock_minimo: 2,
    activo: true,
    estado: 'disponible',
  });
});

test('consulta un producto inactivo conservando su estado', async () => {
  const result = await getProductDetail({
    idParam: '2',
    idUsuario: 7,
    queryFn: async () => [
      {
        ...activeProduct,
        id_producto: 2,
        activo: 0,
      },
    ],
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.activo, false);
  assert.equal(result.body.estado, 'desactivado');
});

test('rechaza un ID invalido sin consultar la base de datos', async () => {
  let calls = 0;
  const result = await getProductDetail({
    idParam: 'abc',
    idUsuario: 7,
    queryFn: async () => {
      calls += 1;
      return [];
    },
  });

  assert.equal(calls, 0);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Producto invalido.' });
});

test('responde 404 cuando el producto no existe', async () => {
  const result = await getProductDetail({
    idParam: '999',
    idUsuario: 7,
    queryFn: async () => [],
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'Producto no encontrado.' });
});

test('responde 404 para producto de otro usuario al filtrar por id_usuario', async () => {
  const calls = [];
  const result = await getProductDetail({
    idParam: '3',
    idUsuario: 7,
    queryFn: async (sql, params) => {
      calls.push({ sql, params });
      return [];
    },
  });

  assert.equal(result.status, 404);
  assert.deepEqual(calls[0].params, [3, 7]);
  assert.match(calls[0].sql, /id_producto = \? AND id_usuario = \?/);
});
