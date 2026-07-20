import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { assignableRoles, getBusinessOwnerId, PERMISSIONS, ROLE_LABELS, ROLES } from '../services/roles.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.USERS_MANAGE));

function mapUsuario(usuario) {
  return {
    id_usuario: Number(usuario.id_usuario),
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    rol_label: ROLE_LABELS[usuario.rol] ?? usuario.rol,
    activo: Boolean(usuario.activo),
    id_propietario: Number(usuario.id_propietario ?? usuario.id_usuario),
    creado_en: usuario.creado_en,
  };
}

function validateAssignableRole(value) {
  const rol = String(value ?? '').trim().toLowerCase();
  return assignableRoles.has(rol) ? rol : null;
}

router.get('/', async (req, res, next) => {
  try {
    const ownerId = getBusinessOwnerId(req.user);
    const usuarios = await query(
      `SELECT id_usuario, nombre, correo, rol, activo, id_propietario, creado_en
       FROM usuarios
       WHERE id_usuario = ? OR id_propietario = ?
       ORDER BY rol = ? DESC, activo DESC, nombre ASC`,
      [ownerId, ownerId, ROLES.PROPIETARIO],
    );

    return res.json(usuarios.map(mapUsuario));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const ownerId = getBusinessOwnerId(req.user);
    const nombre = String(req.body.nombre ?? '').trim();
    const correo = String(req.body.correo ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    const rol = validateAssignableRole(req.body.rol);

    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({ error: 'Nombre, correo, password y rol son requeridos.' });
    }

    if (!emailPattern.test(correo)) {
      return res.status(400).json({ error: 'Ingresa un correo valido.' });
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'El password debe tener al menos 8 caracteres, una letra y un numero.' });
    }

    const existentes = await query('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [correo]);

    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Este correo ya esta registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol, activo, id_propietario)
       VALUES (?, ?, ?, ?, true, ?)`,
      [nombre, correo, passwordHash, rol, ownerId],
    );
    const usuarios = await query(
      `SELECT id_usuario, nombre, correo, rol, activo, id_propietario, creado_en
       FROM usuarios
       WHERE id_usuario = ?
       LIMIT 1`,
      [result.insertId],
    );

    return res.status(201).json(mapUsuario(usuarios[0]));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/rol', async (req, res, next) => {
  try {
    const ownerId = getBusinessOwnerId(req.user);
    const idUsuario = Number(req.params.id);
    const rol = validateAssignableRole(req.body.rol);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({ error: 'Usuario invalido.' });
    }

    if (!rol) {
      return res.status(400).json({ error: 'Rol invalido. Usa encargado o vendedor.' });
    }

    if (idUsuario === ownerId) {
      return res.status(400).json({ error: 'No se puede cambiar el rol del propietario.' });
    }

    const result = await query(
      'UPDATE usuarios SET rol = ? WHERE id_usuario = ? AND id_propietario = ?',
      [rol, idUsuario, ownerId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuarios = await query(
      `SELECT id_usuario, nombre, correo, rol, activo, id_propietario, creado_en
       FROM usuarios
       WHERE id_usuario = ?
       LIMIT 1`,
      [idUsuario],
    );

    return res.json(mapUsuario(usuarios[0]));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  try {
    const ownerId = getBusinessOwnerId(req.user);
    const idUsuario = Number(req.params.id);
    const activo = Boolean(req.body.activo);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({ error: 'Usuario invalido.' });
    }

    if (idUsuario === ownerId) {
      return res.status(400).json({ error: 'No se puede desactivar el propietario.' });
    }

    const result = await query(
      'UPDATE usuarios SET activo = ? WHERE id_usuario = ? AND id_propietario = ?',
      [activo, idUsuario, ownerId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuarios = await query(
      `SELECT id_usuario, nombre, correo, rol, activo, id_propietario, creado_en
       FROM usuarios
       WHERE id_usuario = ?
       LIMIT 1`,
      [idUsuario],
    );

    return res.json(mapUsuario(usuarios[0]));
  } catch (error) {
    return next(error);
  }
});

export default router;
