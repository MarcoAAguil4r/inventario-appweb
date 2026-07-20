import jwt from 'jsonwebtoken';
import { hasPermission, normalizeRole } from '../services/roles.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticacion requerido.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.user.rol = normalizeRole(req.user.rol);
    return next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado.' });
  }
}

export function requireRole(...allowedRoles) {
  const roles = new Set(allowedRoles);

  return function roleMiddleware(req, res, next) {
    const userRole = req.user?.rol;

    if (!userRole || !roles.has(normalizeRole(userRole))) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta accion.' });
    }

    return next();
  };
}

export function requirePermission(permission) {
  return function permissionMiddleware(req, res, next) {
    if (!hasPermission(req.user?.rol, permission)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta accion.' });
    }

    return next();
  };
}
