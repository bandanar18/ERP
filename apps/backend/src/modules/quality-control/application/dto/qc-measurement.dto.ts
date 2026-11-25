import { z } from 'zod';

export const submitMeasurementSchema = z.object({
  indicatorVersionId: z.string().uuid(),
  periodId: z.string().uuid(),
  directValue: z.number().finite().optional(),
  inputs: z.record(z.string(), z.number().finite()).default({}),
  observation: z.string().max(3000).optional(),
  analysisInternal: z.string().max(5000).optional(),
  analysisExternal: z.string().max(5000).optional(),
  evidenceIds: z.array(z.string().uuid()).max(10).default([]),
});

export type SubmitMeasurementDto = z.infer<typeof submitMeasurementSchema>;

export const reviewMeasurementSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  observation: z.string().max(3000).optional(),
  analysisInternal: z.string().max(5000).optional(),
});

export type ReviewMeasurementDto = z.infer<typeof reviewMeasurementSchema>;
