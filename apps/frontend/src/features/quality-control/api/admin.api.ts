import { apiFetch } from "./api-client";
import type { QcAdminIndicator, QcAdminProcess } from "../types";

export interface CreateProcessPayload {
  code: string;
  name: string;
  parentId?: string | null;
}

export interface UpdateProcessPayload {
  code?: string;
  name?: string;
  parentId?: string | null;
}

export interface CreateIndicatorPayload {
  code: string;
  name: string;
  processId: string;
  subprocessId?: string | null;
  projectId?: string | null;
  chartType?: "LINE" | "PIE";
  frequency: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "PROJECT_BASED";
  direction: "AT_LEAST" | "AT_MOST" | "RANGE";
  formula?: string | null;
  inputMode?: "DIRECT_VALUE" | "FORMULA_INPUTS";
  displayAsPercent?: boolean;
  aggregation?: "LAST_VALUE" | "SUM" | "AVERAGE" | "WEIGHTED_AVERAGE" | "CUMULATIVE_RATIO";
  targetValue: number;
  unit: string;
  thresholds: { green: number; yellow?: number; orange?: number; red?: number };
  effectiveFrom?: string;
}

export interface UpdateIndicatorPayload {
  name?: string;
  processId?: string;
  subprocessId?: string | null;
  projectId?: string | null;
  chartType?: "LINE" | "PIE";
  frequency?: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "PROJECT_BASED";
  direction?: "AT_LEAST" | "AT_MOST" | "RANGE";
  formula?: string | null;
  inputMode?: "DIRECT_VALUE" | "FORMULA_INPUTS";
  displayAsPercent?: boolean;
  aggregation?: "LAST_VALUE" | "SUM" | "AVERAGE" | "WEIGHTED_AVERAGE" | "CUMULATIVE_RATIO";
  targetValue?: number;
  unit?: string;
  thresholds?: { green: number; yellow?: number; orange?: number; red?: number };
}

export const adminApi = {
  // Procesos
  listProcesses: () => apiFetch<QcAdminProcess[]>("/admin/processes"),
  getProcess: (id: string) => apiFetch<QcAdminProcess>(`/admin/processes/${id}`),
  createProcess: (payload: CreateProcessPayload) =>
    apiFetch<QcAdminProcess>("/admin/processes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProcess: (id: string, payload: UpdateProcessPayload) =>
    apiFetch<QcAdminProcess>(`/admin/processes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Indicadores
  listIndicators: () => apiFetch<QcAdminIndicator[]>("/admin/indicators"),
  getIndicator: (id: string) => apiFetch<QcAdminIndicator>(`/admin/indicators/${id}`),
  createIndicator: (payload: CreateIndicatorPayload) =>
    apiFetch<QcAdminIndicator>("/admin/indicators", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateIndicator: (id: string, payload: UpdateIndicatorPayload) =>
    apiFetch<QcAdminIndicator>(`/admin/indicators/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
