import { Response, NextFunction } from 'express';
import { PmAuthRequest } from './pm-auth.middleware.js';
import { PmForbiddenError } from '../../errors.js';

export function pmCheckRoles(allowedRoles: string[]) {
  return (req: PmAuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.pmUser;
      if (!user) {
        throw new PmForbiddenError('Usuario no autenticado');
      }

      const hasRole = user.roles.some((role) => allowedRoles.includes(role));

      if (!hasRole) {
        throw new PmForbiddenError('No tienes los roles necesarios para esta acción');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
