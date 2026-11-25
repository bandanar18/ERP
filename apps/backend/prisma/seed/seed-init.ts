import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '../../src/config/database';

/**
 * Seed de INICIALIZACIÓN — `prisma db seed` / `pnpm --filter backend db:seed`
 *
 * Crea SOLO lo mínimo necesario para inicializar los módulos con un único
 * usuario admin por módulo (todos con la misma contraseña `Password123!`):
 *
 *   - ERP (users):            admin@test.com        → rol `administrador`
 *   - Project Management:     admin / admin@test.com → rol PM_ADMIN (+ permisos)
 *   - Quality Control:        admin / admin@test.com → rol QC_ADMIN (+ permisos)
 *   - Ejecutivo (opcional):   admin@test.com        → rol ADMIN (+ permisos)
 *     Solo se crea si el modelo `executive*` existe en el cliente Prisma
 *     generado (el módulo fue removido del schema en algunas ramas).
 *
 * NO crea empresas, proyectos, indicadores ni datos demo: cada módulo se
 * inicializa desde su propia UI con este único admin.
 *
 * Idempotente: usa upserts en todo. Se puede re-ejecutar sin duplicados.
 */
async function main() {
  console.log('[Seed Init] ========================================');
  console.log('[Seed Init] Iniciando seed de inicialización');
  console.log('[Seed Init] Contraseña unificada: Password123!');
  console.log('[Seed Init] ========================================');

  const DEMO_PASSWORD = 'Password123!';
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── 1. ERP: roles + usuario admin ─────────────────────────────────────
  console.log('  [1/3] ERP (users)...');

  const erpRoles = [
    'planificador',
    'direccion',
    'gestion',
    'administrador',
    'procura',
    'procedimiento comercial',
    'Administracion de Contratos',
  ];
  for (const name of erpRoles) {
    await prisma.erpRole.upsert({ where: { name }, update: {}, create: { name } });
  }
  const adminRole = await prisma.erpRole.findUnique({ where: { name: 'administrador' } });
  if (!adminRole) throw new Error('Rol "administrador" no encontrado');

  const erpAdmin = await prisma.erpUser.upsert({
    where: { email: 'admin@test.com' },
    update: {
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ERP',
      roleId: adminRole.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: 'admin@test.com',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ERP',
      roleId: adminRole.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('  [OK] admin@test.com / Password123! (administrador)');

  // ── 2. Project Management: roles + permisos + admin ───────────────────
  console.log('  [2/3] Project Management (pm_users)...');

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

  const pmPermissions = [
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
  ];
  const pmPermissionIds: Record<string, string> = {};
  for (const perm of pmPermissions) {
    const created = await prisma.pmPermission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: { id: randomUUID(), ...perm },
    });
    pmPermissionIds[perm.code] = created.id;
  }

  const pmAdminRole = await prisma.pmRole.findUnique({ where: { code: 'PM_ADMIN' } });
  if (!pmAdminRole) throw new Error('Rol PM_ADMIN no encontrado');
  for (const perm of pmPermissions) {
    await prisma.pmRolePermission.upsert({
      where: { roleId_permissionId: { roleId: pmAdminRole.id, permissionId: pmPermissionIds[perm.code]! } },
      update: {},
      create: { roleId: pmAdminRole.id, permissionId: pmPermissionIds[perm.code]! },
    });
  }

  const pmAdmin = await prisma.pmModuleUser.upsert({
    where: { email: 'admin@test.com' },
    update: {
      username: 'admin',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ERP',
      externalId: erpAdmin.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: 'admin@test.com',
      username: 'admin',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ERP',
      externalId: erpAdmin.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.pmUserRole.upsert({
    where: { userId_roleId: { userId: pmAdmin.id, roleId: pmAdminRole.id } },
    update: {},
    create: { userId: pmAdmin.id, roleId: pmAdminRole.id },
  });
  console.log('  [OK] admin / admin@test.com / Password123! (PM_ADMIN)');

  // ── 3. Quality Control: organización + roles + permisos + admin ───────
  console.log('  [3/3] Quality Control (qc_users)...');

  const qcOrg = await prisma.qcOrganization.upsert({
    where: { code: 'CORP_MAIN' },
    update: {},
    create: { code: 'CORP_MAIN', name: 'Corporación Principal' },
  });

  const qcRoles = [
    { code: 'QC_ADMIN', description: 'Administrador del Sistema de Calidad' },
    { code: 'QC_DIRECTOR', description: 'Director Ejecutivo' },
    { code: 'QC_OWNER', description: 'Dueño de Proceso' },
  ];
  for (const r of qcRoles) {
    await prisma.qcRole.upsert({ where: { code: r.code }, update: {}, create: r });
  }

  const qcPermissions = [
    { code: 'QC_VIEW_DASHBOARD', description: 'Ver dashboard principal' },
    { code: 'QC_SUBMIT_MEASUREMENT', description: 'Cargar medición' },
    { code: 'QC_MANAGE_USERS', description: 'Gestionar usuarios' },
    { code: 'QC_MANAGE_STRUCTURE', description: 'Gestionar estructura organizacional' },
    { code: 'QC_MANAGE_INDICATORS', description: 'Gestionar indicadores y metas' },
    { code: 'QC_MANAGE_PERIODS', description: 'Gestionar períodos de medición' },
    { code: 'QC_REVIEW_MEASUREMENTS', description: 'Revisar y aprobar mediciones' },
    { code: 'QC_VIEW_REPORTS', description: 'Consultar informes consolidados' },
    { code: 'QC_VIEW_AUDIT_LOG', description: 'Consultar bitácora de auditoría' },
  ];
  const qcAdminRole = await prisma.qcRole.findUnique({ where: { code: 'QC_ADMIN' } });
  if (!qcAdminRole) throw new Error('Rol QC_ADMIN no encontrado');
  for (const p of qcPermissions) {
    const perm = await prisma.qcPermission.upsert({ where: { code: p.code }, update: {}, create: p });
    await prisma.qcRolePermission.upsert({
      where: { roleId_permissionId: { roleId: qcAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: qcAdminRole.id, permissionId: perm.id },
    });
  }

  const qcAdmin = await prisma.qcUser.upsert({
    where: { email: 'admin@test.com' },
    update: {
      username: 'admin',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ERP',
      externalId: erpAdmin.id,
      organizationId: qcOrg.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: 'admin@test.com',
      username: 'admin',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ERP',
      externalId: erpAdmin.id,
      organizationId: qcOrg.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.qcUserRole.upsert({
    where: { userId_roleId: { userId: qcAdmin.id, roleId: qcAdminRole.id } },
    update: {},
    create: { userId: qcAdmin.id, roleId: qcAdminRole.id },
  });
  console.log('  [OK] admin / admin@test.com / Password123! (QC_ADMIN)');

  // ── 4. Ejecutivo (opcional): solo si el modelo existe en el cliente ────
  const prismaAny = prisma as any;
  const hasExecutiveModels =
    typeof prismaAny.executiveOrganization === 'object' &&
    typeof prismaAny.executiveUser === 'object' &&
    typeof prismaAny.executiveRole === 'object';

  if (hasExecutiveModels) {
    console.log('  [4/4] Ejecutivo (executive_user)...');

    const execOrg = await prismaAny.executiveOrganization.upsert({
      where: { code: 'CORP_MAIN' },
      update: {},
      create: { code: 'CORP_MAIN', name: 'Corporación Principal' },
    });

    const execRoles = [
      { code: 'ADMIN', description: 'Administrador del Sistema' },
      { code: 'DIRECTOR', description: 'Director Ejecutivo' },
      { code: 'PROCESS_OWNER', description: 'Dueño de Proceso' },
    ];
    for (const r of execRoles) {
      await prismaAny.executiveRole.upsert({ where: { code: r.code }, update: {}, create: r });
    }

    const execPermissions = [
      { code: 'VIEW_DASHBOARD', description: 'Ver dashboard principal' },
      { code: 'SUBMIT_MEASUREMENT', description: 'Cargar medición' },
      { code: 'MANAGE_USERS', description: 'Gestionar usuarios' },
      { code: 'MANAGE_STRUCTURE', description: 'Gestionar estructura organizacional' },
      { code: 'MANAGE_INDICATORS', description: 'Gestionar indicadores y metas' },
      { code: 'MANAGE_PERIODS', description: 'Gestionar períodos de medición' },
      { code: 'REVIEW_MEASUREMENTS', description: 'Revisar y aprobar mediciones' },
      { code: 'VIEW_REPORTS', description: 'Consultar informes consolidados' },
      { code: 'VIEW_AUDIT_LOG', description: 'Consultar bitácora de auditoría' },
    ];
    const execAdminRole = await prismaAny.executiveRole.findUnique({ where: { code: 'ADMIN' } });
    if (!execAdminRole) throw new Error('Rol ADMIN no encontrado');
    for (const p of execPermissions) {
      const perm = await prismaAny.executivePermission.upsert({ where: { code: p.code }, update: {}, create: p });
      await prismaAny.executiveRolePermission.upsert({
        where: { roleId_permissionId: { roleId: execAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: execAdminRole.id, permissionId: perm.id },
      });
    }

    await prismaAny.executiveUser.upsert({
      where: { email: 'admin@test.com' },
      update: {
        password: passwordHash,
        externalId: erpAdmin.id,
        organizationId: execOrg.id,
        status: 'ACTIVE',
      },
      create: {
        email: 'admin@test.com',
        password: passwordHash,
        externalId: erpAdmin.id,
        organizationId: execOrg.id,
        status: 'ACTIVE',
      },
    });
    const execAdmin = await prismaAny.executiveUser.findUnique({ where: { email: 'admin@test.com' } });
    if (!execAdmin) throw new Error('Usuario ejecutivo no encontrado');
    await prismaAny.executiveUserRole.upsert({
      where: { userId_roleId: { userId: execAdmin.id, roleId: execAdminRole.id } },
      update: {},
      create: { userId: execAdmin.id, roleId: execAdminRole.id },
    });
    console.log('  [OK] admin@test.com / Password123! (ADMIN)');
  } else {
    console.log('  [SKIP] Ejecutivo — modelo executive* no presente en el schema generado');
  }

  console.log('[Seed Init] ========================================');
  console.log('[Seed Init] RESUMEN — un admin por módulo (Password123!):');
  console.log('   ERP:              admin@test.com');
  console.log('   Project Mgmt:     admin / admin@test.com');
  console.log('   Quality Control:  admin / admin@test.com');
  if (hasExecutiveModels) console.log('   Ejecutivo:        admin@test.com');
  console.log('[Seed Init] ========================================');
}

main()
  .catch((e) => {
    console.error('[Seed Init] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
