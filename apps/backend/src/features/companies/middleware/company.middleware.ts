import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/features/auth/middleware/auth.middleware';

// Middleware para verificar roles de administrador o gestión
export const checkAdminOrGestion = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const roleName = user.roleName?.toLowerCase();

  if (roleName === 'administrador' || roleName === 'gestion') {
    next();
  } else {
    res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
  }
};

