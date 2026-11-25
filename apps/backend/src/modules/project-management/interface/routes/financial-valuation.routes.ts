import { Router } from 'express';
import { FinancialValuationController } from '../controllers/financial-valuation.controller.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';
import { pmScopeMiddleware } from '../middleware/pm-scope.middleware.js';

export function createFinancialValuationRouter(
  controller: FinancialValuationController,
  authMiddleware: any
): Router {
  const router = Router();

  router.use(authMiddleware);

  // GET /project/:projectId
  router.get(
    '/project/:projectId',
    pmCheckRoles(['PM_ADMIN', 'PM_GESTION', 'PM_PLANIFICADOR']),
    pmScopeMiddleware({ projectParam: 'projectId' }),
    controller.getByProject.bind(controller)
  );

  // POST /
  router.post(
    '/',
    pmCheckRoles(['PM_ADMIN', 'PM_GESTION']),
    controller.create.bind(controller)
  );

  // PATCH /:id
  router.patch(
    '/:id',
    pmCheckRoles(['PM_ADMIN', 'PM_GESTION']),
    controller.update.bind(controller)
  );

  return router;
}
