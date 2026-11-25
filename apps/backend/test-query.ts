import './src/config/load-env.js';
import { prisma } from './src/prisma/prisma.js';
async function run() {
  const matchingPeriods = await prisma.qcReportingPeriod.findMany({
    where: {
      startsAt: { lte: new Date('2026-09-30T23:59:59.999Z') },
      endsAt: { gte: new Date('2026-08-01T00:00:00.000Z') },
    },
    select: { id: true, startsAt: true, endsAt: true },
  });
  console.log("Periods matched:", matchingPeriods);

  const measurements = await prisma.qcMeasurement.findMany({
    where: {
      periodId: { in: matchingPeriods.map(p => p.id) },
    },
    include: { period: true },
  });
  console.log("Measurements matched:", measurements.length);

  const allMeasurements = await prisma.qcMeasurement.findMany({
    include: { period: true },
  });
  console.log("Total measurements in DB:", allMeasurements.length);
}
run();
