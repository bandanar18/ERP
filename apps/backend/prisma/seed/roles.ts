import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('  Seeding roles...');

  // Roles legacy del ERP (tabla roles, campo name) — usados por User/Role y las features legacy
  const roles = [
    { name: 'planificador' },
    { name: 'direccion' },
    { name: 'gestion' },
    { name: 'administrador' },
    { name: 'procura' },
    { name: 'procedimiento comercial' },
    { name: 'Administracion de Contratos' },
  ];

  for (const role of roles) {
    await prisma.erpRole.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Roles del módulo Project Management (tabla pm_roles, campo code)
  const pmRoles = [
    { code: 'PM_ADMIN', description: 'Administrador del módulo' },
    { code: 'PM_GESTION', description: 'Gestión de proyectos' },
    { code: 'PM_PLANIFICADOR', description: 'Planificador de proyectos' },
    { code: 'PM_DIRECCION', description: 'Dirección / cliente' },
    { code: 'PM_ADMIN_FINANCIERO', description: 'Administrador financiero (cuentas por pagar)' },
  ];

  for (const pmRole of pmRoles) {
    await prisma.pmRole.upsert({
      where: { code: pmRole.code },
      update: { description: pmRole.description },
      create: pmRole,
    });
  }

  const allRoles = await prisma.erpRole.findMany();
  const allPmRoles = await prisma.pmRole.findMany();
  console.log('[Seed] ERP roles:', allRoles.length, '| PM roles:', allPmRoles.length);

  return allRoles;
}
