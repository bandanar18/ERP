/**
 * Script opcional: DROP de las tablas legacy tras la migración de datos a pm_*.
 *
 * ⚠️ EJECUTAR SOLO DESPUÉS de:
 *   1. pnpm --filter backend db:seed          (roles + permisos + usuarios PM)
 *   2. pnpm --filter backend db:migrate:pm     (migra datos de tablas legacy → pm_*)
 *   3. Verificar que la app funciona sobre pm_* (login del módulo + endpoints)
 *
 * Este script elimina las tablas legacy que ya fueron reemplazadas por las
 * tablas pm_* del módulo Project Management.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { Pool } from 'pg';

const LEGACY_TABLES = [
  'projects',
  'companies',
  'avance_fisico',
  'financial_valuations',
  'cost_plannings',
  'file_gallery',
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('[DROP-LEGACY] Abortado: no ejecutar en producción sin revisión manual.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    for (const table of LEGACY_TABLES) {
      const exists = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      if (exists.rows[0]?.exists) {
        console.log(`[DROP-LEGACY] Dropping table "${table}"...`);
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      } else {
        console.log(`[DROP-LEGACY] Table "${table}" no existe, omitiendo...`);
      }
    }
    console.log('[DROP-LEGACY] Tablas legacy eliminadas correctamente.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('[DROP-LEGACY] Error:', e);
  process.exit(1);
});
