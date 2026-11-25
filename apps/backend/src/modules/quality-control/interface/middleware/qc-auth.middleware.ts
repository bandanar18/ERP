import { Request, Response, NextFunction } from 'express';
import { QcAuthService } from '../../application/services/qc-auth.service.js';
import { QcJwtService } from '../../infrastructure/auth/qc-jwt.service.js';
import { QcUnauthorizedError } from '../../errors.js';
import { QcProfile } from '../../application/dto/qc-auth.dto.js';

export interface QcAuthRequest extends Request {
  qcUser?: QcProfile;
}

export type QcAuthMiddleware = ReturnType<typeof createQcAuthMiddleware>;

export function createQcAuthMiddleware(jwtService: QcJwtService, authService: QcAuthService) {
  return async (req: QcAuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new QcUnauthorizedError('Token no proporcionado o formato inválido');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new QcUnauthorizedError('Token no proporcionado o formato inválido');
      }

      let payload;
      try {
        payload = jwtService.verify(token);
      } catch {
        throw new QcUnauthorizedError('Token inválido o expirado');
      }

      const profile = await authService.getEnrichedProfile(payload.sub);
      req.qcUser = profile;

      next();
    } catch (error) {
      next(error);
    }
  };
}
