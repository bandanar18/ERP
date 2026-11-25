import { Router } from 'express';
import { ErpUsersController } from '../controllers/erp-users.controller.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';

export function createErpUsersRouter(
  controller: ErpUsersController,
  authMiddleware: any
): Router {
  const router = Router();

  // Protect all /erp-users routes with pmCheckRoles(['PM_ADMIN','PM_GESTION'])
  router.use(authMiddleware);
  router.use(pmCheckRoles(['PM_ADMIN', 'PM_GESTION']));

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
