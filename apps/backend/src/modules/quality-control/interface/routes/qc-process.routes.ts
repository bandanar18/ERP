import { Router } from 'express';
import { QcProcessController } from '../controllers/qc-process.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';

export function createQcProcessRouter(
  processController: QcProcessController,
  qcAuthMiddleware: QcAuthMiddleware,
): Router {
  const router = Router();

  router.get('/mine', qcAuthMiddleware, processController.mine);
  router.get('/', qcAuthMiddleware, processController.list);

  return router;
}
