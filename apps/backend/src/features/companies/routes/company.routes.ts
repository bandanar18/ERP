import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authMiddleware } from '@/features/auth/middleware/auth.middleware';
import { checkAdminOrGestion } from '../middleware/company.middleware';

const router = Router();
const controller = new CompanyController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/companies - Listar todas las empresas
router.get('/', controller.getAll);

// GET /api/companies/:id - Obtener empresa por ID
router.get('/:id', controller.getById);

// POST /api/companies - Crear empresa (solo admin/gestion)
router.post('/', checkAdminOrGestion, controller.create);

// PUT /api/companies/:id - Actualizar la ficha (administrador y gestión)
router.put('/:id', checkAdminOrGestion, controller.update);

// DELETE /api/companies/:id - Eliminar empresa (solo admin/gestion)
router.delete('/:id', checkAdminOrGestion, controller.delete);

export default router;
