import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

// Carga el .env de la raíz del monorepo (los scripts se ejecutan desde apps/backend).
dotenv.config({ path: '../../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: [] });

const PASSWORD = 'Password123!';

/** Usuarios de prueba: uno por cada rol del módulo PM. */
const TEST_USERS = [
  { email: 'admin@test.com', username: 'admin', firstName: 'Admin', lastName: 'ERP', role: 'PM_ADMIN' },
  { email: 'gestion@test.com', username: 'gestion', firstName: 'Gestión', lastName: 'Test', role: 'PM_GESTION' },
  { email: 'planificador@test.com', username: 'planificador', firstName: 'Planificador', lastName: 'Test', role: 'PM_PLANIFICADOR' },
  { email: 'direccion@test.com', username: 'direccion', firstName: 'Dirección', lastName: 'Test', role: 'PM_DIRECCION' },
  { email: 'finanzas@test.com', username: 'finanzas', firstName: 'Admin', lastName: 'Financiero', role: 'PM_ADMIN_FINANCIERO' },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const u of TEST_USERS) {
    const role = await prisma.pmRole.findUnique({ where: { code: u.role } });
    if (!role) {
      console.log(`[SKIP] rol ${u.role} no existe — corré primero el seed de inicialización`);
      continue;
    }

    const user = await prisma.pmModuleUser.upsert({
      where: { email: u.email },
      update: { password: passwordHash },
      create: {
        email: u.email,
        username: u.username,
        password: passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    await prisma.pmUserRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    console.log(`[OK] ${u.email} / ${PASSWORD} (${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error('[PM-TEST-USERS] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
