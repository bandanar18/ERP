import * as bcrypt from 'bcryptjs';
export async function seedAdminGestionTestUsers(prisma) {
    // Rol Administrador
    const adminRole = await prisma.role.findFirst({
        where: { name: { equals: 'administrador', mode: 'insensitive' } },
    });
    if (adminRole) {
        await prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: {},
            create: {
                email: 'admin@test.com',
                password: await bcrypt.hash('Admin123!', 10),
                firstName: 'Admin',
                lastName: 'Test',
                role: { connect: { id: adminRole.id } },
                isActive: true,
                emailVerified: true,
            },
        });
        console.log('[Seed] Admin test user created: admin@test.com / Admin123!');
    }
    // Rol Gestión
    const gestionRole = await prisma.role.findFirst({
        where: { name: { equals: 'gestion', mode: 'insensitive' } },
    });
    if (gestionRole) {
        await prisma.user.upsert({
            where: { email: 'gestion@test.com' },
            update: {},
            create: {
                email: 'gestion@test.com',
                password: await bcrypt.hash('Gestion123!', 10),
                firstName: 'Gestión',
                lastName: 'Test',
                role: { connect: { id: gestionRole.id } },
                isActive: true,
                emailVerified: true,
            },
        });
        console.log('[Seed] Gestión test user created: gestion@test.com / Gestion123!');
    }
}
