import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/features/auth/middleware/auth.middleware';

export const checkAdminOrGestion = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const userRoleName = req.user.roleName.toLowerCase();
  const allowedRoles = ['administrador', 'gestion', 'admin', 'management'];

  if (!allowedRoles.includes(userRoleName)) {
    res.status(403).json({ error: 'No tenés permiso para realizar esta acción' });
    return;
  }

  next();
};
