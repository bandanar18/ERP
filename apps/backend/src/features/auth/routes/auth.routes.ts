import { Router } from 'express';
import { AuthController, SecurityController } from '../controllers';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';
import { loginRateLimiter, registerRateLimiter, otpRateLimiter, passwordResetRateLimiter } from '../middleware';

const router = Router();
const controller = new AuthController();
const securityController = new SecurityController();

// Auth endpoints
router.post('/register', registerRateLimiter, controller.register);
router.post('/login', loginRateLimiter, controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', authMiddleware, controller.me);
router.post('/init-roles', controller.initializeRoles);

// Asignación de rol y empresa (solo Administrador)
router.put('/users/:id/assign', authMiddleware, checkRole(['administrador']), controller.assignRoleAndCompany);

// Security endpoints
router.post('/send-otp', otpRateLimiter, securityController.sendOtp);
router.post('/verify-otp', otpRateLimiter, securityController.verifyOtp);
router.post('/request-password-reset', passwordResetRateLimiter, securityController.requestPasswordReset);
router.post('/reset-password', securityController.resetPassword);
router.put('/change-password', authMiddleware, securityController.changePassword);

export default router;
