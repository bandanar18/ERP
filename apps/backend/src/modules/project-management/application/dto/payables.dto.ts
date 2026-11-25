import { z } from 'zod';

export const createObligationSchema = z.object({
  projectId: z.string().min(1),
  category: z.string().trim().min(1, 'La categoría es requerida').max(100),
  description: z.string().trim().min(1, 'La descripción es requerida').max(300),
  supplier: z.string().trim().max(150).nullable().optional(),
  invoiceNumber: z.string().trim().max(60).nullable().optional(),
  amountUsd: z.number().positive('El monto debe ser mayor a 0'),
  dueDate: z.coerce.date().nullable().optional(),
  isIncurred: z.boolean().optional().default(true),
  incurredAt: z.coerce.date().nullable().optional(),
  supportDocument: z.string().trim().max(150).nullable().optional(),
});

export const updateObligationSchema = createObligationSchema.omit({ projectId: true }).partial();

export const payObligationSchema = z.object({
  amountUsd: z.number().positive('El pago debe ser mayor a 0').optional(), // omitido = paga el saldo restante
  note: z.string().trim().max(300).nullable().optional(),
});

export const setPaidSchema = z.object({
  paid: z.boolean(),
});

export const updateAdvanceSchema = z
  .object({
    advanceAmount: z.number().min(0, 'El anticipo no puede ser negativo'),
    amortizedAmount: z.number().min(0, 'La amortización no puede ser negativa'),
  })
  .refine((data) => data.amortizedAmount <= data.advanceAmount, {
    message: 'La amortización acumulada no puede superar el anticipo otorgado',
    path: ['amortizedAmount'],
  });

export const recognizeObligationSchema = z.object({
  isIncurred: z.boolean().default(true),
  incurredAt: z.coerce.date().nullable().optional(),
  supportDocument: z.string().trim().max(250).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
});

