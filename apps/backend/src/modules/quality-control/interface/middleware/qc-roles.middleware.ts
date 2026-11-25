import { Response, NextFunction } from 'express';
import { QcAuthRequest } from './qc-auth.middleware.js';
import { QcForbiddenError } from '../../errors.js';

export function qcCheckRoles(allowedRoles: string[]) {
  return (req: QcAuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.qcUser;
      if (!user) {
        throw new QcForbiddenError('Usuario no autenticado');
      }

      const hasRole = user.roles.some((role) => allowedRoles.includes(role));

      if (!hasRole) {
        throw new QcForbiddenError('No tienes los roles necesarios para esta acción');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
