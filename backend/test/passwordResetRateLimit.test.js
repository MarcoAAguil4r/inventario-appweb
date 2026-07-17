import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPasswordResetRateLimiter,
  createPasswordResetRateLimitStore,
  getPasswordResetRateLimitConfig,
  normalizePasswordResetEmail,
  tooManyPasswordResetRequestsResponse,
} from '../src/middleware/passwordResetRateLimit.js';

function createStore(maxRequests = 3) {
  let currentTime = 1_000;
  const store = createPasswordResetRateLimitStore({
    maxRequests,
    windowMs: 30_000,
    now: () => currentTime,
  });

  return {
    store,
    advance(ms) {
      currentTime += ms;
    },
  };
}

test('normaliza el correo antes de contar solicitudes', () => {
  assert.equal(normalizePasswordResetEmail('  Usuario@Example.COM  '), 'usuario@example.com');
});

test('permite exactamente el maximo configurado y bloquea la solicitud adicional por correo', () => {
  const { store } = createStore();
  const request = { ip: '10.0.0.1', correo: 'USER@example.com' };

  assert.equal(store.checkAndRecord(request).allowed, true);
  assert.equal(store.checkAndRecord(request).allowed, true);
  assert.equal(store.checkAndRecord(request).allowed, true);

  const blocked = store.checkAndRecord({ ip: '10.0.0.2', correo: ' user@example.com ' });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'email');
});

test('bloquea por IP aunque se usen varios correos', () => {
  const { store } = createStore();

  assert.equal(store.checkAndRecord({ ip: '10.0.0.1', correo: 'uno@example.com' }).allowed, true);
  assert.equal(store.checkAndRecord({ ip: '10.0.0.1', correo: 'dos@example.com' }).allowed, true);
  assert.equal(store.checkAndRecord({ ip: '10.0.0.1', correo: 'tres@example.com' }).allowed, true);

  const blocked = store.checkAndRecord({ ip: '10.0.0.1', correo: 'cuatro@example.com' });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'ip');
});

test('bloquea por correo aunque se usen varias IPs', () => {
  const { store } = createStore();

  assert.equal(store.checkAndRecord({ ip: '10.0.0.1', correo: 'user@example.com' }).allowed, true);
  assert.equal(store.checkAndRecord({ ip: '10.0.0.2', correo: 'USER@example.com' }).allowed, true);
  assert.equal(store.checkAndRecord({ ip: '10.0.0.3', correo: ' user@example.com ' }).allowed, true);

  const blocked = store.checkAndRecord({ ip: '10.0.0.4', correo: 'user@example.com' });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'email');
});

test('permite una nueva solicitud despues de terminar la ventana', () => {
  const limit = createStore();
  const request = { ip: '10.0.0.1', correo: 'user@example.com' };

  assert.equal(limit.store.checkAndRecord(request).allowed, true);
  assert.equal(limit.store.checkAndRecord(request).allowed, true);
  assert.equal(limit.store.checkAndRecord(request).allowed, true);
  assert.equal(limit.store.checkAndRecord(request).allowed, false);

  limit.advance(30_001);

  assert.equal(limit.store.checkAndRecord(request).allowed, true);
});

test('usa variables configurables con valores seguros por defecto', () => {
  assert.deepEqual(getPasswordResetRateLimitConfig({}), {
    maxRequests: 3,
    windowMinutes: 30,
    windowMs: 1_800_000,
  });
  assert.deepEqual(
    getPasswordResetRateLimitConfig({
      PASSWORD_RESET_MAX_REQUESTS: '5',
      PASSWORD_RESET_WINDOW_MINUTES: '15',
    }),
    {
      maxRequests: 5,
      windowMinutes: 15,
      windowMs: 900_000,
    },
  );
});

test('el middleware bloqueado responde 429 y no ejecuta la ruta', () => {
  let nextCalls = 0;
  const store = {
    checkAndRecord() {
      return {
        allowed: false,
        reason: 'ip',
        correo: 'user@example.com',
      };
    },
  };
  const middleware = createPasswordResetRateLimiter({ store });
  const req = {
    ip: '10.0.0.1',
    body: { correo: 'user@example.com' },
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  middleware(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.body, tooManyPasswordResetRequestsResponse);
});
