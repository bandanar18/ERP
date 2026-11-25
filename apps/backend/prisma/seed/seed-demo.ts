import { prisma } from '../../src/config/database';

/**
 * Seed de DEMOSTRACIÓN COMPLETA — pnpm --filter backend db:seed:demo
 *
 * Ejecuta el pipeline completo en el orden correcto de dependencias:
 *
 *  1. seedRoles                 → roles ERP + roles PM (y QC se auto-siembra)
 *  2. seedCompanies             → 20 empresas con logos (logo.dev / ui-avatars)
 *  3. seedUsers                 → 53 usuarios ERP con Password123!
 *  4. seedAdminGestionTestUsers → admin@test.com / gestion@test.com (Password123!)
 *  5. seedPmModule              → permisos PM + 7 usuarios del módulo con username
 *  6. seedProjects              → ~80 proyectos con manager asignado
 *  7. seedPlannerTestUser       → planificadores ERP + módulo (Username123!→Password123!)
 *  8. seedPhysicalProgress      → historial de avance físico por proyecto
 *  9. seedCostPlannings         → costos semanales por proyecto (pm_cost_plannings)
 * 10. seedFinancialValuations   → valuaciones financieras por proyecto
 * 11. seedGallery               → imágenes reales (picsum) en la galería
 * 11b. seedPayables           → obligaciones, pagos, gastos y cobranzas
 * 12. seedQcModule              → módulo QC completo (usuarios, indicadores, mediciones)
 *
 * TODOS los usuarios demo usan la contraseña: Password123!
 *
 * Idempotencia: las tablas transaccionales del PM (gallery, valuations, costs,
 * progress, projects) se limpian al inicio para re-ejecutar sin duplicados.
 * El seed QC ya es idempotente por diseño (deleteMany de tablas qc_*).
 */
async function main() {
  console.log('[Seed Demo] ========================================');
  console.log('[Seed Demo] Iniciando semilla de demostración');
  console.log('[Seed Demo] Contraseña unificada: Password123!');
  console.log('[Seed Demo] ========================================');

  // ── 0. Limpiar datos transaccionales del módulo PM ─────────────────────
  console.log('  Clearing transactional PM data...');
  await prisma.pmGalleryFile.deleteMany({});
  await prisma.pmFinancialValuation.deleteMany({});
  await prisma.pmCostPlanning.deleteMany({});
  await prisma.pmPhysicalProgress.deleteMany({});
  await prisma.pmProject.deleteMany({});
  console.log('  [OK] Transactional PM data cleared');

  // ── 1. Roles (ERP + PM) ────────────────────────────────────────────────
  const { seedRoles } = await import('./roles');
  await seedRoles(prisma);

  // ── 2. Empresas con logos ──────────────────────────────────────────────
  const { seedCompanies } = await import('./companies');
  await seedCompanies(prisma);

  // ── 3. Usuarios ERP genéricos (Password123!) ───────────────────────────
  const { seedUsers } = await import('./users');
  await seedUsers(prisma);

  // ── 4. Usuarios de prueba ERP (admin/gestion) ──────────────────────────
  const { seedAdminGestionTestUsers } = await import('./admin-gestion-test-user');
  await seedAdminGestionTestUsers(prisma);

  // ── 5. Módulo Project Management (permisos + usuarios con username) ────
  const { seedPmModule } = await import('./project-management');
  await seedPmModule(prisma);

  // ── 6. Proyectos con manager asignado ──────────────────────────────────
  const { seedProjects } = await import('./projects');
  await seedProjects(prisma);

  // ── 7. Planificadores de prueba (asignan managers adicionales) ─────────
  const { seedPlannerTestUser } = await import('./planner-test-user');
  await seedPlannerTestUser(prisma);

  // ── 8. Historial de avance físico ──────────────────────────────────────
  const { seedPhysicalProgress } = await import('./physical-progress');
  await seedPhysicalProgress(prisma);

  // ── 9. Costos planificados (pm_cost_plannings) ─────────────────────────
  const { seedCostPlannings } = await import('./cost-planning');
  await seedCostPlannings(prisma);

  // ── 10. Valuaciones financieras ────────────────────────────────────────
  const { seedFinancialValuations } = await import('./financial-valuations');
  await seedFinancialValuations(prisma);

  // ── 11. Galería de archivos con imágenes ───────────────────────────────
  const { seedGallery } = await import('./gallery');
  await seedGallery(prisma);

  // ── 11b. Cuentas por pagar, gastos y cobranzas ─────────────────────────
  const { seedPayables } = await import('./payables');
  await seedPayables(prisma);

  // ── 12. Módulo Quality Control completo ────────────────────────────────
  const { seedQcModule } = await import('./quality-control');
  await seedQcModule(prisma);

  // ── Resumen final ──────────────────────────────────────────────────────
  const [companies, projects, progress, costs, valuations, gallery, pmUsers, qcUsers] =
    await Promise.all([
      prisma.pmCompany.count(),
      prisma.pmProject.count(),
      prisma.pmPhysicalProgress.count(),
      prisma.pmCostPlanning.count(),
      prisma.pmFinancialValuation.count(),
      prisma.pmGalleryFile.count(),
      prisma.pmModuleUser.count(),
      prisma.qcUser.count(),
    ]);

  console.log('');
  console.log('[Seed Demo] ========================================');
  console.log('[Seed Demo] RESUMEN FINAL');
  console.log('[Seed Demo] ----------------------------------------');
  console.log(`  PM: ${companies} empresas | ${projects} proyectos | ${progress} avances`);
  console.log(`  PM: ${costs} costos | ${valuations} valuaciones | ${gallery} archivos galería`);
  console.log(`  PM: ${pmUsers} usuarios del módulo`);
  console.log(`  QC: ${qcUsers} usuarios del módulo`);
  console.log('[Seed Demo] ----------------------------------------');
  console.log('[Seed Demo] Accesos demo (contraseña: Password123!):');
  console.log('   Módulo Gestión de Proyectos: admin@test.com (admin) | gestion@test.com (gestion) | planificador1@test.com (planificador1)');
  console.log('   Módulo Gestión de Calidad:   admin@test.com (admin) | qc.direccion | qc.finanzas | qc.operaciones');
  console.log('[Seed Demo] ========================================');
}

main()
  .catch((e) => {
    console.error('[Seed Demo] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
