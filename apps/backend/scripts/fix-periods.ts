import '../src/config/load-env.js';
import { prisma } from '../src/prisma/prisma.js';

async function main() {
  const months = [7, 8, 9, 10, 11, 12];
  for (const m of months) {
    const mm = m.toString().padStart(2, '0');
    const next = (m === 12 ? 1 : m + 1).toString().padStart(2, '0');
    const nextY = m === 12 ? '2027' : '2026';

    const exists = await prisma.qcReportingPeriod.findFirst({
      where: { startsAt: new Date(`2026-${mm}-01T00:00:00.000Z`) },
    });

    if (!exists) {
      await prisma.qcReportingPeriod.create({
        data: {
          startsAt: new Date(`2026-${mm}-01T00:00:00.000Z`),
          endsAt: new Date(`2026-${mm}-30T23:59:59.000Z`),
          dueDate: new Date(`${nextY}-${next}-05T00:00:00.000Z`),
          status: m <= 8 ? 'CLOSED' : 'OPEN',
        },
      });
      console.log(`Created period for 2026-${mm}`);
    } else {
      console.log(`Period 2026-${mm} already exists`);
    }
  }

  await prisma.qcReportingPeriod.updateMany({
    where: { endsAt: { lt: new Date('2026-09-01T00:00:00.000Z') } },
    data: { status: 'CLOSED' },
  });
  console.log('Done');
}

main().finally(() => prisma.$disconnect());
