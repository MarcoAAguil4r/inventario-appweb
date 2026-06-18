import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const correo = String(req.body.correo ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
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

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    );

    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
