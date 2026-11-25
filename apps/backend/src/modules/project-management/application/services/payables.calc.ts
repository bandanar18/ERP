import { Prisma } from '@prisma/client';

export type ObligationStatusCode = 'PENDIENTE' | 'PARCIAL' | 'PAGADO';

export function computeBalance(amount: Prisma.Decimal.Value, payments: Prisma.Decimal.Value[]) {
  const total = new Prisma.Decimal(amount);
  const paid = payments.reduce<Prisma.Decimal>((a, p) => a.plus(p), new Prisma.Decimal(0));
  const raw = total.minus(paid);
  const pending = raw.isNegative() ? new Prisma.Decimal(0) : raw;
  const status: ObligationStatusCode = pending.isZero() ? 'PAGADO' : paid.isZero() ? 'PENDIENTE' : 'PARCIAL';
  return { total, paid, pending, status };
}

/**
 * Costo Real según Criterio de Devengado (Incurridos y Pasivos):
 * - Incluye únicamente las obligaciones que representan un costo incurrido / devengado
 *   (se excluyen compromisos futuros donde isIncurred === false hasta su reconocimiento).
 * - Incluye los gastos directos ejecutados que no provienen del pago de una obligación
 *   (evita doble conteo con el pasivo reconocido).
 * - Excluye desembolsos de pago de obligaciones (obligationPaymentId).
 */
export function calcActualCost(
  obligations: Array<{
    amountUsd: Prisma.Decimal.Value;
    isIncurred?: boolean | null;
  }> = [],
  expenses: Array<{
    amountUsd: Prisma.Decimal.Value;
    obligationPaymentId?: string | null;
  }> = []
): number {
  const totalIncurredObligations = (obligations || [])
    .filter((o) => o.isIncurred !== false)
    .reduce<Prisma.Decimal>((acc, o) => acc.plus(new Prisma.Decimal(o.amountUsd || 0)), new Prisma.Decimal(0));

  const totalDirectExpenses = (expenses || [])
    .filter((e) => !e.obligationPaymentId)
    .reduce<Prisma.Decimal>((acc, e) => acc.plus(new Prisma.Decimal(e.amountUsd || 0)), new Prisma.Decimal(0));

  return totalIncurredObligations.plus(totalDirectExpenses).toNumber();
}

/**
 * Total Deuda / Obligaciones Comprometidas (Devengadas o Compromisos Futuros).
 */
export function calcTotalDebt(
  obligations: Array<{ amountUsd: Prisma.Decimal.Value }> = []
): number {
  return (obligations || [])
    .reduce<Prisma.Decimal>((acc, o) => acc.plus(new Prisma.Decimal(o.amountUsd || 0)), new Prisma.Decimal(0))
    .toNumber();
}

/**
 * Cuentas por Pagar (Saldo Pendiente total de todas las obligaciones).
 */
export function calcTotalPayables(
  obligations: Array<{
    amountUsd: Prisma.Decimal.Value;
    payments?: Array<{ amountUsd: Prisma.Decimal.Value }> | null;
  }> = []
): number {
  return (obligations || []).reduce<Prisma.Decimal>((acc, o) => {
    const payments = (o.payments || []).map((p) => p.amountUsd);
    const { pending } = computeBalance(o.amountUsd, payments);
    return acc.plus(pending);
  }, new Prisma.Decimal(0)).toNumber();
}
