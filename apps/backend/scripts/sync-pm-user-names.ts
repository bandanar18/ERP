import { prisma } from '../src/prisma/prisma';

/**
 * Backfill: sincroniza firstName/lastName de pm_users desde su usuario ERP
 * enlazado (externalId). Se usa cuando los nombres quedaron NULL al enlazar
 * o registrar la cuenta del módulo.
 *
 * Ejecutar: pnpm --filter backend exec tsx scripts/sync-pm-user-names.ts
 */
async function main() {
  const pmUsers = await prisma.pmModuleUser.findMany({
    where: {
      externalId: { not: null },
      OR: [{ firstName: null }, { lastName: null }],
    },
  });

  console.log(`[Sync] ${pmUsers.length} pm_users con nombres faltantes y externalId`);

  let updated = 0;
  for (const pmUser of pmUsers) {
    if (!pmUser.externalId) continue;

    const erpUser = await prisma.erpUser.findUnique({
      where: { id: pmUser.externalId },
      select: { firstName: true, lastName: true },
    });

    if (!erpUser) continue;

    const data: { firstName?: string | null; lastName?: string | null } = {};
    if (!pmUser.firstName) data.firstName = erpUser.firstName;
    if (!pmUser.lastName) data.lastName = erpUser.lastName;

    if (Object.keys(data).length === 0) continue;

    await prisma.pmModuleUser.update({
      where: { id: pmUser.id },
      data,
    });
    updated++;
    console.log(
      `  ✓ ${pmUser.email}: ${data.firstName || pmUser.firstName} ${data.lastName || pmUser.lastName}`
    );
  }

  console.log(`[Sync] Actualizados: ${updated}`);
}

main()
  .catch((e) => {
    console.error('[Sync] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
