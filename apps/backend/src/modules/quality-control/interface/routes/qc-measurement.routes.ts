import { Router } from 'express';
import { QcMeasurementController } from '../controllers/qc-measurement.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcMeasurementRouter(
  measurementController: QcMeasurementController,
  qcAuthMiddleware: QcAuthMiddleware,
  qcScopeMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  // Submit: autenticado + scope. QC_DIRECTOR es SOLO LECTURA (no carga mediciones).
  router.post(
    '/',
    qcAuthMiddleware,
    qcCheckRoles(['QC_ADMIN', 'QC_OWNER']),
    qcScopeMiddleware,
    measurementController.submit,
  );
  // Listado: autenticado (filtrado por rol en el controller)
  router.get('/', qcAuthMiddleware, measurementController.list);
  // Revisión: solo QC_ADMIN (QC_DIRECTOR solo lee, no aprueba ni rechaza)
  router.patch(
    '/:id/review',
    qcAuthMiddleware,
    qcCheckRoles(['QC_ADMIN']),
    measurementController.review,
  );

  return router;
}
