import { Router } from 'express';
import { QcAuthController } from '../controllers/qc-auth.controller.js';
import { QcAuthMiddleware } from '../middleware/qc-auth.middleware.js';
import { qcLoginLimiter, qcUsernameCheckLimiter } from '../middleware/rate-limits.js';

export function createQcAuthRouter(qcAuthController: QcAuthController, qcAuthMiddleware: QcAuthMiddleware) {
  const router = Router();

  router.post('/register', qcLoginLimiter, qcAuthController.register);
  router.post('/check-username', qcUsernameCheckLimiter, qcAuthController.checkUsername);
  router.post('/login', qcLoginLimiter, qcAuthController.login);
  router.post('/send-otp', qcLoginLimiter, qcAuthController.sendOtp);
  router.post('/verify-otp', qcLoginLimiter, qcAuthController.verifyOtp);
  router.post('/request-password-reset', qcLoginLimiter, qcAuthController.requestPasswordReset);
  router.post('/reset-password', qcLoginLimiter, qcAuthController.resetPassword);
  router.get('/me', qcAuthMiddleware, qcAuthController.me);
  router.get('/me/redirect', qcAuthMiddleware, qcAuthController.meRedirect);
  // Cambio de contraseña de un usuario logueado del módulo
  router.put('/change-password', qcAuthMiddleware, qcAuthController.changePassword);

  return router;
}
