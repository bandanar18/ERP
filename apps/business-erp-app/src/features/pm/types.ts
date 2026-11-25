export type PmRole = 'PM_ADMIN' | 'PM_GESTION' | 'PM_PLANIFICADOR' | 'PM_DIRECCION' | 'PM_ADMIN_FINANCIERO';

export interface PmScopes {
  companyIds: string[];
  projectIds: string[];
}

export interface PmUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  scopes: PmScopes;
  /** Datos personales expuestos por /auth/me (backend). */
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: PmUser;
  redirectUrl: string;
}

export interface LoginDto {
  /** Email O nombre de usuario (el backend resuelve cuál es). */
  login: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/* ─── Datos del módulo ─────────────────────────────────────────────── */

export const ProjectStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESCHEDULED: 'RESCHEDULED',
  DELAYED: 'DELAYED',
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export interface Project {
  id: string;
  code: string;
  fullName: string;
  shortName?: string;
  description?: string;
  managerId?: string;
  companyId: string;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  closedAt?: string;
  status: ProjectStatus;
  offeredAmount: number;
  estimatedCost?: number;
  actualPhysicalProgress?: string | null;
  plannedPhysicalProgress?: string | null;
  advanceAmount?: number;
  amortizedAmount?: number;
  cuentasPorPagar?: number;
  accountsPayable?: number;
  actualCost?: number;
  billedAmount?: number;
  collectedAmount?: number;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
    legalName?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    managerName?: string;
    managerEmail?: string;
    managerPhone?: string;
  };
  financialValuations?: any[];
  /** Último avance físico (si hay), para la métrica de avance actual. */
  lastProgress?: {
    id: string;
    date?: string;
    actualProgress?: string;
    plannedProgress?: string;
    attentionPoints?: string;
  } | null;
}

export interface Company {
  id: string;
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

/* ─── Usuarios del módulo (gestión de usuarios) ──────────────────────── */

/**
 * Usuario del MÓDULO PM (tabla pm_module_user). El adapter del backend
 * devuelve el shape de Prisma tal cual: `pm_user_roles[].pm_roles.code` y
 * `scopes[].companyId`. NO mapea a camelCase.
 */
export interface PmModuleRoleRef {
  id: string;
  code: string;
  description?: string | null;
}

export interface PmModuleUserRoleRef {
  userId: string;
  roleId: string;
  pm_roles: PmModuleRoleRef;
}

export interface PmModuleUserScopeRef {
  id: string;
  userId: string;
  companyId: string | null;
  projectId: string | null;
}

export interface ModuleUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  externalId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  pm_user_roles: PmModuleUserRoleRef[];
  scopes: PmModuleUserScopeRef[];
}

/** Metadatos de los roles del módulo (para chips, badges y filtros). */
export const PM_ROLE_META: { code: PmRole; label: string; color: string }[] = [
  { code: 'PM_ADMIN', label: 'Administrador', color: '#b9561d' },
  { code: 'PM_GESTION', label: 'Gestión', color: '#5e8fc2' },
  { code: 'PM_ADMIN_FINANCIERO', label: 'Administrador Financiero', color: '#d9772f' },
  { code: 'PM_PLANIFICADOR', label: 'Planificador', color: '#4c9b7a' },
  { code: 'PM_DIRECCION', label: 'Dirección', color: '#7d6ba8' },
];

export function pmRoleMeta(code: string | null | undefined) {
  return PM_ROLE_META.find((r) => r.code === code) ?? { code, label: 'Sin rol', color: '#8d918f' };
}

/* ─── Usuarios del sistema ERP (legacy /api/user-management) ──────────── */

export interface UserRoleRef {
  id: string;
  name: string;
}

export interface UserCompanyRef {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role?: UserRoleRef;
  company?: UserCompanyRef;
}

export interface RoleOption {
  id: string;
  name: string;
  description?: string;
}

