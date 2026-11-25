import { Router } from 'express';
import { UserManagementController } from '../controllers';
import { authMiddleware, checkRole } from '../../auth/middleware/auth.middleware';

const router = Router();
const controller = new UserManagementController();

router.use(authMiddleware as any);
router.use(checkRole(['gestion']) as any);

router.get('/', controller.getAllUsers);
router.get('/roles', controller.getRoles);
router.put('/:id/role', controller.updateRole);
router.put('/:id/company', controller.updateCompany);
router.put('/:id/toggle-active', controller.toggleActive);

export default router;
