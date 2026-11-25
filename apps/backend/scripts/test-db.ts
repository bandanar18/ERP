import '../src/config/load-env.js';
import { prisma } from '../src/prisma/prisma.js';

const testDatabase = async () => {
  console.log('[TEST] Probando conexión a PostgreSQL...');

  if (!process.env.DATABASE_URL) {
    console.error('[TEST] DATABASE_URL no está definida en .env');
    process.exit(1);
  }

  try {
    console.log('[TEST] Conectando a la base de datos...');

    // Probar conexión con una consulta simple
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[TEST] Consulta de prueba exitosa:', result);

    // Probar conexión con Prisma (count users)
    console.log('[TEST] Contando usuarios en la base de datos...');
    const userCount = await prisma.erpUser.count();
    console.log(`[TEST] Total de usuarios: ${userCount}`);

    // Listar tablas principales
    console.log('[TEST] Verificando tablas principales...');
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename::text as tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`[TEST] Tablas encontradas (${tables.length}):`);
    tables.slice(0, 10).forEach((table) => {
      console.log(`  - ${table.tablename}`);
    });
    if (tables.length > 10) {
      console.log(`  ... y ${tables.length - 10} más`);
    }

    // Verificar conexión con el pool
    console.log('[TEST] Consultando información del servidor...');
    const serverInfo = await prisma.$queryRaw<{ version: string }[]>`
      SELECT version()
    `;
    console.log('[TEST] Versión de PostgreSQL:', serverInfo[0]?.version?.split(' ').slice(0, 3).join(' '));

    console.log('[TEST] La base de datos funciona correctamente');
    process.exit(0);
  } catch (error) {
    console.error('[TEST] Error al conectar a la base de datos:');
    if (error instanceof Error) {
      console.error(`  Mensaje: ${error.message}`);
      console.error('\n[TEST] Verifica:');
      console.error('  1. PostgreSQL esté ejecutándose');
      console.error('  2. DATABASE_URL en .env sea correcta');
      console.error('  3. La base de datos exista');
      console.error('  4. Ejecuta "pnpm --filter backend generate" si es necesario');
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('[TEST] Conexión cerrada');
  }
};

testDatabase();
