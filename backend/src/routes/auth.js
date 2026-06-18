import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createAuthResponse(usuario) {
  const token = jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const nombre = String(req.body.nombre ?? '').trim();
    const correo = String(req.body.correo ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    const confirmPassword = String(req.body.confirmPassword ?? '');

    if (!nombre || !correo || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Nombre, correo y password son requeridos.' });
    }

    if (!emailPattern.test(correo)) {
      return res.status(400).json({ error: 'Ingresa un correo valido.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'El password debe tener al menos 8 caracteres.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Los passwords no coinciden.' });
    }

    const existentes = await query('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [correo]);

    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Este correo ya esta registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO usuarios (nombre, correo, password_hash, rol, activo) VALUES (?, ?, ?, ?, true)',
      [nombre, correo, passwordHash, 'admin'],
    );

    const usuario = {
      id_usuario: result.insertId,
      nombre,
      correo,
      rol: 'admin',
    };

    return res.status(201).json(createAuthResponse(usuario));
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const correo = String(req.body.correo ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y password son requeridos.' });
    }

    const usuarios = await query(
      'SELECT id_usuario, nombre, correo, password_hash, rol, activo FROM usuarios WHERE correo = ? LIMIT 1',
      [correo],
    );
    const usuario = usuarios[0];

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    return res.json(createAuthResponse(usuario));
  } catch (error) {
    return next(error);
  }
});

export default router;
