import { apiFetch } from "./api-client";
import type { QcAuditEntry } from "../types";

export interface AuditFilters {
  page?: number;
  limit?: number;
  startsAt?: string;
  endsAt?: string;
  action?: string;
  entityType?: string;
}

export interface PaginatedAuditResult {
  data: QcAuditEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  list: () => apiFetch<QcAuditEntry[]>("/audit-logs"),
  filtered: (filters: AuditFilters) => {
    const params: Record<string, string | number | undefined> = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.startsAt) params.startsAt = filters.startsAt;
    if (filters.endsAt) params.endsAt = filters.endsAt;
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;
    return apiFetch<PaginatedAuditResult>("/audit-logs", { params });
  },
};
