const defaultMaxRequests = 3;
const defaultWindowMinutes = 30;
const tooManyPasswordResetRequestsResponse = {
  ok: false,
  message: 'Se realizaron demasiadas solicitudes. Intenta nuevamente más tarde.',
};

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPasswordResetRateLimitConfig(env = process.env) {
  const maxRequests = parsePositiveInteger(env.PASSWORD_RESET_MAX_REQUESTS, defaultMaxRequests);
  const windowMinutes = parsePositiveInteger(env.PASSWORD_RESET_WINDOW_MINUTES, defaultWindowMinutes);

  return {
    maxRequests,
    windowMinutes,
    windowMs: windowMinutes * 60 * 1000,
  };
}

export function normalizePasswordResetEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function pruneRequests(requests, windowStart) {
  while (requests.length > 0 && requests[0] <= windowStart) {
    requests.shift();
  }
}

export function createPasswordResetRateLimitStore({ maxRequests, windowMs, now = () => Date.now() } = {}) {
  const requestLimit = maxRequests ?? defaultMaxRequests;
  const requestWindowMs = windowMs ?? defaultWindowMinutes * 60 * 1000;
  const requestsByIp = new Map();
  const requestsByEmail = new Map();

  function isLimitReached(store, key, timestamp) {
    if (!key) return false;

    const requests = store.get(key) ?? [];
    pruneRequests(requests, timestamp - requestWindowMs);
    store.set(key, requests);

    return requests.length >= requestLimit;
  }

  function recordRequest(store, key, timestamp) {
    if (!key) return;

    const requests = store.get(key) ?? [];
    pruneRequests(requests, timestamp - requestWindowMs);
    requests.push(timestamp);
    store.set(key, requests);
  }

  return {
    checkAndRecord({ ip, correo }) {
      const timestamp = now();
      const normalizedCorreo = normalizePasswordResetEmail(correo);
      const ipKey = String(ip ?? 'unknown').trim() || 'unknown';

      const limitedByIp = isLimitReached(requestsByIp, ipKey, timestamp);
      const limitedByEmail = isLimitReached(requestsByEmail, normalizedCorreo, timestamp);

      if (limitedByIp || limitedByEmail) {
        return {
          allowed: false,
          reason: limitedByIp ? 'ip' : 'email',
          correo: normalizedCorreo,
        };
      }

      recordRequest(requestsByIp, ipKey, timestamp);
      recordRequest(requestsByEmail, normalizedCorreo, timestamp);

      return {
        allowed: true,
        correo: normalizedCorreo,
      };
    },
    clear() {
      requestsByIp.clear();
      requestsByEmail.clear();
    },
  };
}

export function createPasswordResetRateLimiter(options = {}) {
  const config = {
    ...getPasswordResetRateLimitConfig(),
    ...options,
  };
  const store = options.store ?? createPasswordResetRateLimitStore(config);

  return function passwordResetRateLimiter(req, res, next) {
    const result = store.checkAndRecord({
      ip: req.ip,
      correo: req.body?.correo,
    });

    req.normalizedPasswordResetEmail = result.correo;

    if (!result.allowed) {
      return res.status(429).json(tooManyPasswordResetRequestsResponse);
    }

    return next();
  };
}

export { tooManyPasswordResetRequestsResponse };
