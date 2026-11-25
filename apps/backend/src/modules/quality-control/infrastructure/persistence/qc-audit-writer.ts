import { PrismaClient } from '@prisma/client';
import type { QcAuditLogData } from '../../domain/repositories/qc-admin-indicator.repository.js';

/**
 * Escribe una entrada de auditoría (qc_audit_logs). Usado por los repos de admin
 * (procesos e indicadores) tras crear o actualizar una entidad.
 */
export async function writeQcAuditLog(
  db: PrismaClient,
  data: QcAuditLogData,
): Promise<void> {
  await db.qcAuditLog.create({
    data: {
      actorId: data.actorId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      before: data.before as object | undefined,
      after: data.after as object | undefined,
    },
  });
}
