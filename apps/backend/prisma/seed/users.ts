import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

/**
 * Seed de usuarios ERP genéricos (erp_users).
 *
 * Crea ~53 usuarios repartidos entre los roles ERP existentes, todos con la
 * contraseña `Password123!`. Idempotente: si ya hay suficientes usuarios no
 * crea más, y usa upsert por email.
 */
export async function seedUsers(prisma: PrismaClient, total = 53) {
  console.log('  Seeding ERP users...');

  const existing = await prisma.erpUser.count();
  if (existing >= total) {
    console.log(`[Seed] ERP users already present (${existing}), skipping...`);
    return;
  }

  const roles = await prisma.erpRole.findMany();
  if (roles.length === 0) {
    console.log('[Seed] Warning: no ERP roles found. Run seedRoles first.');
    return;
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);
  faker.seed(53);

  let created = 0;
  for (let i = existing; i < total; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const role = roles[i % roles.length];

    await prisma.erpUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        roleId: role.id,
        isActive: true,
        emailVerified: true,
      },
    });
    created++;
  }

  console.log(`[Seed] ${created} ERP users created (Password123!)`);
}
