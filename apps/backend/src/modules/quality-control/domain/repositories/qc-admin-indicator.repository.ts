import { Prisma } from '@prisma/client';
import type { CreateIndicatorDto, UpdateIndicatorDto } from '../../application/dto/qc-admin.dto.js';

/** Indicador para listado admin (proceso + versión activa con targets). */
export type QcAdminIndicatorList = Prisma.QcIndicatorGetPayload<{
  include: {
    process: { select: { id: true; code: true; name: true } };
    versions: {
      where: { effectiveTo: null };
      include: { targets: true };
      take: 1;
    };
  };
}>;

/** Indicador con detalle completo (proceso, organización, todas las versiones con targets). */
export type QcAdminIndicatorDetail = Prisma.QcIndicatorGetPayload<{
  include: {
    process: { select: { id: true; code: true; name: true } };
    organization: { select: { id: true; code: true; name: true } };
    versions: {
      orderBy: { effectiveFrom: 'desc' };
      include: { targets: true };
    };
  };
}>;

export type QcAuditLogData = {
  actorId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export interface IQcAdminIndicatorRepository {
  findAll(): Promise<QcAdminIndicatorList[]>;
  findOne(id: string): Promise<QcAdminIndicatorDetail | null>;
  findByCode(code: string): Promise<{ id: string } | null>;
  findProcess(processId: string): Promise<{ id: string } | null>;
  findOrganization(code: string): Promise<{ id: string } | null>;
  /** Crea indicador + versión inicial + target en transacción y fija activeVersionId. */
  createWithInitialVersion(
    dto: CreateIndicatorDto,
    organizationId: string,
  ): Promise<{ id: string; code: string; name: string }>;
  /** Actualiza campos base; si hay cambios técnicos, cierra la versión activa y crea una nueva. */
  updateWithVersioning(id: string, dto: UpdateIndicatorDto): Promise<{ id: string }>;
  /** Actualiza solo campos base (sin versionar). */
  updateBaseFields(id: string, dto: UpdateIndicatorDto): Promise<{ id: string }>;
  createAuditLog(data: QcAuditLogData): Promise<void>;
}
