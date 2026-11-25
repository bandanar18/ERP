import { Router } from 'express';
import { ModuleUserController } from '../controllers/module-user.controller.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';

export function createModuleUserRoutes(
  controller: ModuleUserController,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.list.bind(controller));
  router.get('/roles', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.listRoles.bind(controller));
  router.post('/', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.create.bind(controller));

  router.patch('/:id/role', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.updateRole.bind(controller));
  router.patch('/:id/scopes', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.updateScopes.bind(controller));
  router.patch('/:id/toggle-active', pmCheckRoles(['PM_ADMIN', 'PM_GESTION']), controller.toggleActive.bind(controller));

  return router;
}
