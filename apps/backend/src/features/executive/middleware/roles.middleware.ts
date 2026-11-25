import { Response, NextFunction } from 'express';
import { ExecutiveAuthRequest } from './auth.middleware';

/**
 * MÓDULO EJECUTIVO — Middleware de roles.
 * Los roles son PROPIOS del módulo (ADMIN, DIRECTOR, PROCESS_OWNER)
 * y no tienen relación con los roles del ERP.
 */
export const checkExecutiveRoles = (allowedRoles: string[]) => {
  return (req: ExecutiveAuthRequest, res: Response, next: NextFunction): void => {
    const user = req.executiveUser;

    if (!user) {
      res.status(401).json({ error: 'No autenticado', code: 'EXECUTIVE_UNAUTHORIZED' });
      return;
    }

    if (!allowedRoles.some((role) => user.roles.includes(role))) {
      res.status(403).json({
        error: 'No tenés permiso para realizar esta acción',
        code: 'EXECUTIVE_FORBIDDEN',
      });
      return;
    }

    next();
  };
};
