/**
 * Smoke test end-to-end del módulo Project Management.
 *
 * Requiere:
 *  - BD levantada (DATABASE_URL)
 *  - Seeds ejecutados (pnpm --filter backend db:seed) — crea admin@test.com / Admin123!
 *
 * Uso: pnpm --filter backend smoke:pm
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import app from '../src/app.js';
import { prisma } from '../src/prisma/prisma.js';

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

async function main() {
  const server = app.listen(PORT);

  try {
    // 1. Login del módulo
    console.log('[SMOKE] 1/4 POST /api/project-management/auth/login');
    const loginRes = await fetch(`${BASE}/api/project-management/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin@test.com', password: 'Password123!' }),
    });
    const loginBody: any = await loginRes.json();

    if (!loginRes.ok) {
      throw new Error(`Login falló (${loginRes.status}): ${JSON.stringify(loginBody)}`);
    }
    if (!loginBody.token || !loginBody.user) {
      throw new Error(`Login sin token/user: ${JSON.stringify(loginBody)}`);
    }
    console.log(`[SMOKE] ✓ Login OK — roles: ${loginBody.user.roles.join(', ')}`);

    // 2. GET /auth/me con token
    console.log('[SMOKE] 2/4 GET /api/project-management/auth/me');
    const meRes = await fetch(`${BASE}/api/project-management/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    const meBody: any = await meRes.json();
    if (!meRes.ok || meBody.email !== 'admin@test.com') {
      throw new Error(`/me falló (${meRes.status}): ${JSON.stringify(meBody)}`);
    }
    console.log(`[SMOKE] ✓ /me OK — email: ${meBody.email}`);

    // 3. GET /auth/me/redirect
    console.log('[SMOKE] 3/4 GET /api/project-management/auth/me/redirect');
    const redirectRes = await fetch(`${BASE}/api/project-management/auth/me/redirect`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    const redirectBody: any = await redirectRes.json();
    if (!redirectRes.ok || !redirectBody.redirectUrl) {
      throw new Error(`/me/redirect falló (${redirectRes.status}): ${JSON.stringify(redirectBody)}`);
    }
    console.log(`[SMOKE] ✓ redirect OK — ${redirectBody.redirectUrl}`);

    // 4. Acceso sin token → 401
    console.log('[SMOKE] 4/4 GET /api/project-management/auth/me sin token → 401');
    const noTokenRes = await fetch(`${BASE}/api/project-management/auth/me`);
    if (noTokenRes.status !== 401) {
      throw new Error(`Se esperaba 401, se obtuvo ${noTokenRes.status}`);
    }
    console.log('[SMOKE] ✓ 401 sin token OK');

    console.log('\n[SMOKE] ✅ Módulo Project Management operativo.');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('[SMOKE] ❌ Fallo:', e.message);
  process.exit(1);
});
