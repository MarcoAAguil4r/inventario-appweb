import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { withTransaction } from '../db.js';
import { createSale } from '../services/sales.js';

const router = Router();

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const result = await createSale({
      idUsuario: req.user.id_usuario,
      body: req.body,
      withTransactionFn: withTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

export default router;
