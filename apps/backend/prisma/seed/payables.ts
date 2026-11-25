import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Seed de CUENTAS POR PAGAR, GASTOS y COBRANZAS del módulo PM.
 *
 * Por cada proyecto crea:
 *  - Anticipo (advanceAmount) y amortización parcial en ~50% de proyectos.
 *  - 2-6 obligaciones (pm_project_obligations) con estados PAGADO / PARCIAL /
 *    PENDIENTE. Cada pago genera su gasto vinculado, igual que la API real.
 *  - 0-3 gastos directos (pm_project_expenses sin obligación).
 *  - Cobranzas (pm_project_collections) sobre la mayoría de valuaciones
 *    FACTURADO, para que el % "cobrado / facturado" tenga datos.
 *
 * Idempotente por proyecto: si un proyecto ya tiene obligaciones, se omite.
 */
const CATEGORIES = ['Equipos', 'Viáticos', 'Alquileres', 'Combustible', 'Facturas', 'Materiales', 'Servicios', 'Otros'];
const SUPPLIERS = [
  'Ferretería El Constructor CA',
  'Distribuidora Andina',
  'Transporte Rápido Express',
  'Suministros Industriales Lara',
  'TecnoServicios del Centro',
  'Alquiladora de Maquinaria Zulia',
  'Combustibles del Orinoco',
  'Papelería y Oficina Caracas',
];

const D = (v: number) => new Prisma.Decimal(v.toFixed(2));
const round = (n: number) => Math.round(n * 100) / 100;

export async function seedPayables(prisma: PrismaClient) {
  console.log('  Seeding payables / expenses / collections...');
  faker.seed(2026);

  const projects = await prisma.pmProject.findMany({
    include: {
      pm_financial_valuations: { orderBy: { startDate: 'asc' } },
      _count: { select: { pm_obligations: true } },
    },
  });
  const pending = projects.filter((p) => p._count.pm_obligations === 0);
  if (pending.length === 0) {
    console.log('[Seed] Payables already present, skipping...');
    return;
  }

  const now = new Date();
  let obligations = 0, payments = 0, expenses = 0, collections = 0;

  for (const p of pending) {
    const estimated = Number(p.estimatedCost) || 50000;
    const offered = Number(p.offeredAmount) || estimated * 1.3;
    const start = p.startDate ?? faker.date.past({ years: 1 });
    const end = p.endDate && p.endDate < now ? p.endDate : now;
    const between = () => (start < end ? faker.date.between({ from: start, to: end }) : start);

    // Anticipo
    if (faker.datatype.boolean()) {
      const advance = round(offered * faker.number.float({ min: 0.1, max: 0.3 }));
      const amortized = round(advance * faker.number.float({ min: 0, max: 0.8 }));
      await prisma.pmProject.update({
        where: { id: p.id },
        data: { advanceAmount: D(advance), amortizedAmount: D(amortized) },
      });
    }

    // Obligaciones (~ 40-70% del costo estimado repartido)
    const nObl = faker.number.int({ min: 2, max: 6 });
    const budget = estimated * faker.number.float({ min: 0.4, max: 0.7 });
    for (let i = 0; i < nObl; i++) {
      const amount = round((budget / nObl) * faker.number.float({ min: 0.6, max: 1.4 }));
      const category = faker.helpers.arrayElement(CATEGORIES);
      const incurredAt = between();
      const isIncurred = faker.number.int({ min: 1, max: 10 }) > 1; // 90% devengadas
      const mode = faker.helpers.weightedArrayElement([
        { weight: 4, value: 'PAGADO' as const },
        { weight: 3, value: 'PARCIAL' as const },
        { weight: 3, value: 'PENDIENTE' as const },
      ]);

      const obligation = await prisma.pmProjectObligation.create({
        data: {
          projectId: p.id,
          category,
          description: `${category} - ${faker.commerce.productName()}`,
          supplier: faker.helpers.arrayElement(SUPPLIERS),
          invoiceNumber: `F-${faker.string.numeric(6)}`,
          amountUsd: D(amount),
          dueDate: faker.date.soon({ days: 60, refDate: incurredAt }),
          status: mode,
          isIncurred,
          incurredAt: isIncurred ? incurredAt : null,
          paidAt: mode === 'PAGADO' ? incurredAt : null,
          createdById: p.managerId,
          createdAt: incurredAt,
        },
      });
      obligations++;

      const toPay = mode === 'PAGADO' ? [amount] : mode === 'PARCIAL'
        ? [round(amount * faker.number.float({ min: 0.2, max: 0.7 }))]
        : [];
      // Divide un pago total en 2 cuotas a veces
      if (mode === 'PAGADO' && faker.datatype.boolean()) {
        const first = round(amount * 0.5);
        toPay.splice(0, 1, first, round(amount - first));
      }

      for (const amt of toPay) {
        const paidAt = faker.date.between({ from: incurredAt, to: new Date(Math.max(incurredAt.getTime() + 1, now.getTime())) });
        const pay = await prisma.pmObligationPayment.create({
          data: { obligationId: obligation.id, amountUsd: D(amt), paidAt, paidById: p.managerId, note: 'Transferencia bancaria' },
        });
        await prisma.pmProjectExpense.create({
          data: {
            projectId: p.id,
            description: `Pago obligación: ${obligation.description}`,
            amountUsd: D(amt),
            expenseDate: paidAt,
            createdById: p.managerId,
            obligationPaymentId: pay.id,
          },
        });
        payments++;
        expenses++;
      }
    }

    // Gastos directos
    const nDirect = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < nDirect; i++) {
      await prisma.pmProjectExpense.create({
        data: {
          projectId: p.id,
          description: `${faker.helpers.arrayElement(['Viáticos', 'Combustible', 'Caja chica', 'Fletes'])} - ${faker.lorem.words(3)}`,
          amountUsd: D(round(faker.number.float({ min: 150, max: 2500 }))),
          expenseDate: between(),
          createdById: p.managerId,
        },
      });
      expenses++;
    }

    // Cobranzas sobre valuaciones facturadas
    for (const v of p.pm_financial_valuations.filter((x) => x.status === 'FACTURADO')) {
      if (faker.number.int({ min: 1, max: 10 }) > 7) continue; // ~30% sin cobrar
      const gross = Number(v.amountUsd);
      const amortizedPart = Number(p.advanceAmount) > 0 ? round(gross * 0.1) : 0;
      const full = faker.number.int({ min: 1, max: 10 }) > 2;
      const net = round((gross - amortizedPart) * (full ? 1 : faker.number.float({ min: 0.4, max: 0.8 })));
      await prisma.pmProjectCollection.create({
        data: {
          projectId: p.id,
          valuationId: v.id,
          reference: `TRF-${faker.string.numeric(8)}`,
          grossAmountUsd: D(gross),
          amortizedAmountUsd: D(amortizedPart),
          amountUsd: D(net),
          collectedAt: faker.date.soon({ days: 30, refDate: v.endDate }),
          createdById: p.managerId,
        },
      });
      collections++;
    }
  }

  console.log(
    `[Seed] Payables: ${obligations} obligaciones | ${payments} pagos | ${expenses} gastos | ${collections} cobranzas (${pending.length} proyectos)`,
  );
}

// Permite ejecutarlo solo: `pnpm --filter backend db:seed:payables`
if (process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed/payables.ts')) {
  const { prisma } = await import('../../src/config/database');
  seedPayables(prisma)
    .catch((e) => {
      console.error('[Seed Payables] Failed:', e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
