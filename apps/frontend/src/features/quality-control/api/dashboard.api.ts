import { apiFetch } from "./api-client";
import type {
  QcMatrixEntry,
  QcReportingPeriod,
  QcSummary,
  QcTrendEntry,
} from "../types";

export const dashboardApi = {
  summary: () => apiFetch<QcSummary>("/dashboard/summary"),
  matrix: () => apiFetch<QcMatrixEntry[]>("/dashboard/matrix"),
  activePeriod: () => apiFetch<QcReportingPeriod | null>("/dashboard/active-period"),
  ownerSummary: () => apiFetch<QcSummary>("/dashboard/owner/summary"),
  complianceTrend: () => apiFetch<QcTrendEntry[]>("/dashboard/director/trend"),
};
