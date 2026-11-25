import { PrismaClient } from '@prisma/client';
import { QcValidationError } from '../../errors.js';
import type { CreateIndicatorDto, UpdateIndicatorDto } from '../../application/dto/qc-admin.dto.js';
import {
  IQcAdminIndicatorRepository,
  QcAdminIndicatorDetail,
  QcAdminIndicatorList,
} from '../../domain/repositories/qc-admin-indicator.repository.js';
import { writeQcAuditLog } from './qc-audit-writer.js';

const ORG_CORP_MAIN = 'CORP_MAIN';

export class PrismaQcAdminIndicatorRepository implements IQcAdminIndicatorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<QcAdminIndicatorList[]> {
    return this.prisma.qcIndicator.findMany({
      where: { organization: { code: ORG_CORP_MAIN } },
      include: {
        process: { select: { id: true, code: true, name: true } },
        versions: {
          where: { effectiveTo: null },
          include: { targets: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<QcAdminIndicatorDetail | null> {
    return this.prisma.qcIndicator.findFirst({
      where: { id, organization: { code: ORG_CORP_MAIN } },
      include: {
        process: { select: { id: true, code: true, name: true } },
        organization: { select: { id: true, code: true, name: true } },
        versions: {
          orderBy: { effectiveFrom: 'desc' },
          include: { targets: true },
        },
      },
    });
  }

  async findByCode(code: string): Promise<{ id: string } | null> {
    return this.prisma.qcIndicator.findFirst({
      where: { code, organization: { code: ORG_CORP_MAIN } },
      select: { id: true },
    });
  }

  async findProcess(processId: string): Promise<{ id: string } | null> {
    return this.prisma.qcProcess.findFirst({
      where: { id: processId, organization: { code: ORG_CORP_MAIN } },
      select: { id: true },
    });
  }

  async findOrganization(code: string): Promise<{ id: string } | null> {
    return this.prisma.qcOrganization.findUnique({ where: { code }, select: { id: true } });
  }

  async createWithInitialVersion(
    dto: CreateIndicatorDto,
    organizationId: string,
  ): Promise<{ id: string; code: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear el indicador
      const indicator = await tx.qcIndicator.create({
        data: {
          code: dto.code,
          name: dto.name,
          organizationId,
          processId: dto.processId,
          subprocessId: dto.subprocessId ?? null,
          projectId: dto.projectId ?? null,
          chartType: dto.chartType ?? 'LINE',
        },
        select: { id: true, code: true, name: true },
      });

      // 2. Crear la versión inicial
      const version = await tx.qcIndicatorVersion.create({
        data: {
          indicatorId: indicator.id,
          frequency: dto.frequency,
          direction: dto.direction,
          formula: dto.formula ?? null,
          inputMode: dto.inputMode ?? 'DIRECT_VALUE',
          displayAsPercent: dto.displayAsPercent ?? false,
          aggregation: dto.aggregation ?? 'LAST_VALUE',
          effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        },
      });

      // 3. Crear el target (meta + thresholds)
      await tx.qcIndicatorTarget.create({
        data: {
          versionId: version.id,
          targetValue: dto.targetValue,
          unit: dto.unit,
          thresholds: dto.thresholds,
        },
      });

      // 4. Fijar la versión activa
      return tx.qcIndicator.update({
        where: { id: indicator.id },
        data: { activeVersionId: version.id },
        select: { id: true, code: true, name: true },
      });
    });
  }

  async updateWithVersioning(id: string, dto: UpdateIndicatorDto): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar campos base del indicador
      const indicator = await tx.qcIndicator.update({
        where: { id },
        data: {
          ...(dto.code !== undefined && { code: dto.code }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.processId !== undefined && { processId: dto.processId }),
          ...(dto.subprocessId !== undefined && { subprocessId: dto.subprocessId }),
          ...(dto.projectId !== undefined && { projectId: dto.projectId }),
          ...(dto.chartType !== undefined && { chartType: dto.chartType }),
        },
        select: { id: true },
      });

      // 2. Cerrar versión activa y crear la nueva heredando campos sin cambio
      const currentVersion = await tx.qcIndicatorVersion.findFirst({
        where: { indicatorId: id, effectiveTo: null },
        include: { targets: true },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (!currentVersion) {
        throw new QcValidationError('El indicador no tiene una versión activa. No se puede versionar.');
      }

      const currentTarget = currentVersion.targets[0];

      await tx.qcIndicatorVersion.update({
        where: { id: currentVersion.id },
        data: { effectiveTo: new Date() },
      });

      const nextVersion = await tx.qcIndicatorVersion.create({
        data: {
          indicatorId: id,
          frequency: dto.frequency ?? currentVersion.frequency,
          direction: dto.direction ?? currentVersion.direction,
          formula: dto.formula !== undefined ? dto.formula : currentVersion.formula,
          inputMode: dto.inputMode ?? currentVersion.inputMode,
          displayAsPercent: dto.displayAsPercent ?? currentVersion.displayAsPercent,
          aggregation: dto.aggregation ?? currentVersion.aggregation,
          effectiveFrom: new Date(),
          targets: {
            create: {
              targetValue: dto.targetValue ?? currentTarget?.targetValue ?? 0,
              unit: dto.unit ?? currentTarget?.unit ?? '%',
              thresholds: (dto.thresholds ?? currentTarget?.thresholds ?? { green: 0 }) as object,
            },
          },
        },
      });

      // 3. Actualizar activeVersionId
      return tx.qcIndicator.update({
        where: { id },
        data: { activeVersionId: nextVersion.id },
        select: { id: true },
      });
    });
  }

  async updateBaseFields(id: string, dto: UpdateIndicatorDto): Promise<{ id: string }> {
    return this.prisma.qcIndicator.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.processId !== undefined && { processId: dto.processId }),
        ...(dto.subprocessId !== undefined && { subprocessId: dto.subprocessId }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId }),
        ...(dto.chartType !== undefined && { chartType: dto.chartType }),
      },
      select: { id: true },
    });
  }

  async createAuditLog(data: import('../../domain/repositories/qc-admin-indicator.repository.js').QcAuditLogData): Promise<void> {
    await writeQcAuditLog(this.prisma, data);
  }
}
