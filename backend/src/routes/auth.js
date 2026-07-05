import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { sendEmail } from '../services/email.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetTokenTtlMinutes = 30;
const forgotPasswordResponse = {
  ok: true,
  message: 'Si el correo existe, enviaremos instrucciones para recuperar la contrasena.',
};

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function validatePassword(password, confirmPassword) {
  if (!password || !confirmPassword) return 'Password y confirmacion son requeridos.';
  if (password.length < 8) return 'El password debe tener al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'El password debe incluir al menos una letra y un numero.';
  }
  if (password !== confirmPassword) return 'Los passwords no coinciden.';
  return null;
}

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

    const passwordError = validatePassword(password, confirmPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

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

router.post('/forgot-password', async (req, res, next) => {
  try {
    const correo = String(req.body.correo ?? '').trim().toLowerCase();

    if (!correo || !emailPattern.test(correo)) {
      return res.status(200).json(forgotPasswordResponse);
    }

    const usuarios = await query(
      'SELECT id_usuario, nombre, correo, activo FROM usuarios WHERE correo = ? LIMIT 1',
      [correo],
    );
    const usuario = usuarios[0];

    if (!usuario || !usuario.activo) {
      return res.status(200).json(forgotPasswordResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + resetTokenTtlMinutes * 60 * 1000);
    const resetUrl = new URL(process.env.RESET_PASSWORD_URL ?? 'http://localhost:3000/reset-password');
    resetUrl.searchParams.set('token', resetToken);

    await withTransaction(async (connection) => {
      await connection.execute(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id_usuario = ? AND used_at IS NULL',
        [usuario.id_usuario],
      );
      await connection.execute(
        `INSERT INTO password_reset_tokens (id_usuario, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [usuario.id_usuario, tokenHash, expiresAt],
      );
    });

    try {
      const safeName = escapeHtml(usuario.nombre);
      const safeUrl = escapeHtml(resetUrl.toString());

      await sendEmail({
        to: usuario.correo,
        subject: 'Recuperacion de contrasena',
        text: `Hola ${usuario.nombre}. Usa este enlace para cambiar tu contrasena. Expira en ${resetTokenTtlMinutes} minutos: ${resetUrl.toString()}`,
        html: `<p>Hola ${safeName}.</p><p>Usa este enlace para cambiar tu contrasena. Expira en ${resetTokenTtlMinutes} minutos.</p><p><a href="${safeUrl}">Cambiar contrasena</a></p>`,
      });
    } catch (emailError) {
      console.error('[Password reset email error]', {
        userId: usuario.id_usuario,
        message: emailError.message,
      });
    }

    return res.status(200).json(forgotPasswordResponse);
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token ?? '').trim();
    const password = String(req.body.password ?? '');
    const confirmPassword = String(req.body.confirmPassword ?? '');

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Token invalido o expirado.' });
    }

    const passwordError = validatePassword(password, confirmPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const tokenHash = hashResetToken(token);
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await withTransaction(async (connection) => {
      const [tokens] = await connection.execute(
        `SELECT r.id_reset, r.id_usuario, u.activo
         FROM password_reset_tokens r
         INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
         WHERE r.token_hash = ?
           AND r.used_at IS NULL
           AND r.expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [tokenHash],
      );
      const reset = tokens[0];

      if (!reset || !reset.activo) return null;

      await connection.execute('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [
        passwordHash,
        reset.id_usuario,
      ]);
      await connection.execute('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id_reset = ?', [
        reset.id_reset,
      ]);
      await connection.execute(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id_usuario = ? AND used_at IS NULL',
        [reset.id_usuario],
      );

      return { ok: true };
    });

    if (!result) return res.status(400).json({ error: 'Token invalido o expirado.' });

    return res.json({ ok: true, message: 'Contrasena actualizada correctamente.' });
  } catch (error) {
    return next(error);
  }
});

export default router;
