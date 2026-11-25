import { prisma } from '../../src/config/database';
import { seedRoles } from './roles';
import { seedExecutive } from './executive';
import { seedCompanies } from './companies';
import { seedUsers } from './users';
import { seedAdminGestionTestUsers } from './admin-gestion-test-user';
import { seedPlannerTestUser } from './planner-test-user';
import { seedPmModule } from './project-management';
import { seedProjects } from './projects';
import { seedPhysicalProgress } from './physical-progress';
import { seedCostPlannings } from './cost-planning';
import { seedFinancialValuations } from './financial-valuations';
import { seedGallery } from './gallery';
import { seedPayables } from './payables';
import { seedQcModule } from './quality-control';

/**
 * Seed principal (`prisma db seed`).
 *
 * Ejecuta la SEMILLA DEMO COMPLETA: roles, empresas, usuarios ERP, módulo PM
 * (usuarios + permisos + proyectos + avances + costos + valuaciones + galería)
 * y módulo Quality Control (usuarios + indicadores + mediciones + historial).
 *
 * Todos los usuarios demo comparten la contraseña: Password123!
 */
async function main() {
  console.log('[Seed] Starting...');

  // 1. Roles ERP + módulos
  await seedRoles(prisma);

  // 2. Empresas con logos
  await seedCompanies(prisma);

  // 3. Usuarios ERP genéricos
  await seedUsers(prisma);

  // 4. Usuarios admin/gestión (ERP) con password unificada
  await seedAdminGestionTestUsers(prisma);

  // 5. Módulo PM: permisos + usuarios demo
  await seedPmModule(prisma);

  // 6. Proyectos con managers
  await seedProjects(prisma);

  // 7. Planificadores de prueba (asigna managers adicionales)
  await seedPlannerTestUser(prisma);

  // 8. Historial de avance físico
  await seedPhysicalProgress(prisma);

  // 9. Historial de costos
  await seedCostPlannings(prisma);

  // 10. Historial de valuaciones financieras
  await seedFinancialValuations(prisma);

  // 11. Galería con imágenes reales
  await seedGallery(prisma);

  // 11b. Cuentas por pagar, gastos y cobranzas
  await seedPayables(prisma);

  // 12. Módulo Quality Control
  await seedQcModule(prisma);

  // Sembrar el MÓDULO EJECUTIVO (Sistema de Seguimiento de Indicadores)
  await seedExecutive(prisma);

  console.log('[Seed] Completed!');
  console.log('[Seed] Demo users password: Password123!');
}

main()
  .catch((e) => {
    console.error('[Seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
