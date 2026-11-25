import { faker } from '@faker-js/faker';
export async function seedProjects(prisma) {
    console.log('  Seeding projects...');
    // Obtener empresas existentes
    const companies = await prisma.company.findMany();
    if (companies.length === 0) {
        console.log('[Seed] Warning: No companies found. Skipping projects seed.');
        return [];
    }
    const projectTypes = [
        'Implementación de ERP',
        'Auditoría de Sistemas',
        'Desarrollo de Software a Medida',
        'Consultoría en Ciberseguridad',
        'Migración a la Nube',
        'Optimización de Base de Datos',
        'Reingeniería de Procesos',
        'Infraestructura de Redes',
        'Soporte Técnico Especializado',
        'Capacitación de Personal IT'
    ];
    const statuses = [
        'PLANNED',
        'IN_PROGRESS',
        'ON_HOLD',
        'COMPLETED'
    ];
    // Proyectos por empresa
    const projectsPerCompany = 4;
    let projectCount = 0;
    for (const company of companies) {
        for (let i = 0; i < projectsPerCompany; i++) {
            const type = faker.helpers.arrayElement(projectTypes);
            const fullName = `${type} - ${company.name}`;
            const shortName = `${type.split(' ')[0]} ${company.name.split(' ')[0]}`;
            const code = `PRJ-${faker.string.alphanumeric(5).toUpperCase()}`;
            // Fechas controladas: 2-3 meses de duración
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // Empezó 1 mes atrás
            const durationDays = faker.number.int({ min: 60, max: 90 }); // 2-3 meses
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + durationDays);
            const offeredAmount = faker.number.int({ min: 50000, max: 200000 });
            const estimatedCost = Math.round(offeredAmount * 0.7); // 70% del offered
            await prisma.project.upsert({
                where: { code },
                update: {},
                create: {
                    code,
                    fullName,
                    shortName,
                    description: faker.commerce.productDescription(),
                    companyId: company.id,
                    managerId: null,
                    status: faker.helpers.arrayElement(statuses),
                    startDate,
                    endDate,
                    offeredAmount,
                    estimatedCost,
                },
            });
            projectCount++;
        }
    }
    const allProjects = await prisma.project.findMany();
    console.log('[Seed] Projects seeded:', allProjects.length);
    return allProjects;
}
