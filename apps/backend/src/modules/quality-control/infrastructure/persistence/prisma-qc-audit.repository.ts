import { PrismaClient } from '@prisma/client';
import { IQcAuditRepository, QcAuditLogEntry, AuditFilters, PaginatedAuditResult } from '../../domain/repositories/qc-audit.repository.js';

export class PrismaQcAuditRepository implements IQcAuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findRecent(limit: number): Promise<QcAuditLogEntry[]> {
    return this.prisma.qcAuditLog.findMany({
      include: {
        actor: { select: { email: true, organizationId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findFiltered(filters: AuditFilters): Promise<PaginatedAuditResult> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.startsAt || filters.endsAt) {
      where.createdAt = {};
      if (filters.startsAt) where.createdAt.gte = new Date(filters.startsAt);
      if (filters.endsAt) where.createdAt.lte = new Date(`${filters.endsAt}T23:59:59.999Z`);
    }
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entityType) where.entityType = { equals: filters.entityType, mode: 'insensitive' };
    if (filters.actorId) where.actorId = filters.actorId;

    const [data, total] = await Promise.all([
      this.prisma.qcAuditLog.findMany({
        where,
        include: {
          actor: { select: { email: true, organizationId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.qcAuditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
