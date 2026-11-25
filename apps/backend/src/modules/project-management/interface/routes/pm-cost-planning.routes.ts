import { Router } from 'express';
import { PmCostPlanningController } from '../controllers/pm-cost-planning.controller.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';
import { pmScopeMiddleware } from '../middleware/pm-scope.middleware.js';

export function createCostPlanningRouter(
  controller: PmCostPlanningController,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post('/', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.create.bind(controller));
  router.get('/project/:projectId', pmCheckRoles(['PM_ADMIN', 'PM_GESTION', 'PM_PLANIFICADOR', 'PM_ADMIN_FINANCIERO']), pmScopeMiddleware({ projectParam: 'projectId' }), controller.getByProjectId.bind(controller));

  return router;
}
