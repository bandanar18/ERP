import { apiFetch } from "./api-client";
import type { QcPerformanceReport } from "../types";

export const reportApi = {
  performance: (periodId?: string) =>
    apiFetch<QcPerformanceReport>("/reports/performance", { params: { periodId } }),
};
