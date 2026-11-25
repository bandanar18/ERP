import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services';
import { TokenPayload } from '../interfaces';
import { prisma } from '@/prisma/prisma';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Mapeo de roles del módulo Project Management a los roles legacy del ERP.
 * Permite que un token del módulo (firmado con PM_JWT_SECRET) sea aceptado
 * por los endpoints legacy de datos que el frontend del módulo consume
 * (/api/projects, /api/companies, etc.).
 */
const PM_ROLE_TO_LEGACY: Record<string, string> = {
  // PM_ADMIN y PM_GESTION mapean a 'gestion': en el ERP legacy 'administrador'
  // y 'gestion' tienen el mismo scoping (acceso total a proyectos/empresas),
  // pero solo 'gestion' está en los writeRoles (crear/editar). Mapear PM_ADMIN
  // a 'gestion' le da al superusuario del módulo paridad completa de escritura.
  PM_ADMIN: 'gestion',
  PM_GESTION: 'gestion',
  PM_PLANIFICADOR: 'planificador',
  PM_DIRECCION: 'direccion',
  PM_ADMIN_FINANCIERO: 'admin_financiero',
};

/**
 * Intenta verificar un token del módulo Project Management (PM_JWT_SECRET)
 * y lo resuelve a un TokenPayload legacy. Devuelve null si el token no es
 * del módulo o el usuario no está activo.
 */
async function verifyPmToken(token: string): Promise<TokenPayload | null> {
  const pmSecret = process.env.PM_JWT_SECRET;
  if (!pmSecret) return null;

  try {
    const pmPayload = jwt.verify(token, pmSecret) as { sub: string; email: string };

    const pmUser = await prisma.pmModuleUser.findUnique({
      where: { id: pmPayload.sub },
      include: { scopes: true },
    });
    if (!pmUser || pmUser.status !== 'ACTIVE') return null;

    const pmUserRole = await prisma.pmUserRole.findFirst({
      where: { userId: pmUser.id },
      include: { pm_roles: true },
    });
    const pmRoleCode = pmUserRole?.pm_roles?.code ?? '';
    let roleName = PM_ROLE_TO_LEGACY[pmRoleCode] ?? '';

    let userId = pmUser.id;
    let companyId: string | undefined;
    let isClient = false;

    // Si el usuario del módulo está enlazado a un usuario ERP (externalId),
    // hereda su id, empresa y estado cliente para el scoping legacy.
    if (pmUser.externalId) {
      const erpUser = await prisma.erpUser.findUnique({
        where: { id: pmUser.externalId },
        include: { role: true, company: true },
      });
      if (erpUser) {
        userId = erpUser.id;
        // El rol del módulo PM manda (ya mapeado a legacy arriba). El rol del
        // ERP solo se usa como fallback cuando el usuario del módulo no tiene
        // rol PM. Sin esto, un PM_ADMIN enlazado a un ERP 'administrador'
        // perdería el acceso de gestión (checkRole(['gestion']) no incluye
        // 'administrador') y recibiría 403 en user-management.
        if (!roleName && erpUser.role) roleName = erpUser.role.name;
        companyId = erpUser.companyId ?? undefined;
        isClient = !!erpUser.companyId;
      }
    }

    // Fallback: si no tiene externalId (no enlazado al ERP), leer companyId
    // de los scopes del módulo PM. El admin puede asignar empresa desde el
    // panel de gestión sin necesidad de enlazar al ERP.
    if (!companyId && pmUser.scopes && pmUser.scopes.length > 0) {
      companyId = pmUser.scopes[0]?.companyId ?? undefined;
    }

    // pmUserId es SIEMPRE el id del usuario del módulo: las FKs pm_* (p.ej.
    // pm_projects.managerId) referencian pm_users.id. El frontend del módulo
    // consume endpoints legacy, así que los filtros por planificador deben
    // poder resolver al id real de pm_users.
    const projectIds = (pmUser.scopes ?? []).map((s) => s.projectId).filter((x): x is string => !!x);
    return { userId, email: pmUser.email, roleName, isClient, companyId, pmUserId: pmUser.id, projectIds, pmRoleCode };
  } catch {
    return null;
  }
}

export const checkAssignedProject = (param = 'projectId') =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.roleName === 'admin_financiero') {
      const pIds = req.user.projectIds ?? [];
      if (pIds.length > 0 && !pIds.includes(String(req.params[param]))) {
        res.status(403).json({ error: 'No tienes asignado este proyecto' });
        return;
      }
    }
    next();
  };

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.substring(7);

    // 1) Intentar token legacy (JWT_SECRET)
    let payload: TokenPayload | null = null;
    let legacyError: unknown = null;
    try {
      const authService = new AuthService();
      payload = await authService.verifyAccessToken(token);
    } catch (error) {
      legacyError = error;
    }

    if (payload) {
      // Verificar si el usuario sigue activo en la base de datos
      const authRepository = new (await import('../repositories/auth.repository')).AuthRepository();
      const isUserActive = await authRepository.isUserActive(payload.userId);

      if (!isUserActive) {
        res.status(401).json({ error: 'Usuario desactivado', code: 'USER_DISABLED' });
        return;
      }

      req.user = payload;
      next();
      return;
    }

    // 2) Fallback: token del módulo Project Management (PM_JWT_SECRET)
    const pmPayload = await verifyPmToken(token);
    if (pmPayload) {
      req.user = pmPayload;
      next();
      return;
    }

    // 3) Ninguno fue válido → propagar el error del token legacy (o genérico)
    if (legacyError instanceof Error) throw legacyError;
    throw new Error('Token inválido');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expirado') {
        res.status(401).json({ error: 'Token expirado' });
        return;
      }
      if (error.message === 'Token inválido') {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }
    }
    res.status(401).json({ error: 'No autenticado' });
  }
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const userRoleName = req.user.roleName.toLowerCase();

    if (!allowedRoles.map(r => r.toLowerCase()).includes(userRoleName)) {
      res.status(403).json({ error: 'No tenés permiso para realizar esta acción' });
      return;
    }

    next();
  };
};
