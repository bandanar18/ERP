import { Response, NextFunction } from 'express';
import { PmAuthRequest } from './pm-auth.middleware.js';
import { PmForbiddenError } from '../../errors.js';

interface ScopeOptions {
  companyParam?: string;
  projectParam?: string;
}

export function pmScopeMiddleware(options: ScopeOptions) {
  return (req: PmAuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.pmUser;
      if (!user) {
        throw new PmForbiddenError('Usuario no autenticado');
      }

      if (user.roles.includes('PM_ADMIN') || user.roles.includes('PM_GESTION')) {
        return next();
      }

      if (options.companyParam) {
        const companyId = req.params[options.companyParam] || req.body[options.companyParam] || (req.query[options.companyParam] as string);
        if (companyId && !user.scopes.companyIds.includes(companyId)) {
          throw new PmForbiddenError('Fuera de scope: no tienes acceso a esta empresa');
        }
      }

      if (options.projectParam) {
        const projectId = req.params[options.projectParam] || req.body[options.projectParam] || (req.query[options.projectParam] as string);
        if (projectId && !user.scopes.projectIds.includes(projectId)) {
          throw new PmForbiddenError('Fuera de scope: no tienes acceso a este proyecto');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
