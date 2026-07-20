import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticacion requerido.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado.' });
  }
}

export function requireRole(...allowedRoles) {
  const roles = new Set(allowedRoles);

  return function roleMiddleware(req, res, next) {
    const userRole = req.user?.rol;

    if (!userRole || !roles.has(userRole)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta accion.' });
    }

    return next();
  };
}
