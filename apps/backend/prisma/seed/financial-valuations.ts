import { PrismaClient, PmValuationStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Seed de valuaciones financieras (pm_financial_valuations).
 *
 * Crea un historial de 3-6 valuaciones por proyecto con estados variados
 * (POR_VALUAR → POR_FACTURAR → FACTURADO con número de factura) para que
 * los dashboards y la vista financiera tengan datos realistas.
 */
export async function seedFinancialValuations(prisma: PrismaClient) {
  console.log('  Seeding financial valuations...');

  const projects = await prisma.pmProject.findMany({
    where: { startDate: { not: null }, endDate: { not: null } },
  });

  if (projects.length === 0) {
    console.log('[Seed] Warning: No projects found. Skipping financial valuations seed.');
    return [];
  }

  // Proyectos que ya tienen valuaciones (idempotencia por proyecto)
  const projectsWithValuations = await prisma.pmFinancialValuation.findMany({
    select: { projectId: true },
    distinct: ['projectId'],
  });
  const coveredProjectIds = new Set(projectsWithValuations.map((p) => p.projectId));
  const pendingProjects = projects.filter((p) => !coveredProjectIds.has(p.id));

  if (pendingProjects.length === 0) {
    console.log(`[Seed] Financial valuations already complete (${projectsWithValuations.length} projects covered), skipping...`);
    return await prisma.pmFinancialValuation.findMany();
  }

  console.log(`[Seed] Creating valuations for ${pendingProjects.length} projects (${projects.length - pendingProjects.length} already covered)`);

  let valuationCount = 0;

  for (const project of pendingProjects) {
    if (!project.startDate || !project.endDate) continue;

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const durationMs = end.getTime() - start.getTime();

    // 3-6 valuaciones por proyecto (una cada ~2-3 semanas)
    const numberOfValuations = faker.number.int({ min: 3, max: 6 });
    const offered = Number(project.offeredAmount) || 100000;
    const totalValued = offered * (0.55 + Math.random() * 0.4);

    let previousDate = new Date(start);

    for (let i = 0; i < numberOfValuations; i++) {
      const progress = (i + 1) / numberOfValuations;
      const valStart = new Date(previousDate);
      const valEnd = new Date(start.getTime() + durationMs * progress);

      // Monto incremental: cada valuación suma sobre la anterior
      const amount = Math.round((totalValued / numberOfValuations) * (0.8 + Math.random() * 0.4));

      // Estados: las primeras POR_VALUAR, del medio POR_FACTURAR, últimas FACTURADO
      let status: PmValuationStatus;
      let invoiceNumber: string | null = null;

      if (i === numberOfValuations - 1) {
        status = 'POR_VALUAR';
      } else if (i >= numberOfValuations - 3) {
        status = 'POR_FACTURAR';
      } else {
        status = 'FACTURADO';
        invoiceNumber = `INV-${new Date().getFullYear()}-${faker.string.numeric(6)}`;
      }

      await prisma.pmFinancialValuation.create({
        data: {
          projectId: project.id,
          valuationNumber: `VAL-${String(project.code).slice(-4)}-${String(i + 1).padStart(2, '0')}`,
          amountUsd: amount,
          startDate: valStart,
          endDate: valEnd,
          status,
          invoiceNumber,
        },
      });

      previousDate = valEnd;
      valuationCount++;
    }
  }

  console.log(`[Seed] Financial valuations seeded: ${valuationCount}`);
  return await prisma.pmFinancialValuation.findMany();
}
