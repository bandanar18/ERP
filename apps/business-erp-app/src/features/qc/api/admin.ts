import { qcApi } from './client';

export interface QcAdminProcess {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: QcAdminProcess[];
  qc_indicators?: Array<{ id: string; code: string; name: string; chartType: string }>;
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
  versions?: Array<{
    id: string;
    frequency: string;
    direction: string;
    formula: string | null;
    inputMode: string;
    displayAsPercent: boolean;
    aggregation: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    targets: Array<{ id: string; targetValue: number; unit: string; thresholds: Record<string, number> }>;
  }>;
}

export interface CreateProcessPayload {
  code: string;
  name: string;
  parentId: string | null;
}

export interface UpdateProcessPayload {
  code?: string;
  name?: string;
  parentId?: string | null;
}

export interface CreateIndicatorPayload {
  processId: string;
  subprocessId?: string | null;
  code: string;
  name: string;
  chartType: string;
  frequency: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "PROJECT_BASED" | string;
  direction: "AT_LEAST" | "AT_MOST" | "RANGE" | string;
  formula?: string | null;
  inputMode?: "DIRECT_VALUE" | "FORMULA_INPUTS" | string;
  displayAsPercent?: boolean;
  aggregation?: "LAST_VALUE" | "SUM" | "AVERAGE" | "WEIGHTED_AVERAGE" | "CUMULATIVE_RATIO" | string;
  targetValue: number;
  unit: string;
  thresholds: { green: number; yellow?: number; orange?: number; red?: number };
  effectiveFrom?: string;
}

export interface UpdateIndicatorPayload {
  code?: string;
  name?: string;
  chartType?: string;
  processId?: string;
  subprocessId?: string | null;
  frequency?: string;
  direction?: string;
  formula?: string | null;
  inputMode?: string;
  displayAsPercent?: boolean;
  aggregation?: string;
  targetValue?: number;
  unit?: string;
  thresholds?: { green: number; yellow?: number; orange?: number; red?: number };
}

export const adminApi = {
  // Procesos
  listProcesses: () => qcApi.get<QcAdminProcess[]>('/admin/processes'),
  getProcess: (id: string) => qcApi.get<QcAdminProcess>(`/admin/processes/${id}`),
  createProcess: (payload: CreateProcessPayload) =>
    qcApi.post<QcAdminProcess>('/admin/processes', payload),
  updateProcess: (id: string, payload: UpdateProcessPayload) =>
    qcApi.patch<QcAdminProcess>(`/admin/processes/${id}`, payload),

  // Indicadores
  listIndicators: () => qcApi.get<QcAdminIndicator[]>('/admin/indicators'),
  getIndicator: (id: string) => qcApi.get<QcAdminIndicator>(`/admin/indicators/${id}`),
  createIndicator: (payload: CreateIndicatorPayload) =>
    qcApi.post<QcAdminIndicator>('/admin/indicators', payload),
  updateIndicator: (id: string, payload: UpdateIndicatorPayload) =>
    qcApi.patch<QcAdminIndicator>(`/admin/indicators/${id}`, payload),
};
