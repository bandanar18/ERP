import { Router } from 'express';
import { QcIndicatorController } from '../controllers/qc-indicator.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';

export function createQcIndicatorRouter(
  indicatorController: QcIndicatorController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  router.get('/:id/chart', qcAuthMiddleware, indicatorController.getChart);
  router.get('/:id/procurement-distribution', qcAuthMiddleware, indicatorController.getProcurementDistribution);
  router.get('/:id', qcAuthMiddleware, indicatorController.getIndicator);

  return router;
}
