import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedPlannerTestUser(prisma: PrismaClient) {
  const companies = await prisma.pmCompany.findMany({ take: 3 });

  if (companies.length === 0) {
    return;
  }

  const demoPassword = 'Password123!';

  // Rol ERP legacy para los usuarios ERP
  const erpRole = await prisma.erpRole.findFirst({
    where: { name: { equals: 'planificador', mode: 'insensitive' } },
  });

  // Rol del módulo para los PmModuleUser
  const pmRole = await prisma.pmRole.findUnique({
    where: { code: 'PM_PLANIFICADOR' },
  });

  if (!erpRole || !pmRole) {
    return;
  }

  // Limpiar proyectos asignados a estos planificadores en ejecuciones anteriores
  await prisma.pmProject.updateMany({
    where: {
      pm_users: {
        email: {
          in: ['planificador1@test.com', 'planificador2@test.com'],
        },
      },
    },
    data: { managerId: null },
  });

  // Planificador 1: usuario ERP (tabla users) + usuario del módulo (pm_users) enlazado
  const erpPlanner1 = await prisma.erpUser.upsert({
    where: { email: 'planificador1@test.com' },
    update: { companyId: null, password: await bcrypt.hash(demoPassword, 10) },
    create: {
      email: 'planificador1@test.com',
      password: await bcrypt.hash(demoPassword, 10),
      firstName: 'Carlos',
      lastName: 'Planificador',
      role: { connect: { id: erpRole.id } },
      isActive: true,
      emailVerified: true,
    },
  });

  const planner1 = await prisma.pmModuleUser.upsert({
    where: { email: 'planificador1@test.com' },
    update: {
      externalId: erpPlanner1.id,
      username: 'planificador1',
      password: await bcrypt.hash(demoPassword, 10),
      firstName: 'Carlos',
      lastName: 'Planificador',
    },
    create: {
      email: 'planificador1@test.com',
      username: 'planificador1',
      password: await bcrypt.hash(demoPassword, 10),
      externalId: erpPlanner1.id,
      firstName: 'Carlos',
      lastName: 'Planificador',
      status: 'ACTIVE',
    },
  });

  await prisma.pmUserRole.upsert({
    where: { userId_roleId: { userId: planner1.id, roleId: pmRole.id } },
    update: {},
    create: { userId: planner1.id, roleId: pmRole.id },
  });

  let assigned1 = 0;
  for (const company of companies) {
    const projects = await prisma.pmProject.findMany({
      where: { companyId: company.id, managerId: null },
      orderBy: { code: 'asc' },
      take: 2,
    });

    for (const project of projects) {
      await prisma.pmProject.update({
        where: { id: project.id },
        data: { managerId: planner1.id },
      });
      assigned1++;
    }
  }

  // Planificador 2
  const erpPlanner2 = await prisma.erpUser.upsert({
    where: { email: 'planificador2@test.com' },
    update: { companyId: null, password: await bcrypt.hash(demoPassword, 10) },
    create: {
      email: 'planificador2@test.com',
      password: await bcrypt.hash(demoPassword, 10),
      firstName: 'María',
      lastName: 'Planificadora',
      role: { connect: { id: erpRole.id } },
      isActive: true,
      emailVerified: true,
    },
  });

  const planner2 = await prisma.pmModuleUser.upsert({
    where: { email: 'planificador2@test.com' },
    update: {
      externalId: erpPlanner2.id,
      username: 'planificador2',
      password: await bcrypt.hash(demoPassword, 10),
      firstName: 'María',
      lastName: 'Planificadora',
    },
    create: {
      email: 'planificador2@test.com',
      username: 'planificador2',
      password: await bcrypt.hash(demoPassword, 10),
      externalId: erpPlanner2.id,
      firstName: 'María',
      lastName: 'Planificadora',
      status: 'ACTIVE',
    },
  });

  await prisma.pmUserRole.upsert({
    where: { userId_roleId: { userId: planner2.id, roleId: pmRole.id } },
    update: {},
    create: { userId: planner2.id, roleId: pmRole.id },
  });

  let assigned2 = 0;
  for (const company of companies) {
    const projects = await prisma.pmProject.findMany({
      where: { companyId: company.id, managerId: null },
      orderBy: { code: 'asc' },
      take: 2,
    });

    for (const project of projects) {
      await prisma.pmProject.update({
        where: { id: project.id },
        data: { managerId: planner2.id },
      });
      assigned2++;
    }
  }

  console.log(`[Seed] Planner test users: planificador1@test.com (${assigned1} projects), planificador2@test.com (${assigned2} projects)`);
}
