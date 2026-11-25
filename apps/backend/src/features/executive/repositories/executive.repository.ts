import { prisma } from '../../../prisma/prisma';

/**
 * MÓDULO EJECUTIVO — Repositorio (capa de datos).
 * Porta las consultas Prisma del proyecto "Resumen Ejecutivo" a los modelos
 * Executive* del ERP (mismo schema public).
 */

const CORP_MAIN = 'CORP_MAIN';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const findUserByEmail = (email: string) =>
  prisma.executiveUser.findUnique({
    where: { email },
    include: {
      organization: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      processAssignments: true,
    },
  });

export const findUserById = (id: string) =>
  prisma.executiveUser.findUnique({
    where: { id },
    include: {
      organization: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      processAssignments: true,
    },
  });

export const findOrganizationByCode = (code: string) =>
  prisma.executiveOrganization.findUnique({ where: { code } });

export const findRoleByCode = (code: string) =>
  prisma.executiveRole.findUnique({ where: { code } });

export const createUserWithRole = (data: {
  email: string;
  password: string;
  organizationId: string;
  roleId: string;
}) =>
  prisma.executiveUser.create({
    data: {
      email: data.email,
      password: data.password,
      organizationId: data.organizationId,
      roles: { create: { roleId: data.roleId } },
    },
  });

// ─── Procesos ──────────────────────────────────────────────────────────────

export const findProcesses = () =>
  prisma.executiveProcess.findMany({
    where: { organization: { code: CORP_MAIN } },
    include: {
      children: true,
      indicators: true,
    },
  });

