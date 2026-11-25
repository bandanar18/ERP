import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ExecutiveAuthRequest } from '../middleware/auth.middleware';
import { loginSchema, registerSchema } from '../interfaces/executive.schemas';
import { validate, sendError } from '../interfaces/executive.errors';

/**
 * MÓDULO EJECUTIVO — Auth.
 * Login/register con rate limit en las rutas; /auth/me devuelve el perfil
 * enriquecido (roles, permisos, scopes) reconstruido desde la BD.
 */
export class AuthController {
  private readonly service = new AuthService();

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(loginSchema, req.body);
      const result = await this.service.login(body.email, body.password);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al iniciar sesión');
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(registerSchema, req.body);
      const result = await this.service.register(body);
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error, 'Error al registrar el usuario');
    }
  };

  me = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(req.executiveUser);
    } catch (error) {
      sendError(res, error, 'Error al obtener el perfil');
    }
  };

  /**
   * @deprecated Duplicado de GET /auth/me — mantener una sola fuente de perfil.
   * Se conserva por compatibilidad; los clientes nuevos deben usar /auth/me.
   */
  meContext = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(req.executiveUser);
    } catch (error) {
      sendError(res, error, 'Error al obtener el perfil');
    }
  };

  meRedirect = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const roles = req.executiveUser?.roles ?? [];
      const path = this.service.computeRedirectUrl(roles);
      res.status(200).json({ path });
    } catch (error) {
      sendError(res, error, 'Error al calcular la redirección');
    }
  };
}
