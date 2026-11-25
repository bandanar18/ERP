import { PrismaClient, PmProjectStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedProjects(prisma: PrismaClient) {
  console.log('  Seeding projects...');

  // Obtener empresas existentes
  const companies = await prisma.pmCompany.findMany();

  if (companies.length === 0) {
    console.log('[Seed] Warning: No companies found. Skipping projects seed.');
    return [];
  }

  // Idempotencia: si ya hay proyectos suficientes (4 por empresa), no duplicar
  const existingProjects = await prisma.pmProject.count();
  if (existingProjects >= companies.length * 4) {
    console.log(`[Seed] Projects already exist (${existingProjects}), assigning managers to unassigned...`);
    // Asignar managers a proyectos que no lo tienen
    const managers2 = await prisma.pmModuleUser.findMany({
      where: { pm_user_roles: { some: { pm_roles: { code: { in: ['PM_PLANIFICADOR', 'PM_GESTION'] } } } } },
    });
    if (managers2.length > 0) {
      const unassigned = await prisma.pmProject.findMany({ where: { managerId: null } });
      for (const project of unassigned) {
        const manager = faker.helpers.arrayElement(managers2);
        await prisma.pmProject.update({ where: { id: project.id }, data: { managerId: manager.id } });
      }
      console.log(`[Seed] Assigned managers to ${unassigned.length} unassigned projects`);
    }
    return await prisma.pmProject.findMany();
  }

  // Managers disponibles del módulo (planificadores + gestión) para asignar a los proyectos
  const pmRoles = await prisma.pmRole.findMany({
    where: { code: { in: ['PM_PLANIFICADOR', 'PM_GESTION'] } },
  });
  const managers = await prisma.pmModuleUser.findMany({
    where: { pm_user_roles: { some: { roleId: { in: pmRoles.map((r) => r.id) } } } },
  });

  const projectTypes = [
    'Implementación de ERP',
    'Auditoría de Sistemas',
    'Desarrollo de Software a Medida',
    'Consultoría en Ciberseguridad',
    'Migración a la Nube',
    'Optimización de Base de Datos',
    'Reingeniería de Procesos',
    'Infraestructura de Redes',
    'Soporte Técnico Especializado',
    'Capacitación de Personal IT'
  ];

  const statuses: PmProjectStatus[] = [
    'PLANNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED'
  ];

  // Proyectos por empresa
  const projectsPerCompany = 4;
  let projectCount = 0;

  for (const company of companies) {
    for (let i = 0; i < projectsPerCompany; i++) {
      const type = faker.helpers.arrayElement(projectTypes);
      const fullName = `${type} - ${company.name}`;
      const shortName = `${type.split(' ')[0]} ${company.name.split(' ')[0]}`;
      const code = `PRJ-${faker.string.alphanumeric(5).toUpperCase()}`;

      // Fechas controladas: 2-3 meses de duración
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Empezó 1 mes atrás
      const durationDays = faker.number.int({ min: 60, max: 90 }); // 2-3 meses
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      const offeredAmount = faker.number.int({ min: 50000, max: 200000 });
      const estimatedCost = Math.round(offeredAmount * 0.7); // 70% del offered

      // Asignar manager aleatorio (del módulo) si hay planificadores/gestión disponibles
      const manager = managers.length > 0
        ? faker.helpers.arrayElement(managers)
        : null;

      await prisma.pmProject.upsert({
        where: { code },
        update: {},
        create: {
          code,
          fullName,
          shortName,
          description: faker.commerce.productDescription(),
          companyId: company.id,
          managerId: manager?.id ?? null,
          status: faker.helpers.arrayElement(statuses),
          startDate,
          endDate,
          offeredAmount,
          estimatedCost,
        },
      });
      projectCount++;
    }
  }

  const allProjects = await prisma.pmProject.findMany();
  console.log('[Seed] Projects seeded:', allProjects.length);

  return allProjects;
}
