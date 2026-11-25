import { Router } from 'express';
import { ProjectsController } from '../controllers';
import { authMiddleware, checkRole, checkAssignedProject } from '../../auth/middleware';

const router = Router();
const controller = new ProjectsController();

// Roles permitidos para lectura
const readRoles = ['administrador', 'gestion', 'admin_financiero'];
// Solo 'gestion' puede crear o editar proyectos según requerimiento
const writeRoles = ['gestion'];

router.get('/', authMiddleware, checkRole([...readRoles, 'planificador', 'direccion']), controller.getAll);
router.get('/companies', authMiddleware, checkRole([...readRoles, 'planificador', 'direccion']), controller.getCompanies);
router.post('/transfer', authMiddleware, checkRole(writeRoles), controller.transfer);
router.get('/company/:companyId', authMiddleware, checkRole([...readRoles, 'planificador', 'direccion']), controller.getProjectsByCompany);
router.get('/:id', authMiddleware, checkRole([...readRoles, 'planificador', 'direccion']), controller.getById);
router.post('/', authMiddleware, checkRole(writeRoles), controller.create);
router.put('/:id', authMiddleware, checkRole(writeRoles), controller.update);
router.put('/:id/manager', authMiddleware, checkRole(writeRoles), controller.assignManager);
router.patch('/:id/advance', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), checkAssignedProject('id'), controller.updateAdvance);

// Costos Reales (Gastos)
router.get('/:projectId/expenses', authMiddleware, checkRole([...readRoles, 'planificador', 'direccion']), controller.getExpenses);
router.post('/:projectId/expenses', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), checkAssignedProject('projectId'), controller.addExpense);
router.put('/expenses/:id', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), controller.updateExpense);
router.delete('/expenses/:id', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), controller.removeExpense);

// Cobros Registrados
router.get('/:projectId/collections', authMiddleware, checkRole([...readRoles, 'planificador', 'direccion']), controller.getCollections);
router.post('/:projectId/collections', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), checkAssignedProject('projectId'), controller.addCollection);
router.put('/collections/:id', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), controller.updateCollection);
router.delete('/collections/:id', authMiddleware, checkRole(['administrador', 'admin_financiero', 'gestion']), controller.removeCollection);

export default router;
