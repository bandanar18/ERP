import * as repo from '../repositories/executive.repository';
import { ExecutiveError } from '../interfaces/executive.errors';

/**
 * MÓDULO EJECUTIVO — Administración (indicadores, procesos, usuarios RBAC,
 * auditoría). Portado fiel de los servicios admin/users/audit-log de la fuente.
 */

// ─── Indicadores ───────────────────────────────────────────────────────────

export class AdminIndicatorsService {
  async findAll() {
    return repo.findAdminIndicators();
  }

  async findOne(id: string) {
    const indicator = await repo.findAdminIndicator(id);
    if (!indicator) throw ExecutiveError.notFound('Indicador no encontrado');
    return indicator;
  }

  async create(dto: any, actorId: string) {
    const existing = await repo.findIndicatorByCode(dto.code);
    if (existing) {
      throw ExecutiveError.conflict(`Ya existe un indicador con el código "${dto.code}"`);
    }

    const process = await repo.findProcessInOrg(dto.processId);
    if (!process) throw ExecutiveError.badRequest('El proceso especificado no existe');

    const org = await repo.findOrganizationByCode('CORP_MAIN');
    if (!org) throw ExecutiveError.notFound('Organización CORP_MAIN no encontrada');

    const result = await repo.createIndicatorWithVersion({
      code: dto.code,
      name: dto.name,
      organizationId: org.id,
      processId: dto.processId,
      subprocessId: dto.subprocessId ?? null,
      projectId: dto.projectId ?? null,
      frequency: dto.frequency,
      direction: dto.direction,
      formula: dto.formula ?? null,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      targetValue: dto.targetValue,
      unit: dto.unit,
      thresholds: dto.thresholds,
    });

    await repo.createAuditLog({
      actorId,
      action: 'CREATE',
      entityType: 'Indicator',
      entityId: result.id,
      after: result,
    });

    return result;
  }

  async update(id: string, dto: any, actorId: string) {
    const existing = await repo.findAdminIndicator(id);
    if (!existing) throw ExecutiveError.notFound('Indicador no encontrado');

    const before = { ...existing };

    const technicalChange =
      dto.frequency !== undefined ||
      dto.direction !== undefined ||
      dto.formula !== undefined ||
      dto.inputMode !== undefined ||
      dto.displayAsPercent !== undefined ||
      dto.aggregation !== undefined ||
      dto.targetValue !== undefined ||
      dto.unit !== undefined ||
      dto.thresholds !== undefined;

    // 1. Actualizar campos base
    const indicator = await repo.updateIndicatorBase(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.processId !== undefined && { processId: dto.processId }),
      ...(dto.subprocessId !== undefined && { subprocessId: dto.subprocessId }),
      ...(dto.projectId !== undefined && { projectId: dto.projectId }),
      ...(dto.chartType !== undefined && { chartType: dto.chartType }),
    });

    let result = indicator;

    if (technicalChange) {
      const currentVersion = await repo.findCurrentActiveVersion(id);
      if (!currentVersion) {
        throw ExecutiveError.badRequest('El indicador no tiene una versión activa. No se puede versionar.');
      }

      const currentTarget = currentVersion.targets[0];

      await repo.closeVersion(currentVersion.id);

      const nextVersion = await repo.createNextVersion({
        indicatorId: id,
        frequency: dto.frequency ?? currentVersion.frequency,
        direction: dto.direction ?? currentVersion.direction,
        formula: dto.formula !== undefined ? dto.formula : currentVersion.formula,
        inputMode: dto.inputMode ?? currentVersion.inputMode,
        displayAsPercent: dto.displayAsPercent ?? currentVersion.displayAsPercent,
        aggregation: dto.aggregation ?? currentVersion.aggregation,
        targetValue: dto.targetValue ?? currentTarget?.targetValue ?? 0,
        unit: dto.unit ?? currentTarget?.unit ?? '%',
        thresholds: dto.thresholds ?? currentTarget?.thresholds ?? { green: 0 },
      });

      result = await repo.setActiveVersion(id, nextVersion.id);
    }

    await repo.createAuditLog({
      actorId,
      action: 'UPDATE',
      entityType: 'Indicator',
      entityId: id,
      before,
      after: result,
    });

    return result;
  }
}

// ─── Procesos ──────────────────────────────────────────────────────────────

export class AdminProcessesService {
  async findAll() {
    return repo.findAdminProcesses();
  }

  async findOne(id: string) {
    const process = await repo.findAdminProcess(id);
    if (!process) throw ExecutiveError.notFound('Proceso no encontrado');
    return process;
  }

