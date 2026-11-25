import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Seed del módulo Project Management.
 *
 * Crea:
 *  - Permisos del módulo (pm_permissions)
 *  - Mapeos rol → permisos (pm_role_permissions)
 *  - Usuarios del módulo (pm_users) enlazados a los usuarios ERP (externalId)
 *
 * Usuarios demo (contraseña unificada `Password123!` para todos):
 *  - admin          (PM_ADMIN)
 *  - gestion        (PM_GESTION)
 *  - planificador1  (PM_PLANIFICADOR)
 *  - planificador2  (PM_PLANIFICADOR)
 *  - direccion      (PM_DIRECCION)
 *  - gestion.operaciones (PM_GESTION)
 *  - planificador.obras  (PM_PLANIFICADOR)
 */
export async function seedPmModule(prisma: PrismaClient) {
  console.log('  Seeding project-management module...');

  // 1. Permisos del módulo
  const permissions = [
    { code: 'PM_PROJECTS_READ', description: 'Ver proyectos' },
    { code: 'PM_PROJECTS_WRITE', description: 'Crear/editar proyectos' },
    { code: 'PM_COMPANIES_READ', description: 'Ver empresas' },
    { code: 'PM_COMPANIES_WRITE', description: 'Crear/editar empresas' },
    { code: 'PM_USERS_READ', description: 'Ver usuarios del módulo' },
    { code: 'PM_USERS_WRITE', description: 'Gestionar usuarios del módulo' },
    { code: 'PM_PHYSICAL_READ', description: 'Ver avances físicos' },
    { code: 'PM_PHYSICAL_WRITE', description: 'Registrar avances físicos' },
    { code: 'PM_FINANCIAL_READ', description: 'Ver valuaciones financieras' },
    { code: 'PM_FINANCIAL_WRITE', description: 'Gestionar valuaciones' },
    { code: 'PM_COSTS_READ', description: 'Ver costos' },
    { code: 'PM_COSTS_WRITE', description: 'Gestionar costos' },
    { code: 'PM_GALLERY_READ', description: 'Ver galería de archivos' },
    { code: 'PM_GALLERY_WRITE', description: 'Subir/eliminar archivos' },
    { code: 'PM_PAYABLES_READ', description: 'Ver cuentas por pagar' },
    { code: 'PM_PAYABLES_WRITE', description: 'Gestionar cuentas por pagar' },
  ];

  const permissionIds: Record<string, string> = {};
  for (const perm of permissions) {
    const created = await prisma.pmPermission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: { id: randomUUID(), ...perm },
    });
    permissionIds[perm.code] = created.id;
  }
  console.log(`[Seed] PM permissions: ${permissions.length}`);

  // 2. Mapeos rol → permisos
  const rolePermissions: Record<string, string[]> = {
    PM_ADMIN: permissions.map((p) => p.code),
    PM_GESTION: [
      'PM_PROJECTS_READ', 'PM_PROJECTS_WRITE',
      'PM_COMPANIES_READ', 'PM_COMPANIES_WRITE',
      'PM_USERS_READ', 'PM_USERS_WRITE',
      'PM_PHYSICAL_READ', 'PM_PHYSICAL_WRITE',
      'PM_FINANCIAL_READ', 'PM_FINANCIAL_WRITE',
      'PM_COSTS_READ', 'PM_COSTS_WRITE',
      'PM_GALLERY_READ', 'PM_GALLERY_WRITE',
      'PM_PAYABLES_READ',
    ],
    PM_PLANIFICADOR: [
      'PM_PROJECTS_READ', 'PM_COMPANIES_READ',
      'PM_PHYSICAL_READ', 'PM_PHYSICAL_WRITE',
      'PM_FINANCIAL_READ', 'PM_COSTS_READ',
      'PM_GALLERY_READ', 'PM_GALLERY_WRITE',
    ],
    PM_DIRECCION: [
      'PM_PROJECTS_READ', 'PM_COMPANIES_READ',
      'PM_PHYSICAL_READ', 'PM_FINANCIAL_READ',
      'PM_COSTS_READ', 'PM_GALLERY_READ',
    ],
    PM_ADMIN_FINANCIERO: [
      'PM_PROJECTS_READ',
      'PM_COMPANIES_READ',
      'PM_FINANCIAL_READ',
      'PM_COSTS_READ',
      'PM_PAYABLES_READ',
      'PM_PAYABLES_WRITE',
    ],
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
    const role = await prisma.pmRole.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    // Eliminar permisos obsoletos que ya no corresponden a este rol
    const validPermissionIds = permCodes.map((c) => permissionIds[c]).filter(Boolean);
    await prisma.pmRolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: validPermissionIds },
      },
    });

    for (const permCode of permCodes) {
      const permissionId = permissionIds[permCode];
      if (!permissionId) continue;

      await prisma.pmRolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
  console.log('[Seed] PM role-permissions linked');

  // 3. Usuarios del módulo enlazados a usuarios ERP (externalId)
  //    Password unificada para TODOS: Password123!
  const demoPassword = 'Password123!';
  const demoHash = await bcrypt.hash(demoPassword, 10);

  const moduleUsers = [
    {
      email: 'admin@test.com',
      username: 'admin',
      password: demoPassword,
      roleCode: 'PM_ADMIN',
      firstName: 'Admin',
      lastName: 'ERP',
    },
    {
      email: 'gestion@test.com',
      username: 'gestion',
      password: demoPassword,
      roleCode: 'PM_GESTION',
      firstName: 'Gestión',
      lastName: 'Proyectos',
    },
    {
      email: 'planificador1@test.com',
      username: 'planificador1',
      password: demoPassword,
      roleCode: 'PM_PLANIFICADOR',
      firstName: 'Carlos',
      lastName: 'Planificador',
    },
    {
      email: 'planificador2@test.com',
      username: 'planificador2',
      password: demoPassword,
      roleCode: 'PM_PLANIFICADOR',
      firstName: 'María',
      lastName: 'Planificadora',
    },
    {
      email: 'direccion@test.com',
      username: 'direccion',
      password: demoPassword,
      roleCode: 'PM_DIRECCION',
      firstName: 'Dirección',
      lastName: 'Corporativa',
    },
    {
      email: 'gestion.operaciones@test.com',
      username: 'gestion.operaciones',
      password: demoPassword,
      roleCode: 'PM_GESTION',
      firstName: 'Operaciones',
      lastName: 'Gestión',
    },
    {
      email: 'planificador.obras@test.com',
      username: 'planificador.obras',
      password: demoPassword,
      roleCode: 'PM_PLANIFICADOR',
      firstName: 'Obras',
      lastName: 'Planificación',
    },
  ];

  for (const mu of moduleUsers) {
    const erpUser = await prisma.erpUser.findUnique({ where: { email: mu.email } });
    const pmRole = await prisma.pmRole.findUnique({ where: { code: mu.roleCode } });
    if (!pmRole) continue;

    // El externalId solo se asigna en create si el ERP user existe Y su id no está
    // ya enlazado a otro usuario del módulo (evita violaciones de unique en corridas
    // previas o con datos pre-existentes en pm_users).
    const externalIdTaken = erpUser
      ? await prisma.pmModuleUser.findFirst({ where: { externalId: erpUser.id } })
      : null;
    const safeExternalId = erpUser && !externalIdTaken ? erpUser.id : null;

    // Guardia anti-P2002: si otro usuario del módulo ya usa este username
    // (p. ej. creado por registro), no lo pisamos en el update.
    const usernameTaken = await prisma.pmModuleUser.findFirst({
      where: { username: mu.username, email: { not: mu.email } },
    });

    const pmUser = await prisma.pmModuleUser.upsert({
      where: { email: mu.email },
      update: {
        status: 'ACTIVE',
        username: usernameTaken ? undefined : mu.username,
        password: demoHash,
        firstName: mu.firstName ?? erpUser?.firstName ?? null,
        lastName: mu.lastName ?? erpUser?.lastName ?? null,
      },
      create: {
        email: mu.email,
        username: mu.username,
        password: demoHash,
        externalId: safeExternalId,
        firstName: mu.firstName ?? erpUser?.firstName ?? null,
        lastName: mu.lastName ?? erpUser?.lastName ?? null,
        status: 'ACTIVE',
      },
    });

    await prisma.pmUserRole.upsert({
      where: { userId_roleId: { userId: pmUser.id, roleId: pmRole.id } },
      update: {},
      create: { userId: pmUser.id, roleId: pmRole.id },
    });
  }

  // 3b. Unificar contraseña del resto de usuarios del módulo (si quedaron de
  //     corridas anteriores con otra clave) a Password123!
  const allModuleUsers = await prisma.pmModuleUser.findMany({ select: { id: true } });
  await prisma.pmModuleUser.updateMany({
    where: { id: { in: allModuleUsers.map((u) => u.id) } },
    data: { password: demoHash },
  });

  console.log(`[Seed] PM module users: ${moduleUsers.length} demo users (password: ${demoPassword})`);
}

// Ejecución standalone: pnpm --filter backend db:seed:pm
// Garantiza roles (ERP + módulo) antes de crear permisos y usuarios del módulo.
const isDirectRun = process.argv[1] && process.argv[1].endsWith('project-management.ts');
if (isDirectRun) {
  import('../../src/config/database')
    .then(async ({ prisma }) => {
      const { seedRoles } = await import('./roles');
      await seedRoles(prisma);
      await seedPmModule(prisma);
    })
    .catch((e) => {
      console.error('[Seed PM] Failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      const { prisma } = await import('../../src/config/database');
      await prisma.$disconnect();
      process.exit(0);
    });
}
