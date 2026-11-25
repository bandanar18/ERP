import { Request, Response } from 'express';
import { OtpService, PasswordResetService } from '../services';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../../../config/database';

export class SecurityController {
  private readonly otpService: OtpService;
  private readonly passwordResetService: PasswordResetService;

  constructor() {
    this.otpService = new OtpService();
    this.passwordResetService = new PasswordResetService();
  }

  sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      const user = await prisma.erpUser.findUnique({ where: { email } });

      if (!user) {
        res.status(200).json({
          message: 'Si el email está registrado, recibirás un código de verificación',
        });
        return;
      }

      const result = await this.otpService.generateOtp(email, user.id);

      if (!result.success) {
        res.status(429).json({ error: result.error });
        return;
      }

      res.status(200).json({
        message: 'Si el email está registrado, recibirás un código de verificación',
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({ verified: false, error: 'Email y código son requeridos' });
        return;
      }

      const result = await this.otpService.verifyOtp(email, code);

      if (!result.success) {
        res.status(400).json({ verified: false, error: result.error });
        return;
      }

      res.status(200).json({ verified: true });
    } catch (error) {
      res.status(500).json({ verified: false, error: 'Error interno del servidor' });
    }
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      const result = await this.passwordResetService.requestReset(email);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({
        message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña',
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      const result = await this.passwordResetService.resetPassword(token, newPassword);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      const result = await this.passwordResetService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword,
      );

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}
