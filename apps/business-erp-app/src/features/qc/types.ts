/* ============================================================================
   Quality Control — Tipos (espejo de los DTOs del backend /api/quality-control)
============================================================================ */

export interface QcUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  scopes: {
    processIds: string[];
    subprocessIds: string[];
    projectIds: string[];
  };
}

export interface QcAuthResponse {
  token: string;
  user: QcUser;
  redirectUrl?: string;
}

export interface QcLoginDto {
  /** Correo electrónico O nombre de usuario. */
  login: string;
  password: string;
}

// ─── Constantes del módulo ──────────────────────────────────────────────────

export const QC_ROLES = {
  ADMIN: 'QC_ADMIN',
  DIRECTOR: 'QC_DIRECTOR',
  OWNER: 'QC_OWNER',
} as const;

export type QcRole = (typeof QC_ROLES)[keyof typeof QC_ROLES];

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface QcSummary {
  total: number;
  green: number;
  red: number;
  gray: number;
  yellow: number;
}

export interface QcMatrixEntry {
  id: string;
  process: string;
  processCode: string;
  code: string;
  name: string;
  frequency: string;
  direction: string | null;
  targetValue: number | null;
  unit: string | null;
  latestMeasurement: number | null;
  complianceStatus: string;
  period: string | null;
  conclusion: string | null;
  observation: string | null;
}

export interface QcTrendEntry {
  period: string;
  totalGreen: number;
  totalRed: number;
  total: number;
  compliancePct: number;
  [key: string]: string | number;
}

export interface QcReportingPeriod {
  id: string;
  startsAt: string;
  endsAt: string;
  dueDate: string;
  status: string;
}

// ─── Procesos ───────────────────────────────────────────────────────────────

export interface QcIndicatorLite {
  id: string;
  code: string;
  name: string;
  chartType: string;
}

export interface QcProcess {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  parentId: string | null;
  children: QcProcess[];
  qc_indicators: QcIndicatorLite[];
}

// ─── Reportes ───────────────────────────────────────────────────────────────

export interface QcPerformanceReport {
  totalIndicators: number;
  complying: number;
  notComplying: number;
  byProcess: Record<string, Array<{ indicator: string; value: number | null; status: string | null }>>;
}

// ─── Label de roles ─────────────────────────────────────────────────────────

export const QC_ROLE_LABELS: Record<string, string> = {
  QC_ADMIN: 'Administrador de Calidad',
  QC_DIRECTOR: 'Director Ejecutivo',
  QC_OWNER: 'Responsable de Proceso',
};
