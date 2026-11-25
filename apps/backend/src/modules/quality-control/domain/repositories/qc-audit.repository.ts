import { Prisma } from '@prisma/client';

/** Entrada de auditoría con el actor (email + organización). */
export type QcAuditLogEntry = Prisma.QcAuditLogGetPayload<{
  include: {
    actor: { select: { email: true; organizationId: true } };
  };
}>;

export interface AuditFilters {
  page?: number;
  limit?: number;
  startsAt?: string;
  endsAt?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
}

export interface PaginatedAuditResult {
  data: QcAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IQcAuditRepository {
  findRecent(limit: number): Promise<QcAuditLogEntry[]>;
  findFiltered(filters: AuditFilters): Promise<PaginatedAuditResult>;
}
