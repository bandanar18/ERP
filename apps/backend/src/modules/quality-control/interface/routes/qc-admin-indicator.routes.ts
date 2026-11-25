import { Router } from 'express';
import { QcAdminIndicatorController } from '../controllers/qc-admin-indicator.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcAdminIndicatorRouter(
  controller: QcAdminIndicatorController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  router.get('/', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.findAll);
  router.get('/:id', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.findOne);
  router.post('/', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.create);
  router.patch('/:id', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.update);

  return router;
}
