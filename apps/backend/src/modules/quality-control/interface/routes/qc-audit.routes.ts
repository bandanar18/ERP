import { Router } from 'express';
import { QcAuditLogController } from '../controllers/qc-audit.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcAuditRouter(
  auditController: QcAuditLogController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  router.get(
    '/',
    qcAuthMiddleware,
    qcCheckRoles(['QC_ADMIN', 'QC_DIRECTOR']),
    auditController.findAll,
  );

  return router;
}
