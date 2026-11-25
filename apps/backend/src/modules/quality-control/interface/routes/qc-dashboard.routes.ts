import { Router } from 'express';
import { QcDashboardController } from '../controllers/qc-dashboard.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcDashboardRouter(
  dashboardController: QcDashboardController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  // Resumen global (cualquier usuario autenticado del módulo)
  router.get('/summary', qcAuthMiddleware, dashboardController.getSummary);
  // Matriz consolidada + período activo (cualquier usuario autenticado)
  router.get('/matrix', qcAuthMiddleware, dashboardController.getMatrix);
  router.get('/active-period', qcAuthMiddleware, dashboardController.getActivePeriod);
  // Resumen del QC_OWNER restringido a sus procesos asignados
  router.get(
    '/owner/summary',
    qcAuthMiddleware,
    qcCheckRoles(['QC_OWNER']),
    dashboardController.getOwnerSummary,
  );
  // Tendencia de cumplimiento (solo ADMIN/DIRECTOR)
  router.get(
    '/director/trend',
    qcAuthMiddleware,
    qcCheckRoles(['QC_ADMIN', 'QC_DIRECTOR']),
    dashboardController.getComplianceTrend,
  );

  return router;
}
