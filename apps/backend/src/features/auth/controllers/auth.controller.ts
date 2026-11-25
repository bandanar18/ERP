import { Request, Response } from 'express';
import { AuthService } from '../services';
import { AuthResponse, TokenPair, LoginResponse } from '../interfaces';
import { AuthError, AuthErrorCode } from '../interfaces/auth.errors';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  private readonly service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, roleName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          error: 'Email, password, nombre y apellido son requeridos',
          code: AuthErrorCode.INTERNAL_ERROR
        });
        return;
      }

      // roleName es opcional — si no se envía, el usuario queda pendiente de asignación
      const result: AuthResponse = await this.service.register({ email, password, firstName, lastName, roleName });

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({
          error: 'Error interno del servidor',
          code: AuthErrorCode.INTERNAL_ERROR
        });
      }
    }
  };

  initializeRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.service.initializeRoles();
      res.status(200).json({ message: 'Roles inicializados correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Email y password son requeridos',
          code: AuthErrorCode.INTERNAL_ERROR
        });
        return;
      }

      const result: LoginResponse = await this.service.login({ email, password });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({
          error: 'Error interno del servidor',
          code: AuthErrorCode.INTERNAL_ERROR
        });
      }
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ 
          error: 'Refresh token es requerido',
          code: AuthErrorCode.INVALID_TOKEN 
        });
        return;
      }

      const result: TokenPair = await this.service.refreshToken(refreshToken);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(401).json({ 
          error: 'Refresh token inválido o expirado', 
          code: AuthErrorCode.INVALID_TOKEN 
        });
      }
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: 'Logout exitoso. Elimina los tokens del lado del cliente.',
    });
  };

  me = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado', code: AuthErrorCode.INVALID_TOKEN });
        return;
      }

      const user = await this.service.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado', code: AuthErrorCode.INVALID_CREDENTIALS });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor', code: AuthErrorCode.INTERNAL_ERROR });
    }
  };

  assignRoleAndCompany = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Normalizar id (puede ser string | string[] en Express)
      const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined;

      if (!userId) {
        res.status(400).json({
          error: 'ID de usuario inválido',
          code: AuthErrorCode.INTERNAL_ERROR,
        });
        return;
      }

      const { roleName, companyId } = req.body;

      // Al menos un campo debe venir
      if (roleName === undefined && companyId === undefined) {
        res.status(400).json({
          error: 'Debes proporcionar al menos un campo para actualizar (roleName o companyId)',
          code: AuthErrorCode.INTERNAL_ERROR,
        });
        return;
      }

      // companyId puede venir como string | string[] | undefined de Express
      const normalizedCompanyId = typeof companyId === 'string' ? companyId : undefined;

      const updatedUser = await this.service.assignRoleAndCompany(userId, { roleName, companyId: normalizedCompanyId });

      res.status(200).json({
        message: 'Perfil del usuario actualizado correctamente',
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor', code: AuthErrorCode.INTERNAL_ERROR });
      }
    }
  };
}
