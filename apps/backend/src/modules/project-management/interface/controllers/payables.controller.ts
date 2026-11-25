import { Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PayablesService } from '../../application/services/payables.service.js';
import { PmAuthRequest } from '../middleware/pm-auth.middleware.js';
import { PmValidationError } from '../../errors.js';
import {
  createObligationSchema,
  updateObligationSchema,
  payObligationSchema,
  setPaidSchema,
  updateAdvanceSchema,
  recognizeObligationSchema,
} from '../../application/dto/payables.dto.js';

export class PayablesController {
  constructor(private readonly service: PayablesService) {}

  private wrap(fn: (req: PmAuthRequest, res: Response) => Promise<void>) {
    return async (req: PmAuthRequest, res: Response, next: NextFunction) => {
      try { await fn(req, res); }
      catch (e) {
        next(e instanceof ZodError ? new PmValidationError(e.issues.map((i) => i.message).join(', ')) : e);
      }
    };
  }

  getOverview = this.wrap(async (req, res) => {
    res.json(await this.service.overview(req.pmUser!));
  });
  getByProject = this.wrap(async (req, res) => {
    res.json(await this.service.snapshot(req.pmUser!, req.params.projectId as string));
  });
  create = this.wrap(async (req, res) => {
    res.status(201).json(await this.service.create(req.pmUser!, createObligationSchema.parse(req.body)));
  });
  update = this.wrap(async (req, res) => {
    res.json(await this.service.update(req.pmUser!, req.params.id as string, updateObligationSchema.parse(req.body)));
  });
  pay = this.wrap(async (req, res) => {
    res.json(await this.service.pay(req.pmUser!, req.params.id as string, payObligationSchema.parse(req.body ?? {})));
  });
  setPaid = this.wrap(async (req, res) => {
    const { paid } = setPaidSchema.parse(req.body);
    res.json(await this.service.setPaid(req.pmUser!, req.params.id as string, paid));
  });
  updateAdvance = this.wrap(async (req, res) => {
    const dto = updateAdvanceSchema.parse(req.body);
    res.json(await this.service.updateAdvance(req.pmUser!, req.params.projectId as string, dto));
  });
  revertPayment = this.wrap(async (req, res) => {
    res.json(await this.service.revertPayment(req.pmUser!, req.params.paymentId as string));
  });
  recognize = this.wrap(async (req, res) => {
    const dto = recognizeObligationSchema.parse(req.body ?? {});
    res.json(await this.service.recognize(req.pmUser!, req.params.id as string, dto));
  });
  remove = this.wrap(async (req, res) => {
    res.json(await this.service.remove(req.pmUser!, req.params.id as string));
  });
}
