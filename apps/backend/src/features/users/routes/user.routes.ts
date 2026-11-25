import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '@/features/auth/middleware/auth.middleware';
import { checkAdminOrGestion } from '../middleware/user.middleware';

const router = Router();
const controller = new UserController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/users - Listar todos los usuarios (solo admin/gestion)
// Query params: role, companyId, isActive
router.get('/', checkAdminOrGestion, controller.getAll);

// GET /api/users/role/:role - Obtener usuarios por rol (solo admin/gestion)
router.get('/role/:role', checkAdminOrGestion, controller.getByRole);

// GET /api/users/:id - Obtener usuario por ID (solo admin/gestion)
router.get('/:id', checkAdminOrGestion, controller.getById);

// PUT /api/users/:id - Actualizar usuario (solo admin/gestion)
router.put('/:id', checkAdminOrGestion, controller.update);

// DELETE /api/users/:id - Eliminar usuario (solo admin/gestion)
router.delete('/:id', checkAdminOrGestion, controller.delete);

export default router;
