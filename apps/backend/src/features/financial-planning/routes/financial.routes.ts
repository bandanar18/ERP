import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';
import { authMiddleware, checkRole, checkAssignedProject } from '../../auth/middleware';

const router = Router();
const controller = new FinancialController();

// Roles permitidos
const readRoles = ['administrador', 'gestion', 'planificador', 'direccion', 'admin_financiero'];
const writeRoles = ['administrador', 'gestion', 'planificador'];

router.post('/', authMiddleware, checkRole(writeRoles), controller.create);
router.get('/project/:projectId', authMiddleware, checkRole(readRoles), checkAssignedProject('projectId'), controller.getByProjectId);
router.patch('/:id/status', authMiddleware, checkRole(writeRoles), controller.updateStatus);
router.patch('/:id/amount', authMiddleware, checkRole(writeRoles), controller.updateAmount);

export default router;
