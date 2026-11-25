import { Router } from 'express';
import { QcExportController } from '../controllers/qc-export.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcExportRouter(
  exportController: QcExportController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();
  const adminDirector = qcCheckRoles(['QC_ADMIN', 'QC_DIRECTOR']);

  router.get('/pdf', qcAuthMiddleware, adminDirector, exportController.exportPdf);
  router.get('/xlsx', qcAuthMiddleware, adminDirector, exportController.exportXlsx);

  return router;
}
