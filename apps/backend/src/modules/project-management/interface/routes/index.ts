import { Router } from 'express';
import { pmErrorHandler } from '../middleware/error-handler.middleware.js';

export interface ProjectManagementRouters {
  authRouter: Router;
  moduleUsersRouter: Router;
  erpUsersRouter: Router;
  financialValuationsRouter: Router;
  costPlanningsRouter: Router;
  galleryFilesRouter: Router;
  payablesRouter: Router;
}

export function createModuleRouter(routers: ProjectManagementRouters): Router {
  const router = Router();

  router.use('/auth', routers.authRouter);
  router.use('/module-users', routers.moduleUsersRouter);
  router.use('/erp-users', routers.erpUsersRouter);
  router.use('/financial-valuations', routers.financialValuationsRouter);
  router.use('/cost-plannings', routers.costPlanningsRouter);
  router.use('/gallery-files', routers.galleryFilesRouter);
  router.use('/payables', routers.payablesRouter);

  // Error handler atrapa cualquier PmError en este router
  router.use(pmErrorHandler);

  return router;
}
