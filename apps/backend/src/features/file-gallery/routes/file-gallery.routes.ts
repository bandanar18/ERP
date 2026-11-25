import { Router } from 'express';
import { FileGalleryController } from '../controllers';
import { authMiddleware, checkRole } from '../../auth/middleware';
import { uploadSingle } from '../middleware';

const router = Router();
const controller = new FileGalleryController();

// Roles permitidos
const readRoles = ['administrador', 'gestion', 'planificador', 'direccion'];
const writeRoles = ['administrador', 'gestion', 'planificador'];

// Routes - MÁS ESPECÍFICAS PRIMERO
router.get(
  '/file/:id',
  authMiddleware,
  checkRole(readRoles),
  controller.getFile
);

router.delete(
  '/file/:id',
  authMiddleware,
  checkRole(writeRoles),
  controller.deleteFile
);

router.get(
  '/download/:id',
  authMiddleware,
  checkRole(readRoles),
  controller.downloadFile
);

// Rutas con entidad y stats
router.get(
  '/:entityType/:entityId/stats',
  authMiddleware,
  checkRole(readRoles),
  controller.getStats
);

router.get(
  '/:entityType/:entityId',
  authMiddleware,
  checkRole(readRoles),
  controller.getFiles
);

router.post(
  '/:entityType/:entityId',
  authMiddleware,
  checkRole(writeRoles),
  uploadSingle,
  controller.uploadFile
);

export default router;
