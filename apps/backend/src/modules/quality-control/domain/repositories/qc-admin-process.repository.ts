import { Prisma } from '@prisma/client';
import type { CreateProcessDto, UpdateProcessDto } from '../../application/dto/qc-admin.dto.js';
import type { QcAuditLogData } from './qc-admin-indicator.repository.js';

/** Proceso para listado/detalle admin (hijos, proyectos, indicadores y _count). */
export type QcAdminProcess = Prisma.QcProcessGetPayload<{
  include: {
    children: true;
    qc_projects: true;
    qc_indicators: { select: { id: true; code: true; name: true } };
    _count: { select: { qc_indicators: true; children: true; qc_projects: true } };
  };
}>;

export interface IQcAdminProcessRepository {
  findAll(): Promise<QcAdminProcess[]>;
  findOne(id: string): Promise<QcAdminProcess | null>;
  findByCode(code: string): Promise<{ id: string } | null>;
  findOrganization(code: string): Promise<{ id: string } | null>;
  findParent(parentId: string): Promise<{ id: string } | null>;
  create(dto: CreateProcessDto, organizationId: string): Promise<QcAdminProcess>;
  update(id: string, dto: UpdateProcessDto): Promise<QcAdminProcess>;
  createAuditLog(data: QcAuditLogData): Promise<void>;
}
