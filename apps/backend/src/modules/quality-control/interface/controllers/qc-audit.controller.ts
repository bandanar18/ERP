import { Request, Response, NextFunction } from 'express';
import { QcAuditLogService } from '../../application/services/qc-audit.service.js';

export class QcAuditLogController {
  constructor(private readonly auditLogService: QcAuditLogService) {}

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, startsAt, endsAt, action, entityType, actorId } = req.query;

      if (page || startsAt || endsAt || action || entityType || actorId) {
        const filters = {
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          startsAt: typeof startsAt === 'string' ? startsAt : undefined,
          endsAt: typeof endsAt === 'string' ? endsAt : undefined,
          action: typeof action === 'string' ? action : undefined,
          entityType: typeof entityType === 'string' ? entityType : undefined,
          actorId: typeof actorId === 'string' ? actorId : undefined,
        };
        res.json(await this.auditLogService.findFiltered(filters));
      } else {
        const logs = await this.auditLogService.findAll();
        res.json(logs);
      }
    } catch (error) {
      next(error);
    }
  };
}
