import { Router } from 'express';
import { QcReportController } from '../controllers/qc-report.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcReportRouter(
  reportController: QcReportController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  router.get(
    '/performance',
    qcAuthMiddleware,
    qcCheckRoles(['QC_ADMIN', 'QC_DIRECTOR']),
    reportController.getPerformance,
  );

  return router;
}
