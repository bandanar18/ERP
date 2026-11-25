import { PrismaClient } from '@prisma/client';
import type { CreateProcessDto, UpdateProcessDto } from '../../application/dto/qc-admin.dto.js';
import {
  IQcAdminProcessRepository,
  QcAdminProcess,
} from '../../domain/repositories/qc-admin-process.repository.js';
import type { QcAuditLogData } from '../../domain/repositories/qc-admin-indicator.repository.js';
import { writeQcAuditLog } from './qc-audit-writer.js';

const ORG_CORP_MAIN = 'CORP_MAIN';

const PROCESS_INCLUDE = {
  children: true,
  qc_projects: true,
  qc_indicators: { select: { id: true, code: true, name: true } },
  _count: { select: { qc_indicators: true, children: true, qc_projects: true } },
} as const;

export class PrismaQcAdminProcessRepository implements IQcAdminProcessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<QcAdminProcess[]> {
    return this.prisma.qcProcess.findMany({
      where: {
        organization: { code: ORG_CORP_MAIN },
        deletedAt: null,
      },
      include: PROCESS_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<QcAdminProcess | null> {
    return this.prisma.qcProcess.findFirst({
      where: { id, organization: { code: ORG_CORP_MAIN }, deletedAt: null },
      include: PROCESS_INCLUDE,
    });
  }

  async findByCode(code: string): Promise<{ id: string } | null> {
    return this.prisma.qcProcess.findFirst({
      where: { code, organization: { code: ORG_CORP_MAIN } },
      select: { id: true },
    });
  }

  async findOrganization(code: string): Promise<{ id: string } | null> {
    return this.prisma.qcOrganization.findUnique({ where: { code }, select: { id: true } });
  }

  async findParent(parentId: string): Promise<{ id: string } | null> {
    return this.prisma.qcProcess.findUnique({ where: { id: parentId }, select: { id: true } });
  }

  async create(dto: CreateProcessDto, organizationId: string): Promise<QcAdminProcess> {
    return this.prisma.qcProcess.create({
      data: {
        organizationId,
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId ?? null,
      },
      include: PROCESS_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProcessDto): Promise<QcAdminProcess> {
    return this.prisma.qcProcess.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: PROCESS_INCLUDE,
    });
  }

  async createAuditLog(data: QcAuditLogData): Promise<void> {
    await writeQcAuditLog(this.prisma, data);
  }
}
