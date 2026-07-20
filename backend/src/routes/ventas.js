import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../db.js';
import { getMexicoCityUtcBounds } from '../services/operationalSummary.js';
import { cancelSale, createSale, getSaleDetail, listSales } from '../services/sales.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await listSales({
      idUsuario: req.user.id_usuario,
      fecha: req.query.fecha,
      queryFn: query,
      getDayBoundsFn: getMexicoCityUtcBounds,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

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

router.get('/:id', async (req, res, next) => {
  try {
    const result = await getSaleDetail({
      idUsuario: req.user.id_usuario,
      idParam: req.params.id,
      queryFn: query,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/cancelar', async (req, res, next) => {
  try {
    const result = await cancelSale({
      idUsuario: req.user.id_usuario,
      idParam: req.params.id,
      body: req.body,
      withTransactionFn: withTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

export default router;