export interface UserListMeta {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface UserListResponse {
  data: User[];
  meta: UserListMeta;
}

/* ─── Empresa: mutaciones ────────────────────────────────────────────── */

export interface CreateCompanyDto {
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface ProjectStats {
  totalProjects: number;
  projectsInProgress: number;
}

/* ─── Avance físico, costos y valuaciones ────────────────────────────── */

export interface PhysicalProgress {
  id: string;
  projectId: string;
  date: string;
  actualProgress: string;
  plannedProgress: string;
  attentionPoints?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreatePhysicalProgressDto {
  projectId: string;
  date: string;
  startDate?: string;
  endDate?: string;
  actualProgress: string;
  plannedProgress: string;
  attentionPoints?: string;
}

export interface CostPlanning {
  id: string;
  projectId: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostRequest {
  projectId: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
}

export type ValuationStatus = 'POR_VALUAR' | 'POR_FACTURAR' | 'FACTURADO';

export interface FinancialValuation {
  id: string;
  projectId: string;
  valuationNumber: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
  status: ValuationStatus;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateValuationRequest {
  projectId: string;
  valuationNumber: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
}

/* ─── Proyecto: mutaciones ───────────────────────────────────────────── */

/** Payload para POST /api/projects (crear proyecto). */
export interface CreateProjectDto {
  companyId: string;
  code: string;
  fullName: string;
  shortName?: string;
  description?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  offeredAmount: number;
  estimatedCost?: number;
}

/** Payload para PUT /api/projects/:id (editar proyecto, todos opcionales). */
export interface UpdateProjectDto {
  fullName?: string;
  shortName?: string;
  description?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  offeredAmount?: number;
  estimatedCost?: number;
}

/* ─── Galería de archivos ────────────────────────────────────────────── */

export interface GalleryFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  uploadDate: string;
  entityType: string;
  entityId: string;
  description?: string;
  category?: string;
}

export interface FileListResponse {
  files: GalleryFile[];
  total: number;
  entityType: string;
  entityId: string;
}

/* ─── Perfil ─────────────────────────────────────────────────────────── */

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/* ─── Cuentas por pagar, Costos reales y Cobros ────────────────────────── */

export type ObligationCategory = string;
export type ObligationStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO';

export interface ObligationPayment {
  id: string;
  amountUsd: number;
  paidAt: string;
  note?: string | null;
}

export interface Obligation {
  id: string;
  projectId: string;
  category: string;
  description: string;
  supplier?: string | null;
  invoiceNumber?: string | null;
  dueDate?: string | null;
  status: ObligationStatus;
  amountUsd: number;
  paidUsd: number;
  pendingUsd: number;
  paidAt?: string | null;
  isIncurred?: boolean;
  incurredAt?: string | null;
  supportDocument?: string | null;
  payments: ObligationPayment[];
}

export interface PayablesSummary {
  totalDebt: number;
  totalPaid: number;
  totalPending: number;
  actualCost?: number;
  totalIncurred?: number;
  directExpenses?: number;
  collectedAmount?: number;
  openCount: number;
  totalCount: number;
}

export interface ProjectAdvance {
  advanceAmount: number;
  amortizedAmount: number;
  pendingAmortization: number;
}

export interface PayablesSnapshot {
  items: Obligation[];
  summary: PayablesSummary;
  advance?: ProjectAdvance;
}

export interface CreateObligationRequest {
  projectId: string;
  category: string;
  description: string;
  supplier?: string | null;
  invoiceNumber?: string | null;
  amountUsd: number;
  dueDate?: string | null;
  isIncurred?: boolean;
  incurredAt?: string | null;
  supportDocument?: string | null;
}

export interface UpdateAdvanceRequest {
  advanceAmount: number;
  amortizedAmount: number;
}

export interface ProjectPayablesOverview {
  id: string;
  code: string;
  fullName: string;
  shortName?: string | null;
  status: string;
  company?: { id: string; name: string } | null;
  advanceAmount?: number;
  amortizedAmount?: number;
  summary: PayablesSummary;
}

export interface PayablesOverview {
  globalSummary: {
    totalDebt: number;
    totalPaid: number;
    totalPending: number;
    totalActualCost?: number;
    totalCollected?: number;
    totalAdvance?: number;
    totalAmortized?: number;
    openCount: number;
    totalProjects: number;
  };
  projects: ProjectPayablesOverview[];
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  description: string;
  amountUsd: number;
  expenseDate: string;
  createdById?: string | null;
  obligationPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCollection {
  id: string;
  projectId: string;
  valuationId?: string | null;
  reference?: string | null;
  grossAmountUsd?: number | null;
  amortizedAmountUsd?: number | null;
  amountUsd: number;
  collectedAt: string;
  createdById?: string | null;
  valuation?: {
    id: string;
    valuationNumber: string;
    invoiceNumber?: string | null;
    amountUsd: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}



