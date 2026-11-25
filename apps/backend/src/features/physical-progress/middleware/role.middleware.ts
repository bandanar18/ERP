import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../auth/middleware/auth.middleware';

/**
 * Verifica que el usuario tenga rol válido: planificador, gestión o administrador
 */
export function requireProgressRole(req: AuthRequest, res: Response, next: NextFunction) {
  const userRole = req.user?.roleName?.toLowerCase().trim();
  const validRoles = ['planificador', 'gestion', 'gestión', 'administrador', 'direccion'];

  if (!userRole || !validRoles.includes(userRole)) {
    res.status(403).json({
      error: 'No tenés permiso para acceder a este recurso',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  next();
}
