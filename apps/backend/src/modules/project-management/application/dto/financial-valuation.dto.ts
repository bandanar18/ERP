import { z } from 'zod';
import { PmValuationStatus } from '@prisma/client';

export const createFinancialValuationSchema = z.object({
  projectId: z.string().uuid(),
  valuationNumber: z.string().min(1),
  amountUsd: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(PmValuationStatus).optional(),
  invoiceNumber: z.string().nullable().optional(),
});

export const updateFinancialValuationSchema = z.object({
  valuationNumber: z.string().min(1).optional(),
  amountUsd: z.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(PmValuationStatus).optional(),
  invoiceNumber: z.string().nullable().optional(),
});

export type CreateFinancialValuationDto = z.infer<typeof createFinancialValuationSchema>;
export type UpdateFinancialValuationDto = z.infer<typeof updateFinancialValuationSchema>;
