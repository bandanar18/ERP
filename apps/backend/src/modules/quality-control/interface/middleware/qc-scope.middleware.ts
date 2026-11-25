import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { QcAuthRequest } from './qc-auth.middleware.js';
import { QcForbiddenError } from '../../errors.js';

/**
 * Porta el IndicatorScopeGuard del origen (NestJS) a middleware Express:
 *  - QC_ADMIN ve todo (operación total).
 *  - QC_DIRECTOR es SOLO LECTURA: no pasa el bypass y no tiene procesos
 *    asignados, por lo que cualquier intento de escribir recibe 403.
 *  - QC_OWNER solo puede operar sobre indicadores de procesos asignados.
 *  - Resuelve indicatorId desde body/params o desde indicatorVersionId.
 */
export function createQcScopeMiddleware(db: PrismaClient) {
  return async (req: QcAuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.qcUser;
      if (!user) {
        throw new QcForbiddenError('Usuario no autenticado');
      }

      if (user.roles.includes('QC_ADMIN')) {
        return next();
      }

      // QC_DIRECTOR: rol de solo lectura — sin bypass y sin asignaciones de
      // proceso, así que escribir aquí termina en 403.
      if (!user.roles.includes('QC_OWNER')) {
        throw new QcForbiddenError('Sin permisos para operar sobre indicadores');
      }

      let indicatorId = req.body?.indicatorId || req.params?.indicatorId;
      const indicatorVersionId = req.body?.indicatorVersionId;

      if (!indicatorId && indicatorVersionId) {
        const version = await db.qcIndicatorVersion.findUnique({
          where: { id: indicatorVersionId },
          select: { indicatorId: true },
        });
        if (version) {
          indicatorId = version.indicatorId;
        }
      }

      if (!indicatorId) {
        throw new QcForbiddenError('Indicator ID or Version ID is required for scope validation.');
      }

      const indicator = await db.qcIndicator.findUnique({
        where: { id: indicatorId },
        select: { processId: true },
      });

      if (!indicator) {
        throw new QcForbiddenError('Indicator not found.');
      }

      const hasAssignment = await db.qcUserProcessAssignment.findFirst({
        where: {
          userId: user.id,
          processId: indicator.processId,
        },
      });

      if (!hasAssignment) {
        throw new QcForbiddenError('No tienes acceso a este proceso/indicador');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
