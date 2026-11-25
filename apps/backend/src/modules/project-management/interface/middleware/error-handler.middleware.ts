import { Request, Response, NextFunction } from 'express';
import { PmError } from '../../errors.js';

export const pmErrorHandler = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof PmError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  next(err);
};
