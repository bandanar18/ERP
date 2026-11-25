import { Request, Response, NextFunction } from 'express';
import { QcError } from '../../errors.js';

export const qcErrorHandler = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof QcError || (err && err.name && err.name.startsWith('Qc'))) {
    res.status(err.statusCode || 400).json({ error: err.message });
    return;
  }
  console.error('[QC-ErrorHandler] Unhandled error:', err);
  next(err);
};
