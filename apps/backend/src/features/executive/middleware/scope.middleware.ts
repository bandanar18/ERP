import { Response, NextFunction } from 'express';
import { prisma } from '../../../prisma/prisma';
import { ExecutiveAuthRequest } from './auth.middleware';
import { ExecutiveError } from '../interfaces/executive.errors';

/**
 * MÓDULO EJECUTIVO — Middleware de scope por indicador.
 *
 * Portado del IndicatorScopeGuard de la fuente:
 *  - Valida que el usuario pertenezca a la organización CORP_MAIN.
 *  - Para PROCESS_OWNER: el indicador debe pertenecer a un proceso asignado
 *    al usuario. El ID del indicador se resuelve desde params.id o desde
 *    body.indicatorVersionId (ruta de creación de mediciones).
 */
export const indicatorScopeMiddleware = async (
  req: ExecutiveAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.executiveUser;

    if (!user) {
      res.status(401).json({ error: 'No autenticado', code: 'EXECUTIVE_UNAUTHORIZED' });
      return;
    }

    // Verificar que la organización sea CORP_MAIN (Nexoil excluida por diseño)
    const org = await prisma.executiveOrganization.findUnique({
      where: { id: user.organizationId },
      select: { code: true },
    });
    if (!org || org.code !== 'CORP_MAIN') {
      throw ExecutiveError.forbidden('Acceso denegado. Solo usuarios corporativos permitidos.');
    }

    // Lógica específica para dueños de proceso
    if (user.roles.includes('PROCESS_OWNER')) {
      let indicatorId =
        (req.body?.indicatorId as string | undefined) ||
        (req.params?.indicatorId as string | undefined) ||
        (req.params?.id as string | undefined);
      const indicatorVersionId = req.body?.indicatorVersionId as string | undefined;

      if (!indicatorId && indicatorVersionId) {
        const version = await prisma.executiveIndicatorVersion.findUnique({
          where: { id: indicatorVersionId },
          select: { indicatorId: true },
        });
        if (version) indicatorId = version.indicatorId;
      }

      if (!indicatorId) {
        throw ExecutiveError.forbidden('Indicator ID or Version ID is required for scope validation.');
      }

      const indicator = await prisma.executiveIndicator.findUnique({
        where: { id: indicatorId },
        select: { processId: true },
      });

      if (!indicator) {
        throw ExecutiveError.forbidden('Indicator not found.');
      }

      const hasAssignment = await prisma.executiveUserProcessAssignment.findFirst({
        where: {
          userId: user.id,
          processId: indicator.processId,
        },
      });

      if (!hasAssignment && !user.roles.includes('ADMIN')) {
        throw ExecutiveError.forbidden('You do not have access to this process indicator.');
      }
    }

    next();
  } catch (error) {
    if (error instanceof ExecutiveError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code });
      return;
    }
    res.status(403).json({ error: 'Acceso denegado', code: 'EXECUTIVE_FORBIDDEN' });
  }
};
