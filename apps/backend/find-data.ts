import './src/config/load-env.js';
import { prisma } from './src/prisma/prisma.js';
async function run() {
  const m = await prisma.qcMeasurement.findFirst({
    where: { period: { startsAt: { gte: new Date('2026-01-01') } } },
    include: {
      period: true,
      version: { include: { indicator: { include: { process: true } } } }
    }
  });
  if (m) {
    console.log(`Proceso: ${m.version.indicator.process.name}`);
    console.log(`Fecha inicio: ${m.period.startsAt}`);
    console.log(`Fecha fin: ${m.period.endsAt}`);
  }
}
run();
