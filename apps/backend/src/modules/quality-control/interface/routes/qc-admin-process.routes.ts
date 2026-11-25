import { Router } from 'express';
import { QcAdminProcessController } from '../controllers/qc-admin-process.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcAdminProcessRouter(
  controller: QcAdminProcessController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  router.get('/', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.findAll);
  router.get('/:id', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.findOne);
  router.post('/', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.create);
  router.patch('/:id', qcAuthMiddleware, qcCheckRoles(['QC_ADMIN']), controller.update);

  return router;
}
