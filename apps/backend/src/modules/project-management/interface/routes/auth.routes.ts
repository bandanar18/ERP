import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';
import { loginLimiter, usernameCheckLimiter } from '../middleware/rate-limits.js';

export function createAuthRouter(authController: AuthController, pmAuthMiddleware: any) {
  const router = Router();

  router.post('/register', loginLimiter, authController.register);
  router.post('/check-username', usernameCheckLimiter, authController.checkUsername);
  router.post('/login', loginLimiter, authController.login);
  router.post('/send-otp', loginLimiter, authController.sendOtp);
  router.post('/verify-otp', loginLimiter, authController.verifyOtp);
  router.post('/request-password-reset', loginLimiter, authController.requestPasswordReset);
  router.post('/reset-password', loginLimiter, authController.resetPassword);
  router.get('/me', pmAuthMiddleware, authController.me);
  router.get('/me/redirect', pmAuthMiddleware, authController.meRedirect);
  // Edición de datos personales del usuario logueado (nombre/apellido/username)
  router.put('/profile', pmAuthMiddleware, authController.updateProfile);
  // Cambio de contraseña de un usuario logueado del módulo
  router.put('/change-password', pmAuthMiddleware, authController.changePassword);

  // Endpoint administrativo para enlazar cuentas
  router.post('/link', pmAuthMiddleware, pmCheckRoles(['PM_ADMIN']), authController.linkExternal);

  return router;
}
