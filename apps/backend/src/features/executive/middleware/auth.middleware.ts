import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService, EXECUTIVE_JWT_SECRET } from '../services/auth.service';
import type { ExecutiveProfile, ExecutiveTokenPayload } from '../interfaces/executive.types';

/**
 * MÓDULO EJECUTIVO — Middleware de autenticación.
 *
 * JWT PROPIO del módulo (EXECUTIVE_JWT_SECRET), independiente del JWT del ERP.
 * Cada request reconstruye el perfil enriquecido (roles, permisos, scopes)
 * desde la BD, igual que el authMiddleware del ERP.
 */

export interface ExecutiveAuthRequest extends Request {
  executiveUser?: ExecutiveProfile;
}

const authService = new AuthService();

export const executiveAuthMiddleware = async (
  req: ExecutiveAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado', code: 'EXECUTIVE_UNAUTHORIZED' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, EXECUTIVE_JWT_SECRET) as ExecutiveTokenPayload;

    if (!payload?.sub) {
      res.status(401).json({ error: 'Token inválido', code: 'EXECUTIVE_UNAUTHORIZED' });
      return;
    }

    const profile = await authService.getEnrichedProfile(payload.sub);

    if (profile.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Usuario desactivado', code: 'EXECUTIVE_USER_DISABLED' });
      return;
    }

    req.executiveUser = profile;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado', code: 'EXECUTIVE_UNAUTHORIZED' });
  }
};
