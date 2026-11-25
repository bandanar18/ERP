import { z } from 'zod';

// ─── Admin: Processes ───────────────────────────────────────────────────

export const createProcessSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1).max(200).transform((v) => v.trim()),
  parentId: z.string().uuid().nullable().optional(),
});

export type CreateProcessDto = z.infer<typeof createProcessSchema>;

export const updateProcessSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()).optional(),
  name: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export type UpdateProcessDto = z.infer<typeof updateProcessSchema>;

// ─── Admin: Indicators ──────────────────────────────────────────────────

export const thresholdsSchema = z.object({
  green: z.number().finite(),
  yellow: z.number().finite().optional(),
  orange: z.number().finite().optional(),
  red: z.number().finite().optional(),
});

export const createIndicatorSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1).max(200).transform((v) => v.trim()),
  processId: z.string().uuid(),
  subprocessId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  chartType: z.enum(['LINE', 'PIE']).optional(),
  // Version data
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'PROJECT_BASED']),
  direction: z.enum(['AT_LEAST', 'AT_MOST', 'RANGE']),
  formula: z.string().max(2000).nullable().optional(),
  inputMode: z.enum(['DIRECT_VALUE', 'FORMULA_INPUTS']).optional(),
  displayAsPercent: z.boolean().optional(),
  aggregation: z.enum(['LAST_VALUE', 'SUM', 'AVERAGE', 'WEIGHTED_AVERAGE', 'CUMULATIVE_RATIO']).optional(),
  // Target data
  targetValue: z.number().finite(),
  unit: z.string().min(1).max(50).transform((v) => v.trim()),
  thresholds: thresholdsSchema,
  effectiveFrom: z.string().datetime().optional(),
});

export type CreateIndicatorDto = z.infer<typeof createIndicatorSchema>;

export const updateIndicatorSchema = z.object({
  // ── Campos del Indicator ──────────────────────────────────────────────
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()).optional(),
  name: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
  processId: z.string().uuid().optional(),
  subprocessId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  chartType: z.enum(['LINE', 'PIE']).optional(),

  // ── Campos de IndicatorVersion (disparan nuevo versionado si cambian) ─
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'PROJECT_BASED']).optional(),
  direction: z.enum(['AT_LEAST', 'AT_MOST', 'RANGE']).optional(),
  formula: z.string().max(2000).nullable().optional(),
  inputMode: z.enum(['DIRECT_VALUE', 'FORMULA_INPUTS']).optional(),
  displayAsPercent: z.boolean().optional(),
  aggregation: z
    .enum(['LAST_VALUE', 'SUM', 'AVERAGE', 'WEIGHTED_AVERAGE', 'CUMULATIVE_RATIO'])
    .optional(),

  // ── Campos de IndicatorTarget (parte de la nueva versión) ─────────────
  targetValue: z.number().finite().optional(),
  unit: z.string().min(1).max(50).transform((v) => v.trim()).optional(),
  thresholds: thresholdsSchema.optional(),
});

export type UpdateIndicatorDto = z.infer<typeof updateIndicatorSchema>;

// ─── Exports ────────────────────────────────────────────────────────────

export const exportReportSchema = z
  .object({
    processId: z.string().uuid().optional(),
    startsAt: z.string().date().optional(),
    endsAt: z.string().date().optional(),
    note: z.string().trim().max(2_000).optional(),
    // Tipo de gráfica de tendencia a renderizar en el PDF (LINE por defecto)
    chartVariant: z.enum(['LINE', 'BAR']).optional(),
    // Legacy alias kept for backwards compat with old callers
    indicatorId: z.string().optional(),
  })
  .refine(
    ({ startsAt, endsAt }) => {
      if (!startsAt || !endsAt) return true;
      return new Date(startsAt) <= new Date(endsAt);
    },
    {
      message: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
      path: ['endsAt'],
    },
  );

export type ExportReportDto = z.infer<typeof exportReportSchema>;

// ─── Users ──────────────────────────────────────────────────────────────

export const rolesUpdateSchema = z
  .object({
    roles: z.array(z.string().min(1)).optional(),
    roleIds: z.array(z.string().min(1)).optional(),
    roleCodes: z.array(z.string().min(1)).optional(),
  })
  .transform((data) => ({
    roles: data.roles ?? data.roleIds ?? data.roleCodes ?? [],
  }))
  .refine((data) => data.roles.length > 0, {
    message: 'Debe proporcionar al menos un rol.',
  });

export const scopesUpdateSchema = z.object({
  processIds: z.array(z.string().uuid()),
});

export const rolePermissionsUpdateSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

// ─── Users: CRUD del módulo (solo QC_ADMIN) ───────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().min(1).max(120).optional(),
  username: z
    .string()
    .trim()
    .min(4, 'El nombre de usuario debe tener al menos 4 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario no puede contener espacios')
    .optional(),
  roleCodes: z.array(z.string().min(1)).min(1, 'Debe asignar al menos un rol.'),
  processIds: z.array(z.string().uuid()).default([]),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(120).nullable().optional(),
  lastName: z.string().trim().min(1).max(120).nullable().optional(),
  username: z
    .string()
    .trim()
    .min(4, 'El nombre de usuario debe tener al menos 4 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario no puede contener espacios')
    .nullable()
    .optional(),
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;

export const resetUserPasswordSchema = z.object({
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type ResetUserPasswordDto = z.infer<typeof resetUserPasswordSchema>;