  async create(dto: any, actorId: string) {
    const existing = await repo.findProcessByCode(dto.code);
    if (existing) {
      throw ExecutiveError.conflict(`Ya existe un proceso con el código "${dto.code}"`);
    }

    const org = await repo.findOrganizationByCode('CORP_MAIN');
    if (!org) throw ExecutiveError.notFound('Organización CORP_MAIN no encontrada');

    if (dto.parentId) {
      const parent = await repo.findProcessById(dto.parentId);
      if (!parent) throw ExecutiveError.notFound('Proceso padre no encontrado');
    }

    const process = await repo.createProcess({
      organizationId: org.id,
      code: dto.code,
      name: dto.name,
      parentId: dto.parentId ?? null,
    });

    await repo.createAuditLog({
      actorId,
      action: 'CREATE',
      entityType: 'Process',
      entityId: process.id,
      after: process,
    });

    return process;
  }

  async update(id: string, dto: any, actorId: string) {
    const existing = await repo.findAdminProcess(id);
    if (!existing) throw ExecutiveError.notFound('Proceso no encontrado');

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await prismaFindProcessByCodeExcept(dto.code, id);
      if (duplicate) {
        throw ExecutiveError.conflict(`Ya existe otro proceso con el código "${dto.code}"`);
      }
    }

    if (dto.parentId === id) {
      throw ExecutiveError.conflict('Un proceso no puede ser padre de sí mismo');
    }

    const before = { ...existing };

    const updated = await repo.updateProcess(id, {
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
    });

    await repo.createAuditLog({
      actorId,
      action: 'UPDATE',
      entityType: 'Process',
      entityId: id,
      before,
      after: updated,
    });

    return updated;
  }
}

/** Busca un proceso por código excluyendo un id (para validar unicidad al editar). */
async function prismaFindProcessByCodeExcept(code: string, id: string) {
  const { prisma } = await import('../../../prisma/prisma');
  return prisma.executiveProcess.findFirst({
    where: { code, organization: { code: 'CORP_MAIN' }, id: { not: id } },
  });
}

// ─── Usuarios (RBAC del módulo) ────────────────────────────────────────────

export class UsersService {
  async findAll() {
    return repo.findUsersList();
  }

  async getRoles() {
    return repo.findRolesWithPermissions();
  }

  async getPermissions() {
    return repo.findPermissions();
  }

  async updateUserRoles(userId: string, roleCodes: string[]) {
    if (!Array.isArray(roleCodes) || roleCodes.length === 0) {
      throw ExecutiveError.badRequest('Debe proporcionar al menos un código de rol.');
    }

    const roles = await repo.findRolesByCodes(roleCodes);

    if (roles.length !== new Set(roleCodes).size) {
      const found = new Set(roles.map((r) => r.code));
      const missing = roleCodes.filter((c) => !found.has(c));
      throw ExecutiveError.badRequest(`Los siguientes roles no existen: ${missing.join(', ')}`);
    }

    await repo.replaceUserRoles(userId, roles.map((r) => r.id));

    return { success: true };
  }

  async updateUserScopes(userId: string, processIds: string[]) {
    if (!Array.isArray(processIds)) {
      throw ExecutiveError.badRequest('processIds debe ser un arreglo.');
    }

    if (processIds.length > 0) {
      const processes = await repo.findProcessesByIds(processIds);
      if (processes.length !== processIds.length) {
        const found = new Set(processes.map((p) => p.id));
        const missing = processIds.filter((id) => !found.has(id));
        throw ExecutiveError.badRequest(`Los siguientes procesos no existen: ${missing.join(', ')}`);
      }
    }

    await repo.replaceUserScopes(userId, processIds);

    return { success: true };
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    if (!Array.isArray(permissionIds)) {
      throw ExecutiveError.badRequest('permissionIds debe ser un arreglo.');
    }

    const role = await repo.findRoleById(roleId);
    if (!role) {
      throw ExecutiveError.badRequest(`El rol con ID "${roleId}" no existe.`);
    }

    if (permissionIds.length > 0) {
      const permissions = await repo.findPermissionsByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        const found = new Set(permissions.map((p) => p.id));
        const missing = permissionIds.filter((id) => !found.has(id));
        throw ExecutiveError.badRequest(`Los siguientes permisos no existen: ${missing.join(', ')}`);
      }
    }

    await repo.replaceRolePermissions(roleId, permissionIds);

    return { success: true };
  }
}

// ─── Auditoría ─────────────────────────────────────────────────────────────

export class AuditLogService {
  async findAll() {
    return repo.findAuditLogs();
  }
}
