import { prisma } from '../../src/config/database';
import { seedRoles } from './roles';
import * as bcrypt from 'bcryptjs';
async function main() {
    console.log('[Seed] Starting...');
    // Sembrar solo los roles
    await seedRoles(prisma);
    // Sembrar UN SOLO USUARIO (Gestión)
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
                firstName: 'Usuario',
                lastName: 'Gestión',
                role: { connect: { id: gestionRole.id } },
                isActive: true,
                emailVerified: true,
            },
        });
        console.log('[Seed] Gestion user created: gestion@test.com / Gestion123!');
    }
    console.log('[Seed] Completed!');
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
