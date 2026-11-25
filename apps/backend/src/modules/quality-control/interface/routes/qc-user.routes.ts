import { Router } from 'express';
import { QcUserController } from '../controllers/qc-user.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcCheckRoles } from '../middleware/qc-roles.middleware.js';

export function createQcUserRouter(
  userController: QcUserController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();
  const adminOnly = qcCheckRoles(['QC_ADMIN']);

  // Literales primero (antes de cualquier :id)
  router.get('/', qcAuthMiddleware, adminOnly, userController.findAll);
  router.get('/roles', qcAuthMiddleware, adminOnly, userController.getRoles);
  router.get('/permissions', qcAuthMiddleware, adminOnly, userController.getPermissions);

  // CRUD de usuarios del módulo
  router.post('/', qcAuthMiddleware, adminOnly, userController.create);
  router.patch('/:id/profile', qcAuthMiddleware, adminOnly, userController.updateProfile);
  router.patch('/:id/toggle-active', qcAuthMiddleware, adminOnly, userController.toggleActive);
  router.post('/:id/reset-password', qcAuthMiddleware, adminOnly, userController.resetPassword);
  router.delete('/:id', qcAuthMiddleware, adminOnly, userController.remove);

  router.patch('/roles/:id/permissions', qcAuthMiddleware, adminOnly, userController.updateRolePermissions);
  router.patch('/:id/roles', qcAuthMiddleware, adminOnly, userController.updateUserRoles);
  router.patch('/:id/scopes', qcAuthMiddleware, adminOnly, userController.updateUserScopes);

  return router;
}
