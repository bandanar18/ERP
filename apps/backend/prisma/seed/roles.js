export async function seedRoles(prisma) {
    console.log('  Seeding roles...');
    const roles = [
        { name: 'planificador' },
        { name: 'direccion' },
        { name: 'gestion' },
        { name: 'administrador' },
        { name: 'procura' },
        { name: 'procedimiento comercial' },
        { name: 'Administracion de Contratos' },
    ];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }
    const allRoles = await prisma.role.findMany();
    console.log('[Seed] Roles seeded:', allRoles.length);
    return allRoles;
}