export const findAssignmentsWithProcesses = (userId: string) =>
  prisma.executiveUserProcessAssignment.findMany({
    where: { userId },
    include: {
      process: {
        include: {
          indicators: {
            include: {
              versions: {
                where: { effectiveTo: null },
                include: {
                  targets: true,
                  measurements: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { period: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

// ─── Indicadores ───────────────────────────────────────────────────────────

export const findIndicatorDetail = (id: string) =>
  prisma.executiveIndicator.findFirst({
    where: { id, organization: { code: CORP_MAIN } },
    include: {
      process: true,
      project: true,
      organization: true,
      versions: {
        where: { effectiveTo: null },
        include: {
          targets: true,
          measurements: {
            include: {
              period: true,
              submittedBy: { select: { id: true, email: true } },
              inputs: true,
              actionPlans: {
                include: { owner: { select: { id: true, email: true } } },
              },
            },
            orderBy: { period: { startsAt: 'desc' } },
            take: 5,
          },
        },
      },
    },
  });

export const findActiveVersionsAll = () =>
  prisma.executiveIndicatorVersion.findMany({
    where: { effectiveTo: null, indicator: { organization: { code: CORP_MAIN } } },
    include: { targets: true },
  });

export const findMeasurementsForGeneralChart = (periodId?: string) =>
  prisma.executiveMeasurement.findMany({
    where: {
      ...(periodId ? { periodId } : {}),
      version: { indicator: { organization: { code: CORP_MAIN } } },
    },
    include: { period: true, inputs: true },
    orderBy: { period: { startsAt: 'asc' } },
  });

export const findReportingPeriods = (periodId?: string) =>
  prisma.executiveReportingPeriod.findMany({
    where: {
      deletedAt: null,
      ...(periodId ? { id: periodId } : {}),
    },
    orderBy: { startsAt: 'asc' },
  });

export const findActiveVersionByIndicator = (indicatorId: string) =>
  prisma.executiveIndicatorVersion.findFirst({
    where: {
      indicatorId,
      effectiveTo: null,
      indicator: { organization: { code: CORP_MAIN } },
    },
    include: { targets: true },
  });

export const findMeasurementsByVersion = (versionId: string, periodId?: string) =>
  prisma.executiveMeasurement.findMany({
    where: {
      indicatorVersionId: versionId,
      ...(periodId ? { periodId } : {}),
      version: { indicator: { organization: { code: CORP_MAIN } } },
    },
    include: { period: true, inputs: true },
    orderBy: { period: { startsAt: 'asc' } },
  });

export const findProcurementMeasurements = (
  indicatorId: string,
  startsAt?: string,
  endsAt?: string,
) =>
  prisma.executiveMeasurement.findMany({
    where: {
      version: {
        indicatorId,
        indicator: { organization: { code: CORP_MAIN } },
      },
      period: {
        ...(startsAt ? { startsAt: { gte: new Date(startsAt) } } : {}),
        ...(endsAt ? { endsAt: { lte: new Date(endsAt) } } : {}),
      },
    },
    include: { inputs: true },
  });

// ─── Mediciones ────────────────────────────────────────────────────────────

export const findPeriodById = (id: string) =>
  prisma.executiveReportingPeriod.findUnique({ where: { id } });

export const findVersionWithTargets = (id: string) =>
  prisma.executiveIndicatorVersion.findUnique({
    where: { id },
    include: { targets: true },
  });

export const createMeasurement = (data: {
  indicatorVersionId: string;
  periodId: string;
  value: number;
  trafficLight: string;
  status: string;
  submittedById: string;
  observation?: string | null;
}) =>
  prisma.executiveMeasurement.create({ data: data as any });

export const createMeasurementInputs = (
  rows: { measurementId: string; key: string; value: number }[],
) => prisma.executiveMeasurementInput.createMany({ data: rows });

export const findMeasurementsByProcessAssignments = (userId: string, status?: string) => {
  return prisma.executiveUserProcessAssignment
    .findMany({
      where: { userId },
      select: { processId: true },
    })
    .then((assignments) => {
      const processIds = assignments.map((a) => a.processId);
      if (processIds.length === 0) return [];

      const whereClause: any = {
        version: {
          indicator: {
            organization: { code: CORP_MAIN },
            processId: { in: processIds },
          },
        },
      };
      if (status) whereClause.status = status;

      return prisma.executiveMeasurement.findMany({
        where: whereClause,
        include: {
          version: { include: { indicator: { include: { process: true } } } },
          period: true,
          submittedBy: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
};

export const findMeasurementBasic = (id: string) =>
  prisma.executiveMeasurement.findUnique({
    where: { id },
    select: { id: true, status: true, periodId: true, indicatorVersionId: true },
  });

export const findPeriodStatus = (id: string) =>
  prisma.executiveReportingPeriod.findUnique({
    where: { id },
    select: { status: true },
  });

export const updateMeasurementReview = (
  id: string,
  data: {
    status: string;
    reviewedById: string;
    reviewedAt: Date;
    observation?: string;
    analysisInternal?: string;
  },
) =>
  prisma.executiveMeasurement.update({
    where: { id },
    data: data as any,
    include: {
      version: { include: { indicator: { include: { process: true } } } },
      period: true,
      submittedBy: { select: { email: true } },
      reviewedBy: { select: { email: true } },
    },
  });

export const findMeasurementsAll = (status?: string) => {
  const whereClause: any = {
    version: { indicator: { organization: { code: CORP_MAIN } } },
  };
  if (status) whereClause.status = status;

  return prisma.executiveMeasurement.findMany({
    where: whereClause,
    include: {
      version: { include: { indicator: { include: { process: true } } } },
      period: true,
      submittedBy: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const findIndicatorsWithLatest = (whereIndicator: any = {}) =>
  prisma.executiveIndicator.findMany({
    where: whereIndicator,
    include: {
      versions: {
        where: { effectiveTo: null },
        include: {
          measurements: {
            orderBy: { period: { startsAt: 'desc' } },
            take: 1,
            select: { trafficLight: true },
          },
        },
      },
    },
  });

export const findOpenPeriod = () =>
  prisma.executiveReportingPeriod.findFirst({
    where: { status: 'OPEN' },
    orderBy: { startsAt: 'desc' },
  });

export const findIndicatorsMatrix = () =>
  prisma.executiveIndicator.findMany({
    where: { organization: { code: CORP_MAIN } },
    include: {
      process: { select: { name: true, code: true } },
      versions: {
        where: { effectiveTo: null },
        include: {
          targets: true,
          measurements: {
            orderBy: { period: { startsAt: 'desc' } },
            take: 1,
            include: { period: true },
          },
        },
      },
    },
  });

export const findMeasurementsForTrend = () =>
  prisma.executiveMeasurement.findMany({
    where: {
      version: { indicator: { organization: { code: CORP_MAIN } } },
      trafficLight: { not: null },
    },
    include: {
      period: { select: { startsAt: true } },
      version: {
        include: {
          indicator: {
            include: {
              process: { select: { name: true, code: true } },
            },
          },
        },
      },
    },
    orderBy: { period: { startsAt: 'asc' } },
  });

// ─── Reports ───────────────────────────────────────────────────────────────

export const findMeasurementsForReport = (periodId?: string) =>
  prisma.executiveMeasurement.findMany({
    where: {
      ...(periodId ? { periodId } : {}),
      version: { indicator: { organization: { code: CORP_MAIN } } },
    },
    include: {
      version: {
        include: {
          indicator: { include: { process: true } },
        },
      },
    },
  });

// ─── Admin: Indicadores ────────────────────────────────────────────────────

export const findAdminIndicators = () =>
  prisma.executiveIndicator.findMany({
    where: { organization: { code: CORP_MAIN } },
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

export const findAdminIndicator = (id: string) =>
  prisma.executiveIndicator.findFirst({
    where: { id, organization: { code: CORP_MAIN } },
    include: {
      process: { select: { id: true, code: true, name: true } },
      organization: { select: { id: true, code: true, name: true } },
      versions: {
        orderBy: { effectiveFrom: 'desc' },
        include: { targets: true },
      },
    },
  });

export const findIndicatorByCode = (code: string) =>
  prisma.executiveIndicator.findFirst({
    where: { code, organization: { code: CORP_MAIN } },
  });

export const findProcessInOrg = (processId: string) =>
  prisma.executiveProcess.findFirst({
    where: { id: processId, organization: { code: CORP_MAIN } },
  });

export const createIndicatorWithVersion = (data: {
  code: string;
  name: string;
  organizationId: string;
  processId: string;
  subprocessId?: string | null;
  projectId?: string | null;
  frequency: string;
  direction: string;
  formula?: string | null;
  effectiveFrom: Date;
  targetValue: number;
  unit: string;
  thresholds: unknown;
}) =>
  prisma.$transaction(async (tx) => {
    const indicator = await tx.executiveIndicator.create({
      data: {
        code: data.code,
        name: data.name,
        organizationId: data.organizationId,
        processId: data.processId,
        subprocessId: data.subprocessId ?? null,
        projectId: data.projectId ?? null,
      },
    });

    const version = await tx.executiveIndicatorVersion.create({
      data: {
        indicatorId: indicator.id,
        frequency: data.frequency as any,
        direction: data.direction as any,
        formula: data.formula ?? null,
        effectiveFrom: data.effectiveFrom,
      },
    });

    await tx.executiveIndicatorTarget.create({
      data: {
        versionId: version.id,
        targetValue: data.targetValue,
        unit: data.unit,
        thresholds: data.thresholds as any,
      },
    });

    return tx.executiveIndicator.update({
      where: { id: indicator.id },
      data: { activeVersionId: version.id },
    });
  });

export const updateIndicatorBase = (id: string, data: any) =>
  prisma.executiveIndicator.update({ where: { id }, data });

export const findCurrentActiveVersion = (indicatorId: string) =>
  prisma.executiveIndicatorVersion.findFirst({
    where: { indicatorId, effectiveTo: null },
    include: { targets: true },
    orderBy: { effectiveFrom: 'desc' },
  });

export const closeVersion = (id: string) =>
  prisma.executiveIndicatorVersion.update({
    where: { id },
    data: { effectiveTo: new Date() },
  });

export const createNextVersion = (data: {
  indicatorId: string;
  frequency: string;
  direction: string;
  formula: string | null;
  inputMode: string;
  displayAsPercent: boolean;
  aggregation: string;
  targetValue: number;
  unit: string;
  thresholds: unknown;
}) =>
  prisma.executiveIndicatorVersion.create({
    data: {
      indicatorId: data.indicatorId,
      frequency: data.frequency as any,
      direction: data.direction as any,
      formula: data.formula,
      inputMode: data.inputMode as any,
      displayAsPercent: data.displayAsPercent,
      aggregation: data.aggregation as any,
      effectiveFrom: new Date(),
      targets: {
        create: {
          targetValue: data.targetValue,
          unit: data.unit,
          thresholds: data.thresholds as any,
        },
      },
    },
  });

export const setActiveVersion = (indicatorId: string, versionId: string) =>
  prisma.executiveIndicator.update({
    where: { id: indicatorId },
    data: { activeVersionId: versionId },
  });

// ─── Admin: Procesos ───────────────────────────────────────────────────────

export const findAdminProcesses = () =>
  prisma.executiveProcess.findMany({
    where: { organization: { code: CORP_MAIN }, deletedAt: null },
    include: {
      children: true,
      projects: true,
      indicators: { select: { id: true, code: true, name: true } },
      _count: { select: { indicators: true, children: true, projects: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

export const findAdminProcess = (id: string) =>
  prisma.executiveProcess.findFirst({
    where: { id, organization: { code: CORP_MAIN }, deletedAt: null },
    include: {
      children: true,
      projects: true,
      indicators: { select: { id: true, code: true, name: true } },
      _count: { select: { indicators: true, children: true, projects: true } },
    },
  });

export const findProcessByCode = (code: string) =>
  prisma.executiveProcess.findFirst({
    where: { code, organization: { code: CORP_MAIN } },
  });

export const findProcessById = (id: string) =>
  prisma.executiveProcess.findUnique({ where: { id } });

export const createProcess = (data: {
  organizationId: string;
  code: string;
  name: string;
  parentId?: string | null;
}) => prisma.executiveProcess.create({ data });

export const updateProcess = (id: string, data: any) =>
  prisma.executiveProcess.update({ where: { id }, data });

// ─── Auditoría ─────────────────────────────────────────────────────────────

export const createAuditLog = (data: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}) =>
  prisma.executiveAuditLog.create({
    data: {
      actorId: data.actorId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      before: (data.before ?? null) as any,
      after: (data.after ?? null) as any,
      ip: data.ip ?? null,
    },
  });

export const findAuditLogs = () =>
  prisma.executiveAuditLog.findMany({
    include: {
      actor: { select: { email: true, organizationId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

// ─── Usuarios: RBAC ────────────────────────────────────────────────────────

export const findUsersList = () =>
  prisma.executiveUser.findMany({
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      organization: { select: { name: true } },
      roles: { include: { role: true } },
      processAssignments: { include: { process: true } },
    },
  });

export const findRolesWithPermissions = () =>
  prisma.executiveRole.findMany({
    include: { permissions: { include: { permission: true } } },
  });

export const findPermissions = () => prisma.executivePermission.findMany();

export const findRolesByCodes = (codes: string[]) =>
  prisma.executiveRole.findMany({
    where: { code: { in: codes }, deletedAt: null },
    select: { id: true, code: true },
  });

export const findProcessesByIds = (ids: string[]) =>
  prisma.executiveProcess.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

export const findRoleById = (id: string) =>
  prisma.executiveRole.findUnique({ where: { id }, select: { id: true } });

export const findPermissionsByIds = (ids: string[]) =>
  prisma.executivePermission.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

export const replaceUserRoles = (userId: string, roleIds: string[]) =>
  prisma.$transaction([
    prisma.executiveUserRole.deleteMany({ where: { userId } }),
    ...(roleIds.length > 0
      ? [
          prisma.executiveUserRole.createMany({
            data: roleIds.map((roleId) => ({ userId, roleId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

export const replaceUserScopes = (userId: string, processIds: string[]) =>
  prisma.$transaction([
    prisma.executiveUserProcessAssignment.deleteMany({ where: { userId } }),
    ...(processIds.length > 0
      ? [
          prisma.executiveUserProcessAssignment.createMany({
            data: processIds.map((processId) => ({ userId, processId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

export const replaceRolePermissions = (roleId: string, permissionIds: string[]) =>
  prisma.$transaction([
    prisma.executiveRolePermission.deleteMany({ where: { roleId } }),
    ...(permissionIds.length > 0
      ? [
          prisma.executiveRolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

// ─── Exports ───────────────────────────────────────────────────────────────

export const findMatchingPeriodIds = (periodWhere: any): Promise<string[]> =>
  prisma.executiveReportingPeriod
    .findMany({ where: periodWhere, select: { id: true } })
    .then((rows) => rows.map((r) => r.id));

export const findReportMeasurements = (where: any) =>
  prisma.executiveMeasurement.findMany({
    where,
    include: {
      inputs: true,
      submittedBy: true,
      period: true,
      actionPlans: {
        include: { owner: { select: { id: true, email: true } } },
      },
      version: {
        include: {
          targets: true,
          indicator: { include: { process: true } },
        },
      },
    },
    orderBy: [
      { version: { indicator: { process: { name: 'asc' } } } },
      { period: { startsAt: 'asc' } },
    ],
  });
