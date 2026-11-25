import { Router } from 'express';
import { CostPlanningController } from '../controllers/cost.controller';
import { authMiddleware, checkRole } from '../../auth/middleware';

const router = Router();
const controller = new CostPlanningController();

router.post('/', authMiddleware, checkRole(['administrador', 'gestion', 'planificador']), controller.create);
router.get('/project/:projectId', authMiddleware, controller.getByProjectId);
router.get('/project/:projectId/grouped', authMiddleware, controller.getGroupedCosts);

export default router;
