import { Router } from 'express';
import { PmGalleryFileController } from '../controllers/pm-gallery-file.controller.js';
import { uploadSingle } from '../../infrastructure/storage/upload.middleware.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';

export function createPmGalleryFileRouter(
  controller: PmGalleryFileController,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  // Uses default roles (can be restricted per endpoint if needed)
  router.get('/:entityType/:entityId', pmCheckRoles(['PM_ADMIN', 'PM_GESTION', 'PM_PLANIFICADOR']), controller.getFiles.bind(controller));
  router.post('/:entityType/:entityId', pmCheckRoles(['PM_ADMIN', 'PM_GESTION', 'PM_PLANIFICADOR']), uploadSingle, controller.uploadFile.bind(controller));
  router.delete('/:id', pmCheckRoles(['PM_ADMIN', 'PM_GESTION', 'PM_PLANIFICADOR']), controller.deleteFile.bind(controller));

  return router;
}
