import { Prisma } from '@prisma/client';

export type QcProcessWithDetails = Prisma.QcProcessGetPayload<{
  include: {
    children: true;
    qc_indicators: true;
  };
}>;

export interface IQcProcessRepository {
  findAll(): Promise<QcProcessWithDetails[]>;
  findMine(userId: string): Promise<QcProcessWithDetails[]>;
}
