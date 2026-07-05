import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sendInventoryAlert } from '../services/email.js';

const router = Router();

router.use(requireAuth);

router.post('/email-prueba', async (req, res, next) => {
  try {
    const asunto = String(req.body.asunto ?? 'Prueba de alerta de inventario').trim();
    const mensaje = String(req.body.mensaje ?? '').trim();

    if (!mensaje || mensaje.length < 10) {
      return res.status(400).json({ error: 'Mensaje requerido con al menos 10 caracteres.' });
    }

    const email = await sendInventoryAlert({
      subject: asunto,
      text: mensaje,
      html: `<p>${mensaje}</p>`,
    });

    return res.status(201).json({
      ok: true,
      integration: 'email',
      email,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
