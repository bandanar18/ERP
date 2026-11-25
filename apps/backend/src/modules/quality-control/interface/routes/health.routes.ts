import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { qcApiLimiter } from '../middleware/rate-limits.js';

export function createHealthRouter(healthController: HealthController): Router {
  const router = Router();

  router.get('/health', qcApiLimiter, healthController.check);

  return router;
}
