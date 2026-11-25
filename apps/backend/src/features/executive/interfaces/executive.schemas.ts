import { z } from 'zod';

/**
 * MÓDULO EJECUTIVO — Schemas de validación (zod).
 * Portados desde los contratos del proyecto "Resumen Ejecutivo".
 */

// ─── Auth ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(320),
  password: z.string().min(1, 'La contraseña es requerida').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(320),
  // bcrypt trunca silenciosamente a 72 bytes — cap del esquema acorde al hash
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Mediciones ───────────────────────────────────────────────────────────

export const submitMeasurementSchema = z.object({
  indicatorVersionId: z.string().uuid('indicatorVersionId inválido'),
  periodId: z.string().uuid('periodId inválido'),
  directValue: z.number().finite().optional(),
  inputs: z.record(z.string(), z.number().finite()).default({}),
  observation: z.string().max(3000).optional(),
  analysisInternal: z.string().max(5000).optional(),
  analysisExternal: z.string().max(5000).optional(),
  evidenceIds: z.array(z.string().uuid()).max(10).default([]),
});

export type SubmitMeasurementInput = z.infer<typeof submitMeasurementSchema>;

export const reviewMeasurementSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  observation: z.string().max(3000).optional(),
  analysisInternal: z.string().max(5000).optional(),
});

export type ReviewMeasurementInput = z.infer<typeof reviewMeasurementSchema>;

// ─── Usuarios: mutaciones RBAC ────────────────────────────────────────────

export const updateUserRolesSchema = z.object({
  roles: z.array(z.string().trim().min(1).max(50)).min(1, 'Debe proporcionar al menos un rol').max(20),
});

export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>;

export const updateUserScopesSchema = z.object({
  processIds: z.array(z.string().uuid('processId inválido')).max(200),
});

export type UpdateUserScopesInput = z.infer<typeof updateUserScopesSchema>;

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid('permissionId inválido')).max(200),
});

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;

// ─── Admin: Procesos ──────────────────────────────────────────────────────

export const createProcessSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1).max(200).transform((v) => v.trim()),
  parentId: z.string().uuid().nullable().optional(),
});

export type CreateProcessInput = z.infer<typeof createProcessSchema>;

export const updateProcessSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()).optional(),
  name: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export type UpdateProcessInput = z.infer<typeof updateProcessSchema>;

// ─── Admin: Indicadores ───────────────────────────────────────────────────

export const thresholdsSchema = z.object({
  green: z.number().finite(),
  yellow: z.number().finite().optional(),
  orange: z.number().finite().optional(),
  red: z.number().finite().optional(),
});

export type ThresholdsInput = z.infer<typeof thresholdsSchema>;

export const createIndicatorSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1).max(200).transform((v) => v.trim()),
  processId: z.string().uuid(),
  subprocessId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  // Datos de versión
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'PROJECT_BASED']),
  direction: z.enum(['AT_LEAST', 'AT_MOST', 'RANGE']),
  formula: z.string().max(2000).nullable().optional(),
  // Datos de meta
  targetValue: z.number().finite(),
  unit: z.string().min(1).max(20).transform((v) => v.trim()),
  thresholds: thresholdsSchema,
  effectiveFrom: z.string().datetime().optional(),
});

export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>;

export const updateIndicatorSchema = z.object({
  name: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
  processId: z.string().uuid().optional(),
  subprocessId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  chartType: z.enum(['LINE', 'PIE']).optional(),

  // Campos de IndicatorVersion (disparan nuevo versionado si cambian)
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'PROJECT_BASED']).optional(),
  direction: z.enum(['AT_LEAST', 'AT_MOST', 'RANGE']).optional(),
  formula: z.string().max(2000).nullable().optional(),
  inputMode: z.enum(['DIRECT_VALUE', 'FORMULA_INPUTS']).optional(),
  displayAsPercent: z.boolean().optional(),
  aggregation: z.enum(['LAST_VALUE', 'SUM', 'AVERAGE', 'WEIGHTED_AVERAGE', 'CUMULATIVE_RATIO']).optional(),

  // Campos de IndicatorTarget (parte de la nueva versión)
  targetValue: z.number().positive().optional(),
  unit: z.string().min(1).max(20).transform((v) => v.trim()).optional(),
  thresholds: thresholdsSchema.optional(),
});

export type UpdateIndicatorInput = z.infer<typeof updateIndicatorSchema>;

// ─── Exports ──────────────────────────────────────────────────────────────

export const exportReportSchema = z
  .object({
    processId: z.string().uuid().optional(),
    startsAt: z.string().date('startsAt debe ser una fecha YYYY-MM-DD').optional(),
    endsAt: z.string().date('endsAt debe ser una fecha YYYY-MM-DD').optional(),
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

export type ExportReportInput = z.infer<typeof exportReportSchema>;
