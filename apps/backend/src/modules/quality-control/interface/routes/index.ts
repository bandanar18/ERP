import { Router } from 'express';
import { qcErrorHandler } from '../middleware/error-handler.middleware.js';

export interface QualityControlRouters {
  healthRouter: Router;
  authRouter: Router;
  processesRouter: Router;
  indicatorsRouter: Router;
  measurementsRouter: Router;
  dashboardsRouter: Router;
  reportsRouter: Router;
  auditLogsRouter: Router;
  adminIndicatorsRouter: Router;
  adminProcessesRouter: Router;
  usersRouter: Router;
  exportsRouter: Router;
}

export function createQcRouter(routers: QualityControlRouters): Router {
  const router = Router();

  router.use('/', routers.healthRouter);
  router.use('/auth', routers.authRouter);
  router.use('/processes', routers.processesRouter);
  router.use('/indicators', routers.indicatorsRouter);
  router.use('/measurements', routers.measurementsRouter);
  router.use('/dashboard', routers.dashboardsRouter);
  router.use('/reports', routers.reportsRouter);
  router.use('/audit-logs', routers.auditLogsRouter);
  router.use('/admin/indicators', routers.adminIndicatorsRouter);
  router.use('/admin/processes', routers.adminProcessesRouter);
  router.use('/users', routers.usersRouter);
  router.use('/exports', routers.exportsRouter);

  // Error handler atrapa cualquier QcError en este router
  router.use(qcErrorHandler);

  return router;
}
