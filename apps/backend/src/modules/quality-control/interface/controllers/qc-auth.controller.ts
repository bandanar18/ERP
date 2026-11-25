import { Request, Response, NextFunction } from 'express';
import { QcAuthService } from '../../application/services/qc-auth.service.js';
import {
  loginSchema,
  registerSchema,
  otpSchema,
  usernameAvailableSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
} from '../../application/dto/qc-auth.dto.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcAuthController {
  constructor(private readonly authService: QcAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = loginSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Datos de login inválidos' });
        return;
      }

      const result = await this.authService.login(parsedBody.data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  checkUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = usernameAvailableSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ available: false, error: 'Nombre de usuario inválido' });
        return;
      }

      const taken = await this.authService.isUsernameTaken(parsedBody.data.username);
      res.json({ available: !taken });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // req.qcUser ya está poblado por el middleware qcAuthMiddleware
    if (!req.qcUser) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    res.json(req.qcUser);
  };

  meRedirect = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }
      const redirectUrl = this.authService.computeRedirectUrl(req.qcUser.roles);
      res.json({ redirectUrl });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = registerSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Datos de registro inválidos' });
        return;
      }

      const result = await this.authService.register(parsedBody.data);
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(201).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  };

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = otpSchema.safeParse(req.body);
      if (!parsedBody.success || !parsedBody.data.email) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      const result = await this.authService.sendOtp(parsedBody.data.email);
      if (!result.success) {
        res.status(429).json({ error: result.error });
        return;
      }
      res.status(200).json({ message: 'Si el email está registrado, recibirás un código de verificación' });
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = otpSchema.safeParse(req.body);
      if (!parsedBody.success || !parsedBody.data.email || !parsedBody.data.code) {
        res.status(400).json({ verified: false, error: 'Email y código son requeridos' });
        return;
      }

      const result = await this.authService.verifyOtp(parsedBody.data.email, parsedBody.data.code);
      if (!result.success) {
        res.status(400).json({ verified: false, error: result.error });
        return;
      }
      res.status(200).json({ verified: true });
    } catch (error) {
      next(error);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = passwordResetRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      const result = await this.authService.requestPasswordReset(parsedBody.data.email);
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(200).json({ message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña' });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = passwordResetSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
        return;
      }

      const result = await this.authService.resetPassword(parsedBody.data.token, parsedBody.data.newPassword);
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(200).json({ message: 'Contraseña restablecida correctamente' });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = changePasswordSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        return;
      }

      if (!req.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const result = await this.authService.changePassword(
        req.qcUser.id,
        parsedBody.data.currentPassword,
        parsedBody.data.newPassword
      );
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
      next(error);
    }
  };
}
