import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class HealthController {
  constructor(private readonly prisma: PrismaClient) {}

  check = async (_req: Request, res: Response): Promise<void> => {
    let database = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    res.json({
      status: 'ok',
      module: 'quality-control',
      database,
      timestamp: new Date().toISOString(),
    });
  };
}
