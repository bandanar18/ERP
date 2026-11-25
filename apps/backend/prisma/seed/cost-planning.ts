import { PrismaClient } from '@prisma/client';

export async function seedCostPlannings(prisma: PrismaClient) {
  console.log('  Seeding cost plannings...');

  const projects = await prisma.pmProject.findMany({
    where: { startDate: { not: null }, endDate: { not: null } }
  });

  if (projects.length === 0) {
    console.log('[Seed] Warning: No projects found. Skipping cost plannings seed.');
    return [];
  }

  // Proyectos que ya tienen costos (idempotencia por proyecto)
  const projectsWithCosts = await prisma.pmCostPlanning.findMany({
    select: { projectId: true },
    distinct: ['projectId'],
  });
  const coveredProjectIds = new Set(projectsWithCosts.map((p) => p.projectId));
  const pendingProjects = projects.filter((p) => !coveredProjectIds.has(p.id));

  if (pendingProjects.length === 0) {
    console.log(`[Seed] Cost plannings already complete (${projectsWithCosts.length} projects covered), skipping...`);
    return await prisma.pmCostPlanning.findMany();
  }

  console.log(`[Seed] Creating costs for ${pendingProjects.length} projects (${projects.length - pendingProjects.length} already covered)`);

  let costCount = 0;

  for (const project of pendingProjects) {
    if (!project.startDate || !project.endDate) continue;

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const durationWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Crear costos distribuidos semanalmente dentro del rango del proyecto
    // Para 2-3 meses: 8-13 costos (1 por semana)
    const numberOfCosts = Math.min(13, Math.max(8, durationWeeks));

    // Costo estimado total del proyecto
    const estimatedCost = Number(project.estimatedCost) || 50000;

    // Distribuir costos: algunos meses gastan más, otros menos
    // Total real debería estar cerca del estimado (80-120%)
    const totalRealCost = estimatedCost * (0.8 + Math.random() * 0.4);

    for (let i = 0; i < numberOfCosts; i++) {
      // Distribuir las fechas dentro del rango del proyecto
      const progress = i / (numberOfCosts - 1); // 0 a 1

      const costStart = new Date(start.getTime() + (end.getTime() - start.getTime()) * progress);
      const costEnd = new Date(costStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 semana

      // Variar el monto: algunas semanas más, otras menos
      const baseAmount = totalRealCost / numberOfCosts;
      const variance = 0.5 + Math.random(); // 0.5 a 1.5
      const amount = Math.round(baseAmount * variance);

      await prisma.pmCostPlanning.create({
        data: {
          projectId: project.id,
          amountUsd: amount,
          startDate: costStart,
          endDate: costEnd
        }
      });
      costCount++;
    }
  }

  console.log(`[Seed] Cost plannings seeded: ${costCount}`);
  return await prisma.pmCostPlanning.findMany();
}
