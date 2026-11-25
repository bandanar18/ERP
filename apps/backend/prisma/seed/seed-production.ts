/**
 * Seed de Producción
 *
 * Crea únicamente:
 * - Roles del sistema
 * - Un usuario de gestión inicial (credenciales por env vars)
 *
 * NO crea datos de prueba ni empresas/proyectos.
 */
import { prisma } from '../../src/config/database';
import * as bcrypt from 'bcryptjs';

// Configuración desde variables de entorno
const GESTION_EMAIL = process.env.SEED_GESTION_EMAIL || 'gestion@test.com';
const GESTION_PASSWORD = process.env.SEED_GESTION_PASSWORD || 'Password123!';
const GESTION_FIRST_NAME = process.env.SEED_GESTION_FIRST_NAME || 'Usuario';
const GESTION_LAST_NAME = process.env.SEED_GESTION_LAST_NAME || 'Gestión';

/**
 * Roles del sistema - NO modificar estos roles
 * Están hardcodeados porque son estructurales para la aplicación
 */
const SYSTEM_ROLES = [
  'planificador',
  'direccion',
  'gestion',
  'administrador',
  'procura',
  'procedimiento comercial',
  'Administracion de Contratos',
] as const;

async function seedRoles(prisma: typeof import('@prisma/client').PrismaClient) {
  console.log('[PROD-SEED] Creating roles...');

  for (const roleName of SYSTEM_ROLES) {
    await prisma.erpRole.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const count = await prisma.erpRole.count();
  console.log(`[PROD-SEED] ✓ ${count} ERP roles created`);

  // Roles del módulo Project Management (campo code)
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

  const pmCount = await prisma.pmRole.count();
  console.log(`[PROD-SEED] ✓ ${pmCount} PM roles created`);

  // Retornar el rol gestión ERP para conectar al usuario
  return prisma.erpRole.findUnique({
    where: { name: 'gestion' },
  }) as Promise<{ id: string } | null>;
}

async function seedGestionUser(prisma: typeof import('@prisma/client').PrismaClient) {
  console.log('[PROD-SEED] Creating gestión user...');

  const gestionRole = await prisma.erpRole.findUnique({
    where: { name: 'gestion' },
  });

  if (!gestionRole) {
    throw new Error('[PROD-SEED] ERROR: Gestion role not found. Run roles seed first.');
  }

  const hashedPassword = await bcrypt.hash(GESTION_PASSWORD, 10);

  const user = await prisma.erpUser.upsert({
    where: { email: GESTION_EMAIL },
    update: {
      password: hashedPassword,
      firstName: GESTION_FIRST_NAME,
      lastName: GESTION_LAST_NAME,
      isActive: true,
      emailVerified: true,
      roleId: gestionRole.id,
    },
    create: {
      email: GESTION_EMAIL,
      password: hashedPassword,
      firstName: GESTION_FIRST_NAME,
      lastName: GESTION_LAST_NAME,
      isActive: true,
      emailVerified: true,
      role: { connect: { id: gestionRole.id } },
    },
  });

  console.log(`[PROD-SEED] ✓ Gestion user created:`);
  console.log(`           Email: ${GESTION_EMAIL}`);
  console.log(`           Password: ${GESTION_PASSWORD} (CHANGE THIS!)`);
}

async function main() {
  console.log('[PROD-SEED] ========================================');
  console.log('[PROD-SEED] Production Seed Started');
  console.log('[PROD-SEED] ========================================');
  console.log('[PROD-SEED] Environment:', process.env.NODE_ENV || 'unknown');
  console.log('[PROD-SEED] Database:', process.env.DATABASE_URL?.split('@')?.[1] || 'unknown');
  console.log('');

  try {
    // 1. Crear roles
    await seedRoles(prisma);

    // 2. Crear usuario gestión
    await seedGestionUser(prisma);

    console.log('');
    console.log('[PROD-SEED] ========================================');
    console.log('[PROD-SEED] ✓ Production Seed Completed!');
    console.log('[PROD-SEED] ========================================');
    console.log('[PROD-SEED] IMPORTANT: Change gestión password immediately!');
    console.log('');
  } catch (error) {
    console.error('[PROD-SEED] ✗ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('[PROD-SEED] Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
