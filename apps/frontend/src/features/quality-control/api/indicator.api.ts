import { apiFetch } from "./api-client";
import type {
  QcChartPoint,
  QcIndicatorDetail,
  QcProcurementDistribution,
} from "../types";

export const indicatorApi = {
  detail: (id: string) => apiFetch<QcIndicatorDetail>(`/indicators/${id}`),
  chart: (id: string, periodId?: string) =>
    apiFetch<QcChartPoint[]>(`/indicators/${id}/chart`, { params: { periodId } }),
  procurementDistribution: (id: string, startsAt?: string, endsAt?: string) =>
    apiFetch<QcProcurementDistribution>(`/indicators/${id}/procurement-distribution`, {
      params: { startsAt, endsAt },
    }),
};
