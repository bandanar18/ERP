import { Router } from 'express';
import { PhysicalProgressController } from '../controllers/physical-progress.controller';
import { authMiddleware } from '../../auth/middleware/auth.middleware';
import { requireProgressRole } from '../middleware/role.middleware';

const router = Router();
const controller = new PhysicalProgressController();

/**
 * GET /api/physical-progress/project/:projectId
 * Planificador: solo sus proyectos
 * Admin/Gestión: todos los proyectos
 */
router.get('/project/:projectId', authMiddleware, requireProgressRole, (req, res) => controller.getProjectProgress(req, res));

/**
 * GET /api/physical-progress/company/:companyId
 * Planificador: solo sus proyectos de esa empresa
 * Admin/Gestión: todos los proyectos de esa empresa
 */
router.get('/company/:companyId', authMiddleware, requireProgressRole, (req, res) => controller.getLatestByCompany(req, res));

/**
 * GET /api/physical-progress
 * Planificador: sus avances agrupados por empresa/proyecto
 * Admin/Gestión: todos los avances agrupados por empresa/proyecto
 */
router.get('/', authMiddleware, requireProgressRole, (req, res) => controller.getPlannerProgress(req, res));

/**
 * POST /api/physical-progress
 * Crear un nuevo avance físico
 * Planificador: solo para sus proyectos
 * Admin/Gestión: para cualquier proyecto
 */
router.post('/', authMiddleware, requireProgressRole, (req, res) => controller.create(req, res));

/**
 * PATCH /api/physical-progress/:id
 * Actualizar un avance físico existente
 * Planificador: solo para sus proyectos
 */
router.patch('/:id', authMiddleware, requireProgressRole, (req, res) => controller.update(req, res));

export default router;
