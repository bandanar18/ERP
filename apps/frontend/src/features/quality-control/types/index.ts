/* ============================================================================
   Quality Control — Tipos del dominio (espejo de los DTOs del backend
   /api/quality-control). Nombres y formas siguen las respuestas reales.
============================================================================ */

// ─── Auth ───────────────────────────────────────────────────────────────────

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

export interface QcRegisterDto {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

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

// ─── Indicadores / gráficas ────────────────────────────────────────────────

export interface QcChartPoint {
  period: string;
  meta: number | null;
  medicion: number | null;
  medicionAnterior?: number | null;
  tendencia?: number | null;
  tendenciaFinal?: number | null;
  trafficLight: string | null;
  accumulatedBilled?: number;
  accumulatedExecuted?: number;
  trend?: number;
}

export interface QcProcurementDistribution {
  confiables: number;
  requierenMejoras: number;
  suspendidos: number;
  total: number;
  porcentajeConfiables: number;
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

export interface QcIndicatorLite {
  id: string;
  code: string;
  name: string;
  chartType: string;
}

export interface QcIndicatorDetail {
  id: string;
  organizationId: string;
  processId: string;
  subprocessId: string | null;
  projectId: string | null;
  code: string;
  name: string;
  chartType: string;
  process: { id: string; code: string; name: string };
  versions: QcIndicatorVersionDetail[];
}

export interface QcIndicatorVersionDetail {
  id: string;
  frequency: string;
  direction: string;
  formula: string | null;
  inputMode: string;
  displayAsPercent: boolean;
  aggregation: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  targets: Array<{
    id: string;
    targetValue: number;
    unit: string;
    thresholds: Record<string, number>;
  }>;
  measurements: QcMeasurementLite[];
}

export interface QcMeasurementLite {
  id: string;
  value: number | null;
  status: string;
  trafficLight: string | null;
  periodId: string;
  period: { startsAt: string; endsAt: string };
  observation: string | null;
  inputs: Array<{ key: string; value: number }>;
}

// ─── Mediciones ─────────────────────────────────────────────────────────────

export interface QcMeasurement {
  id: string;
  indicatorVersionId: string;
  periodId: string;
  value: number | null;
  status: string;
  trafficLight: string | null;
  submittedById: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  observation: string | null;
  analysisInternal: string | null;
  analysisExternal: string | null;
  createdAt: string;
  updatedAt: string;
  version: {
    id: string;
    frequency: string;
    direction: string;
    formula: string | null;
    inputMode: string;
    displayAsPercent: boolean;
    aggregation: string;
    indicator: {
      id: string;
      code: string;
      name: string;
      chartType: string;
      process: { id: string; code: string; name: string };
    };
    targets: Array<{
      id: string;
      targetValue: number;
      unit: string;
      thresholds: Record<string, number>;
    }>;
  };
  period: {
    id: string;
    startsAt: string;
    endsAt: string;
    dueDate: string;
    status: string;
  };
  submittedBy: { email: string };
  reviewedBy: { email: string } | null;
  inputs: Array<{ id: string; measurementId: string; key: string; value: number }>;
}

// ─── Reportes / auditoría ───────────────────────────────────────────────────

export interface QcPerformanceReport {
  totalIndicators: number;
  complying: number;
  notComplying: number;
  byProcess: Record<string, Array<{ indicator: string; value: number | null; status: string | null }>>;
}

export interface QcAuditEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  route: string | null;
  createdAt: string;
  actor: { id: string; email: string };
}

// ─── Administración: usuarios / RBAC ────────────────────────────────────────

export interface QcUserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  status: string;
  emailVerified: boolean;
  deletedAt: string | null;
  createdAt: string;
  organization: { name: string };
  qc_user_roles: Array<{ role: { id: string; code: string; description: string | null } }>;
  processAssignments: Array<{ process: { id: string; code: string; name: string } }>;
}

export interface QcRoleWithPermissions {
  id: string;
  code: string;
  description: string | null;
  qc_role_permissions: Array<{ permission: { id: string; code: string; description: string | null } }>;
}

export interface QcPermissionItem {
  id: string;
  code: string;
  description: string | null;
  deletedAt: string | null;
}

// ─── Administración: procesos e indicadores ────────────────────────────────

export interface QcAdminProcess {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: QcAdminProcess[];
  qc_indicators?: QcIndicatorLite[];
}

export interface QcAdminIndicator {
  id: string;
  organizationId: string;
  processId: string;
  subprocessId: string | null;
  projectId: string | null;
  code: string;
  name: string;
  chartType: string;
  createdAt: string;
  updatedAt: string;
  process: { id: string; code: string; name: string };
  versions?: QcIndicatorVersionDetail[];
}

export interface QcReportingPeriod {
  id: string;
  startsAt: string;
  endsAt: string;
  dueDate: string;
  status: string;
}

// ─── Constantes del módulo ──────────────────────────────────────────────────

export const QC_ROLES = {
  ADMIN: "QC_ADMIN",
  DIRECTOR: "QC_DIRECTOR",
  OWNER: "QC_OWNER",
} as const;

export const QC_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  LOCKED: "Bloqueada",
};

export const QC_PERIOD_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  CLOSED: "Cerrado",
};

export const QC_FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  PROJECT_BASED: "Por proyecto",
};

export const QC_DIRECTION_LABELS: Record<string, string> = {
  AT_LEAST: "Mínimo (>=)",
  AT_MOST: "Máximo (<=)",
  RANGE: "Rango",
};

export const QC_TRAFFIC_LABELS: Record<string, string> = {
  GREEN: "Cumple",
  RED: "No cumple",
  GRAY: "Sin medir",
  YELLOW: "En alerta",
};
