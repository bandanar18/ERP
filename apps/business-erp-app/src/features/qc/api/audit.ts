import { qcApi } from './client';

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

export const auditApi = {
  list: () => qcApi.get<QcAuditEntry[]>('/audit'),
};
