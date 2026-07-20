import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../src/middleware/auth.js';

function createResponse() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('permite continuar cuando el usuario tiene rol admin', () => {
  const middleware = requireRole('propietario');
  const req = { user: { rol: 'admin' } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('rechaza usuarios autenticados sin el rol requerido', () => {
  const middleware = requireRole('propietario');
  const req = { user: { rol: 'vendedor' } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.payload, { error: 'No tienes permisos para realizar esta accion.' });
});

test('rechaza solicitudes sin usuario cargado', () => {
  const middleware = requireRole('propietario');
  const req = {};
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
