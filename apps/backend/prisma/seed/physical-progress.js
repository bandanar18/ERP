import { faker } from '@faker-js/faker';
export async function seedPhysicalProgress(prisma) {
    console.log('  Seeding physical progress...');
    // Obtener proyectos existentes que tienen manager asignado
    const projects = await prisma.project.findMany({
        where: {
            managerId: { not: null },
        },
    });
    if (projects.length === 0) {
        console.log('[Seed] Warning: No projects with manager found. Skipping physical progress seed.');
        return [];
    }
    console.log(`[Seed] Creating progress for ${projects.length} projects with manager`);
    const progressRecords = [];
    // Crear registros de avance solo para proyectos con manager
    for (const project of projects) {
        const numberOfRecords = faker.number.int({ min: 10, max: 50 });
        const projectStartDate = project.startDate || faker.date.past({ years: 1 });
        const projectEndDate = project.endDate || faker.date.future({ years: 1 });
        // Calcular el rango de fechas
        const startTime = projectStartDate.getTime();
        const endTime = projectEndDate.getTime();
        const timeRange = endTime - startTime;
        // Generar progresos incrementalmente
        let previousActual = -1;
        let previousPlanned = -1;
        for (let i = 0; i < numberOfRecords; i++) {
            // Calcular la fecha basada en el progreso (más adelante en el tiempo = más progreso)
            const progressRatio = i / (numberOfRecords - 1);
            const recordDate = new Date(startTime + timeRange * progressRatio);
            // Valores base según la posición en el tiempo
            const baseActual = Math.floor(progressRatio * 100);
            const basePlanned = Math.floor(progressRatio * 100);
            // Agregar pequeña variación aleatoria pero nunca menor al anterior
            const actualVariation = faker.number.int({ min: -2, max: 5 });
            const plannedVariation = faker.number.int({ min: -2, max: 8 });
            let actualValue = Math.max(0, Math.min(100, baseActual + actualVariation));
            let plannedValue = Math.max(0, Math.min(100, basePlanned + plannedVariation));
            // Asegurar que siempre sea mayor o igual al anterior
            if (previousActual >= 0) {
                actualValue = Math.max(previousActual, Math.min(100, actualValue + faker.number.int({ min: 0, max: 5 })));
            }
            if (previousPlanned >= 0) {
                plannedValue = Math.max(previousPlanned, Math.min(100, plannedValue + faker.number.int({ min: 0, max: 5 })));
            }
            previousActual = actualValue;
            previousPlanned = plannedValue;
            progressRecords.push({
                projectId: project.id,
                date: recordDate,
                actualProgress: `${actualValue}%`,
                plannedProgress: `${plannedValue}%`,
                attentionPoints: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : undefined,
                startDate: projectStartDate,
                endDate: projectEndDate
            });
        }
    }
    // Insertar todos los registros
    for (const record of progressRecords) {
        await prisma.physicalProgress.create({
            data: record
        });
    }
    const allProgress = await prisma.physicalProgress.findMany();
    console.log('[Seed] Physical progress records seeded:', allProgress.length);
    return allProgress;
}
