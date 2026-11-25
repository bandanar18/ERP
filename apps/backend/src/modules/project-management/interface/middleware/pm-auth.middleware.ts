import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/auth.service.js';
import { JwtService } from '../../infrastructure/auth/jwt.service.js';
import { PmUnauthorizedError } from '../../errors.js';
import { PmProfile } from '../../application/dto/auth.dto.js';

export interface PmAuthRequest extends Request {
  pmUser?: PmProfile;
}

export function createPmAuthMiddleware(jwtService: JwtService, authService: AuthService) {
  return async (req: PmAuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new PmUnauthorizedError('Token no proporcionado o formato inválido');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new PmUnauthorizedError('Token no proporcionado o formato inválido');
      }

      let payload;
      try {
        payload = jwtService.verify(token);
      } catch (err) {
        throw new PmUnauthorizedError('Token inválido o expirado');
      }

      const profile = await authService.getEnrichedProfile(payload.sub);
      req.pmUser = profile;

      next();
    } catch (error) {
      next(error);
    }
  };
}
