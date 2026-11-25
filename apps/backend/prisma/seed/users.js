import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
const ROLE_NAMES = [
    'planificador',
    'direccion',
    'gestion',
    'administrador',
    'procura',
    'procedimiento comercial',
    'Administracion de Contratos',
];
export async function seedUsers(prisma) {
    console.log('  Seeding users...');
    // Verificar cuántos usuarios existen
    const existingCount = await prisma.user.count();
    // Si ya hay suficientes, no crear más
    if (existingCount >= 53) {
        console.log('[Seed] Users already exist, skipping...');
        return await prisma.user.findMany();
    }
    // Obtener roles y empresas existentes
    const roles = await prisma.role.findMany();
    const companies = await prisma.company.findMany();
    if (roles.length === 0) {
        throw new Error('No roles found. Run seedRoles first.');
    }
    // Hash de password por defecto: "Password123!"
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const users = [];
    const needed = 53 - existingCount;
    let created = 0;
    // Crear usuarios administradores (sin empresa)
    const adminRole = roles.find((r) => r.name === 'administrador');
    if (!adminRole)
        throw new Error('Role "administrador" not found');
    while (created < 3 && created < needed) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        users.push({
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: defaultPasswordHash,
            firstName,
            lastName,
            roleId: adminRole.id,
            companyId: null,
            isActive: true,
            emailVerified: true,
            createdAt: faker.date.past({ years: 1 }),
            updatedAt: faker.date.recent({ days: 7 }),
        });
        created++;
    }
    // Crear usuarios con roles variados, algunos con empresa
    while (created < needed) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const randomRoleName = ROLE_NAMES[Math.floor(Math.random() * ROLE_NAMES.length)];
        const randomRole = roles.find((r) => r.name === randomRoleName);
        const hasCompany = companies.length > 0 && Math.random() > 0.3;
        if (!randomRole)
            continue;
        users.push({
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: defaultPasswordHash,
            firstName,
            lastName,
            roleId: randomRole.id,
            companyId: hasCompany ? companies[Math.floor(Math.random() * companies.length)]?.id : null,
            isActive: faker.datatype.boolean(0.9),
            emailVerified: faker.datatype.boolean(0.7),
            createdAt: faker.date.past({ years: 1 }),
            updatedAt: faker.date.recent({ days: 30 }),
        });
        created++;
    }
    if (users.length > 0) {
        await prisma.user.createMany({
            data: users,
        });
    }
    const allUsers = await prisma.user.findMany();
    console.log('[Seed] Users seeded:', allUsers.length);
    return allUsers;
}
