import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedAdminGestionTestUsers(prisma: PrismaClient) {
  const demoPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Rol Administrador (ERP legacy — campo name)
  const adminRole = await prisma.erpRole.findFirst({
    where: { name: { equals: 'administrador', mode: 'insensitive' } },
  });

  if (adminRole) {
    await prisma.erpUser.upsert({
      where: { email: 'admin@test.com' },
      update: { password: passwordHash },
      create: {
        email: 'admin@test.com',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'ERP',
        role: { connect: { id: adminRole.id } },
        isActive: true,
        emailVerified: true,
      },
    });
    console.log('[Seed] Admin test user created: admin@test.com / Password123!');
  }

  // Rol Gestión (ERP legacy — campo name)
  const gestionRole = await prisma.erpRole.findFirst({
    where: { name: { equals: 'gestion', mode: 'insensitive' } },
  });

  if (gestionRole) {
    await prisma.erpUser.upsert({
      where: { email: 'gestion@test.com' },
      update: { password: passwordHash },
      create: {
        email: 'gestion@test.com',
        password: passwordHash,
        firstName: 'Gestión',
        lastName: 'Proyectos',
        role: { connect: { id: gestionRole.id } },
        isActive: true,
        emailVerified: true,
      },
    });
    console.log('[Seed] Gestión test user created: gestion@test.com / Password123!');
  }
}
