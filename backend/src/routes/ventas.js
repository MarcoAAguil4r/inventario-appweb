import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { query, withTransaction } from '../db.js';
import { getMexicoCityUtcBounds } from '../services/operationalSummary.js';
import { cancelSale, createSale, getSaleDetail, listSales } from '../services/sales.js';
import { getBusinessOwnerId, hasPermission, PERMISSIONS } from '../services/roles.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.SALES_VIEW_OWN), async (req, res, next) => {
  try {
    const result = await listSales({
      idUsuario: req.user.id_usuario,
      ownerId: getBusinessOwnerId(req.user),
      includeAllUsers: hasPermission(req.user.rol, PERMISSIONS.SALES_VIEW_ALL),
      fecha: req.query.fecha,
      queryFn: query,
      getDayBoundsFn: getMexicoCityUtcBounds,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.post('/', requirePermission(PERMISSIONS.SALES_CREATE), async (req, res, next) => {
  try {
    const result = await createSale({
      idUsuario: getBusinessOwnerId(req.user),
      responsibleUserId: req.user.id_usuario,
      body: req.body,
      withTransactionFn: withTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', requirePermission(PERMISSIONS.SALES_VIEW_OWN), async (req, res, next) => {
  try {
    const result = await getSaleDetail({
      idUsuario: req.user.id_usuario,
      ownerId: getBusinessOwnerId(req.user),
      includeAllUsers: hasPermission(req.user.rol, PERMISSIONS.SALES_VIEW_ALL),
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
      idUsuario: getBusinessOwnerId(req.user),
      responsibleUserId: req.user.id_usuario,
      canCancel: hasPermission(req.user.rol, PERMISSIONS.SALES_CANCEL),
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
