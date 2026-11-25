import { z } from 'zod';

export const CreatePmCostPlanningDTOSchema = z.object({
  projectId: z.string().uuid('El ID del proyecto debe ser un UUID válido'),
  amountUsd: z.number().positive('El monto debe ser positivo'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreatePmCostPlanningDTO = z.infer<typeof CreatePmCostPlanningDTOSchema>;
