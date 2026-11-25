import { IQcAuditRepository, QcAuditLogEntry, AuditFilters, PaginatedAuditResult } from '../../domain/repositories/qc-audit.repository.js';

export class QcAuditLogService {
  constructor(private readonly repo: IQcAuditRepository) {}

  async findAll(): Promise<QcAuditLogEntry[]> {
    return this.repo.findRecent(200);
  }

  async findFiltered(filters: AuditFilters): Promise<PaginatedAuditResult> {
    return this.repo.findFiltered(filters);
  }
}
