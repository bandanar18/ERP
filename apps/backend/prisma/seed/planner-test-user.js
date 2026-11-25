import * as bcrypt from 'bcryptjs';
export async function seedPlannerTestUser(prisma) {
    const companies = await prisma.company.findMany({ take: 3 });
    if (companies.length === 0) {
        return;
    }
    const role = await prisma.role.findFirst({
        where: { name: { equals: 'planificador', mode: 'insensitive' } },
    });
    if (!role) {
        return;
    }
    // Limpiar proyectos asignados a estos planificadores en ejecuciones anteriores
    await prisma.project.updateMany({
        where: {
            manager: {
                email: {
                    in: ['planificador1@test.com', 'planificador2@test.com'],
                },
            },
        },
        data: { managerId: null },
    });
    // Planificador 1
    const planner1 = await prisma.user.upsert({
        where: { email: 'planificador1@test.com' },
        update: { companyId: null },
        create: {
            email: 'planificador1@test.com',
            password: await bcrypt.hash('Planner123!', 10),
            firstName: 'Carlos',
            lastName: 'Planificador',
            role: { connect: { id: role.id } },
            isActive: true,
            emailVerified: true,
        },
    });
    let assigned1 = 0;
    for (const company of companies) {
        const projects = await prisma.project.findMany({
            where: { companyId: company.id, managerId: null },
            orderBy: { code: 'asc' },
            take: 2,
        });
        for (const project of projects) {
            await prisma.project.update({
                where: { id: project.id },
                data: { managerId: planner1.id },
            });
            assigned1++;
        }
    }
    // Planificador 2
    const planner2 = await prisma.user.upsert({
        where: { email: 'planificador2@test.com' },
        update: { companyId: null },
        create: {
            email: 'planificador2@test.com',
            password: await bcrypt.hash('Planner123!', 10),
            firstName: 'María',
            lastName: 'Planificadora',
            role: { connect: { id: role.id } },
            isActive: true,
            emailVerified: true,
        },
    });
    let assigned2 = 0;
    for (const company of companies) {
        const projects = await prisma.project.findMany({
            where: { companyId: company.id, managerId: null },
            orderBy: { code: 'asc' },
            take: 2,
        });
        for (const project of projects) {
            await prisma.project.update({
                where: { id: project.id },
                data: { managerId: planner2.id },
            });
            assigned2++;
        }
    }
    console.log(`[Seed] Planner test users: planificador1@test.com (${assigned1} projects), planificador2@test.com (${assigned2} projects)`);
}
