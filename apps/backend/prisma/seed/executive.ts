import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Seed del MÓDULO EJECUTIVO (Sistema de Seguimiento de Indicadores).
 *
 * Portado desde el proyecto "Resumen Ejecutivo" (NestJS) a la arquitectura
 * del ERP. Tablas executive_* en el mismo schema public.
 *
 * Datos:
 *  - 1 organización (CORP_MAIN)
 *  - 3 roles + 9 permisos con sus vínculos
 *  - 8 usuarios (password: Admin123!)
 *  - 7 procesos + asignaciones a dueños de proceso
 *  - 6 períodos de reporte (ene–jun 2026)
 *  - 16 indicadores con fórmulas, metas y mediciones de muestra
 */
export async function seedExecutive(prisma: PrismaClient) {
  console.log('[Seed Executive] Starting...');

  // ── Clean up (solo tablas del módulo) ────────────────────────────────────
  await prisma.executiveAuditLog.deleteMany({});
  await prisma.executiveMeasurementInput.deleteMany({});
  await prisma.executiveMeasurement.deleteMany({});
  await prisma.executiveIndicatorTarget.deleteMany({});
  await prisma.executiveIndicatorVersion.deleteMany({});
  await prisma.executiveIndicator.deleteMany({});
  await prisma.executiveUserProcessAssignment.deleteMany({});
  await prisma.executiveProcess.deleteMany({});
  await prisma.executiveReportingPeriod.deleteMany({});
  await prisma.executiveUserRole.deleteMany({});
  await prisma.executiveUser.deleteMany({});
  await prisma.executiveRolePermission.deleteMany({});
  await prisma.executiveRole.deleteMany({});
  await prisma.executivePermission.deleteMany({});
  await prisma.executiveOrganization.deleteMany({});

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  // ── 1. Organización ──────────────────────────────────────────────────────
  const corpOrg = await prisma.executiveOrganization.upsert({
    where: { code: 'CORP_MAIN' },
    update: {},
    create: { code: 'CORP_MAIN', name: 'Corporación Principal' },
  });

  // ── 2. Roles ─────────────────────────────────────────────────────────────
  const rolesData = [
    { code: 'ADMIN', description: 'Administrador del Sistema' },
    { code: 'DIRECTOR', description: 'Director Ejecutivo' },
    { code: 'PROCESS_OWNER', description: 'Dueño de Proceso' },
  ];
  const roles: Record<string, { id: string }> = {};
  for (const r of rolesData) {
    roles[r.code] = await prisma.executiveRole.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // ── 3. Permisos ──────────────────────────────────────────────────────────
  const permissionsData = [
    { code: 'VIEW_DASHBOARD', description: 'Ver dashboard principal' },
    { code: 'SUBMIT_MEASUREMENT', description: 'Cargar medición' },
    { code: 'MANAGE_USERS', description: 'Gestionar usuarios' },
    { code: 'MANAGE_STRUCTURE', description: 'Gestionar estructura organizacional' },
    { code: 'MANAGE_INDICATORS', description: 'Gestionar indicadores y metas' },
    { code: 'MANAGE_PERIODS', description: 'Gestionar períodos de medición' },
    { code: 'REVIEW_MEASUREMENTS', description: 'Revisar y aprobar mediciones' },
    { code: 'VIEW_REPORTS', description: 'Consultar informes consolidados' },
    { code: 'VIEW_AUDIT_LOG', description: 'Consultar bitácora de auditoría' },
  ];

  const directorPermCodes = ['VIEW_DASHBOARD', 'VIEW_REPORTS'];
  const ownerPermCodes = ['SUBMIT_MEASUREMENT'];

  for (const p of permissionsData) {
    const perm = await prisma.executivePermission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });

    // Admin: todos los permisos
    await prisma.executiveRolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: roles['ADMIN']!.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: roles['ADMIN']!.id, permissionId: perm.id },
    });

    if (directorPermCodes.includes(p.code)) {
      await prisma.executiveRolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roles['DIRECTOR']!.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: roles['DIRECTOR']!.id, permissionId: perm.id },
      });
    }

    if (ownerPermCodes.includes(p.code)) {
      await prisma.executiveRolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roles['PROCESS_OWNER']!.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: roles['PROCESS_OWNER']!.id, permissionId: perm.id },
      });
    }
  }

  // ── 4. Usuarios ──────────────────────────────────────────────────────────
  const usersData = [
    { email: 'administrador@corp.com', role: 'ADMIN' },
    { email: 'direccion@corp.com', role: 'DIRECTOR' },
    { email: 'finanzas@corp.com', role: 'PROCESS_OWNER' }, // Administración y Finanzas
    { email: 'talentohumano@corp.com', role: 'PROCESS_OWNER' }, // Talento Humano + SST
    { email: 'gestioncalidad@corp.com', role: 'PROCESS_OWNER' }, // Sistema Gestión Calidad
    { email: 'operaciones@corp.com', role: 'PROCESS_OWNER' }, // Servicios Mantenimiento
    { email: 'procura@corp.com', role: 'PROCESS_OWNER' }, // Procura
    { email: 'comercial@corp.com', role: 'PROCESS_OWNER' }, // Comercialización
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    users[u.email] = await prisma.executiveUser.upsert({
      where: { email: u.email },
      update: { password: passwordHash },
      create: {
        email: u.email,
        password: passwordHash,
        organizationId: corpOrg.id,
      },
    });
    await prisma.executiveUserRole.upsert({
      where: {
        userId_roleId: { userId: users[u.email]!.id, roleId: roles[u.role]!.id },
      },
      update: {},
      create: { userId: users[u.email]!.id, roleId: roles[u.role]!.id },
    });
  }

  // ── 5. Procesos ──────────────────────────────────────────────────────────
  const processesData = [
    { code: 'COM', name: 'Comercialización', ownerEmail: 'comercial@corp.com' },
    { code: 'FIN', name: 'Administración y Finanzas', ownerEmail: 'finanzas@corp.com' },
    { code: 'TH', name: 'Talento Humano', ownerEmail: 'talentohumano@corp.com' },
    { code: 'SST', name: 'Gestión de Seguridad y Salud en el Trabajo', ownerEmail: 'talentohumano@corp.com' },
    { code: 'SGC', name: 'Sistema de Gestión de Calidad', ownerEmail: 'gestioncalidad@corp.com' },
    { code: 'PRO', name: 'Procura', ownerEmail: 'procura@corp.com' },
    { code: 'MTO', name: 'Servicio de Mantenimiento', ownerEmail: 'operaciones@corp.com' },
  ];

  const processes: Record<string, { id: string }> = {};
  for (const p of processesData) {
    processes[p.code] = await prisma.executiveProcess.create({
      data: { organizationId: corpOrg.id, code: p.code, name: p.name },
    });
    const existingAssignment = await prisma.executiveUserProcessAssignment.findFirst({
      where: { userId: users[p.ownerEmail]!.id, processId: processes[p.code]!.id },
    });
    if (!existingAssignment) {
      await prisma.executiveUserProcessAssignment.create({
        data: { userId: users[p.ownerEmail]!.id, processId: processes[p.code]!.id },
      });
    }
  }

  // ── 6. Períodos de reporte (ene–jun 2026) ────────────────────────────────
  const periods: { id: string }[] = [];
  for (let m = 1; m <= 6; m++) {
    const mm = m.toString().padStart(2, '0');
    const next = (m === 12 ? 1 : m + 1).toString().padStart(2, '0');
    const nextY = m === 12 ? '2027' : '2026';
    periods.push(
      await prisma.executiveReportingPeriod.create({
        data: {
          startsAt: new Date(`2026-${mm}-01T00:00:00.000Z`),
          endsAt: new Date(`2026-${mm}-28T23:59:59.000Z`),
          dueDate: new Date(`${nextY}-${next}-05T00:00:00.000Z`),
        },
      }),
    );
  }

  // ── 7. Plantillas de indicadores ─────────────────────────────────────────
  interface IndicatorTemplate {
    processCode: string;
    code: string;
    name: string;
    frequency: string;
    direction: string;
    formula: string;
    targetValue: number;
    unit: string;
    thresholds: Record<string, number>;
    ownerEmail: string;
    chartType?: 'LINE' | 'BAR' | 'PIE';
    inputMode?: 'DIRECT_VALUE' | 'FORMULA_INPUTS';
    displayAsPercent?: boolean;
    sampleMeasurements: {
      inputs: Record<string, number>;
      value: number;
      trafficLight: string;
      observation: string;
    }[];
  }

  const indicatorTemplates: IndicatorTemplate[] = [
    // ── COMERCIALIZACIÓN ──────────────────────────────────────────────────
    {
      processCode: 'COM',
      code: 'KPI-COM-01',
      name: '% Índice de adjudicación',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(solicitudes_adjudicadas / total_solicitudes) * 100',
      targetValue: 10,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'comercial@corp.com',
      sampleMeasurements: [
        {
          inputs: { solicitudes_adjudicadas: 2, total_solicitudes: 15 },
          value: 13.33,
          trafficLight: 'GREEN',
          observation: 'Adjudicaciones por encima del índice mínimo esperado.',
        },
      ],
    },
    {
      processCode: 'COM',
      code: 'KPI-COM-02',
      name: '% Satisfacción del cliente (Servicios)',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(calificacion_obtenida / calificacion_maxima) * 100',
      targetValue: 80,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'comercial@corp.com',
      sampleMeasurements: [
        {
          inputs: { calificacion_obtenida: 90, calificacion_maxima: 100 },
          value: 90,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Satisfacción del cliente por encima de la meta.',
        },
      ],
    },

    // ── ADMINISTRACIÓN Y FINANZAS ─────────────────────────────────────────
    {
      processCode: 'FIN',
      code: 'KPI-FIN-01',
      name: 'Cumplimiento del Presupuesto de Costos y Gastos',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(costo_ejecutado / costo_presupuestado) * 100',
      targetValue: 100,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'finanzas@corp.com',
      sampleMeasurements: [
        {
          inputs: { costo_ejecutado: 100000, costo_presupuestado: 100000 },
          value: 100,
          trafficLight: 'GREEN',
          observation: 'Consolidado de proyectos MA-413 / MA-414 / MA-436.',
        },
      ],
    },
    {
      processCode: 'FIN',
      code: 'KPI-FIN-02',
      name: 'Crecimiento Financiero Organizacional',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '((ingreso_actual - ingreso_anterior) / ingreso_anterior) * 100',
      targetValue: 20,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'finanzas@corp.com',
      sampleMeasurements: [
        {
          inputs: { ingreso_actual: 1250000, ingreso_anterior: 1000000 },
          value: 25,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Crecimiento financiero por encima del 20%.',
        },
      ],
    },

    // ── TALENTO HUMANO ────────────────────────────────────────────────────
    {
      processCode: 'TH',
      code: 'KPI-TH-01',
      name: 'Cumplimiento de competencias (Gerencia Corporativa)',
      frequency: 'QUARTERLY',
      direction: 'AT_LEAST',
      formula: '(personal_competente / total_evaluado) * 100',
      targetValue: 90,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'talentohumano@corp.com',
      sampleMeasurements: [
        {
          inputs: { personal_competente: 50, total_evaluado: 50 },
          value: 100,
          trafficLight: 'GREEN',
          observation: 'Competencias evaluadas al 100% según DC.',
        },
      ],
    },
    {
      processCode: 'TH',
      code: 'KPI-TH-02',
      name: '% Crecimiento Organizacional',
      frequency: 'QUARTERLY',
      direction: 'AT_LEAST',
      formula: '((plantilla_actual - plantilla_anterior) / plantilla_anterior) * 100',
      targetValue: 85,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'talentohumano@corp.com',
      sampleMeasurements: [
        {
          inputs: { plantilla_actual: 185, plantilla_anterior: 100 },
          value: 85,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Medido en relación al año anterior (cierre 2024).',
        },
      ],
    },

    // ── SEGURIDAD Y SALUD EN EL TRABAJO ───────────────────────────────────
    {
      processCode: 'SST',
      code: 'KPI-SST-01',
      name: 'No. de accidentes',
      frequency: 'MONTHLY',
      direction: 'AT_MOST',
      formula: 'nro_accidentes',
      targetValue: 0,
      unit: 'accidentes',
      thresholds: { green: 0 },
      ownerEmail: 'talentohumano@corp.com',
      sampleMeasurements: [
        {
          inputs: { nro_accidentes: 0 },
          value: 0,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Período sin accidentes.',
        },
      ],
    },

    // ── SISTEMA DE GESTIÓN DE CALIDAD ─────────────────────────────────────
    {
      processCode: 'SGC',
      code: 'KPI-SGC-01',
      name: 'Nro. NC Abiertas/Pendientes',
      frequency: 'QUARTERLY',
      direction: 'AT_MOST',
      formula: 'nro_nc_abiertas',
      targetValue: 0,
      unit: 'NC',
      thresholds: { green: 0 },
      ownerEmail: 'gestioncalidad@corp.com',
      sampleMeasurements: [
        {
          inputs: { nro_nc_abiertas: 0 },
          value: 0,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Sin NC abiertas (MAR).',
        },
        {
          inputs: { nro_nc_abiertas: 0 },
          value: 0,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Sin NC abiertas (JUN).',
        },
      ],
    },
    {
      processCode: 'SGC',
      code: 'KPI-SGC-02',
      name: '% Cumplimiento del Plan de auditorías',
      frequency: 'QUARTERLY',
      direction: 'AT_LEAST',
      formula: '(auditorias_ejecutadas / auditorias_programadas) * 100',
      targetValue: 90,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'gestioncalidad@corp.com',
      sampleMeasurements: [
        {
          inputs: { auditorias_ejecutadas: 0, auditorias_programadas: 5 },
          value: 0,
          trafficLight: 'RED',
          observation: 'Plan de auditorías sin ejecutar (MAR).',
        },
        {
          inputs: { auditorias_ejecutadas: 0, auditorias_programadas: 5 },
          value: 0,
          trafficLight: 'RED',
          observation: 'Plan de auditorías sin ejecutar (JUN).',
        },
      ],
    },
    {
      processCode: 'SGC',
      code: 'KPI-SGC-03',
      name: '% Acciones Correctivas cerradas',
      frequency: 'QUARTERLY',
      direction: 'AT_LEAST',
      formula: '(acciones_cerradas / total_acciones) * 100',
      targetValue: 90,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'gestioncalidad@corp.com',
      sampleMeasurements: [
        {
          inputs: { acciones_cerradas: 10, total_acciones: 10 },
          value: 100,
          trafficLight: 'GREEN',
          observation: 'Todas las acciones correctivas cerradas (MAR).',
        },
        {
          inputs: { acciones_cerradas: 10, total_acciones: 10 },
          value: 100,
          trafficLight: 'GREEN',
          observation: 'Todas las acciones correctivas cerradas (JUN).',
        },
      ],
    },

    // ── PROCURA (gráfica de torta PIE) ────────────────────────────────────
    {
      processCode: 'PRO',
      code: 'KPI-PRO-01',
      name: '% de proveedores calificados como Confiables (Servicios)',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula:
        '(proveedoresConfiables / (proveedoresConfiables + proveedoresRequierenMejoras + proveedoresSuspendidos)) * 100',
      targetValue: 90,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'procura@corp.com',
      chartType: 'PIE',
      inputMode: 'FORMULA_INPUTS',
      displayAsPercent: true,
      sampleMeasurements: [
        {
          inputs: { proveedoresConfiables: 12, proveedoresRequierenMejoras: 4, proveedoresSuspendidos: 0 },
          value: 75,
          trafficLight: 'RED',
          observation: 'Clasificación de proveedores de servicios.',
        },
      ],
    },
    {
      processCode: 'PRO',
      code: 'KPI-PRO-02',
      name: '% de proveedores calificados como Confiables (Productos)',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula:
        '(proveedoresConfiables / (proveedoresConfiables + proveedoresRequierenMejoras + proveedoresSuspendidos)) * 100',
      targetValue: 90,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'procura@corp.com',
      chartType: 'PIE',
      inputMode: 'FORMULA_INPUTS',
      displayAsPercent: true,
      sampleMeasurements: [
        {
          inputs: { proveedoresConfiables: 12, proveedoresRequierenMejoras: 4, proveedoresSuspendidos: 0 },
          value: 75,
          trafficLight: 'RED',
          observation: 'Clasificación de proveedores de productos.',
        },
      ],
    },

    // ── SERVICIO DE MANTENIMIENTO (consolidado MA-413 / MA-414 / MA-436) ──
    {
      processCode: 'MTO',
      code: 'KPI-MTO-01',
      name: 'Avance Físico del proyecto',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(actividades_ejecutadas / actividades_programadas) * 100',
      targetValue: 95,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'operaciones@corp.com',
      sampleMeasurements: [
        {
          inputs: { actividades_ejecutadas: 19, actividades_programadas: 20 },
          value: 95,
          trafficLight: 'GREEN',
          observation: 'Avance físico dentro del plan semanal.',
        },
      ],
    },
    {
      processCode: 'MTO',
      code: 'KPI-MTO-02',
      name: 'Avance Financiero del Proyecto',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(monto_valuado / monto_presupuestado) * 100',
      targetValue: 95,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'operaciones@corp.com',
      sampleMeasurements: [
        {
          inputs: { monto_valuado: 190000, monto_presupuestado: 200000 },
          value: 95,
          trafficLight: 'GREEN',
          observation: 'Avance financiero acorde al plan semanal.',
        },
      ],
    },
    {
      processCode: 'MTO',
      code: 'KPI-MTO-03',
      name: 'Cumplimiento de Administración de contrato por proyecto',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(actividades_admin_ejecutadas / actividades_admin_programadas) * 100',
      targetValue: 90,
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'operaciones@corp.com',
      sampleMeasurements: [
        {
          inputs: { actividades_admin_ejecutadas: 9, actividades_admin_programadas: 10 },
          value: 90,
          trafficLight: 'GREEN',
          observation: 'Administración de contrato dentro de lo planificado.',
        },
      ],
    },
    {
      processCode: 'MTO',
      code: 'KPI-MTO-04',
      name: 'Nro. de registros técnicos de no conformidad',
      frequency: 'MONTHLY',
      direction: 'AT_MOST',
      formula: 'nro_rtnc',
      targetValue: 0,
      unit: 'RTNC',
      thresholds: { green: 0 },
      ownerEmail: 'operaciones@corp.com',
      sampleMeasurements: [
        {
          inputs: { nro_rtnc: 0 },
          value: 0,
          trafficLight: 'GREEN',
          observation: 'CUMPLE — Sin registros técnicos de NC.',
        },
      ],
    },
  ];

  // ── 8. Indicadores, versiones, metas y mediciones ────────────────────────
  let totalIndicators = 0;
  let totalMeasurements = 0;
  const createdVersions: {
    id: string;
    frequency: string;
    direction: string;
    ownerEmail: string;
    code: string;
    targetValue: number;
    thresholds: Record<string, number>;
    chartType: string;
  }[] = [];

  for (const tpl of indicatorTemplates) {
    const process = processes[tpl.processCode]!;

    const indicator = await prisma.executiveIndicator.create({
      data: {
        organizationId: corpOrg.id,
        processId: process.id,
        code: tpl.code,
        name: tpl.name,
        chartType: tpl.chartType ?? 'LINE',
      },
    });

    const version = await prisma.executiveIndicatorVersion.create({
      data: {
        indicatorId: indicator.id,
        frequency: tpl.frequency as any,
        direction: tpl.direction as any,
        formula: tpl.formula,
        inputMode: (tpl.inputMode ?? 'FORMULA_INPUTS') as any,
        displayAsPercent: tpl.displayAsPercent ?? tpl.unit === '%',
        effectiveFrom: new Date('2026-01-01'),
      },
    });

    await prisma.executiveIndicatorTarget.create({
      data: {
        versionId: version.id,
        targetValue: tpl.targetValue,
        unit: tpl.unit,
        thresholds: tpl.thresholds,
      },
    });

    totalIndicators++;

    createdVersions.push({
      id: version.id,
      frequency: tpl.frequency,
      direction: tpl.direction,
      ownerEmail: tpl.ownerEmail,
      code: tpl.code,
      targetValue: tpl.targetValue,
      thresholds: tpl.thresholds,
      chartType: tpl.chartType ?? 'LINE',
    });

    for (let i = 0; i < tpl.sampleMeasurements.length; i++) {
      const sample = tpl.sampleMeasurements[i]!;
      const period = periods[i];
      if (!period) continue;

      const measurement = await prisma.executiveMeasurement.create({
        data: {
          indicatorVersionId: version.id,
          periodId: period.id,
          submittedById: users[tpl.ownerEmail]!.id,
          value: sample.value,
          trafficLight: sample.trafficLight as any,
          status: 'SUBMITTED',
          observation: sample.observation,
        },
      });

      if (Object.keys(sample.inputs).length > 0) {
        await prisma.executiveMeasurementInput.createMany({
          data: Object.entries(sample.inputs).map(([key, value]) => ({
            measurementId: measurement.id,
            key,
            value,
          })),
        });
      }

      totalMeasurements++;
    }
  }

  // ── 9. Relleno para poblar tendencias ───────────────────────────────────
  const extraPeriodIndices = [2, 3, 4, 5]; // marzo, abril, mayo, junio

  for (const v of createdVersions) {
    if (v.chartType === 'PIE') continue;

    const isQuarterly = v.frequency === 'QUARTERLY';

    for (const idx of extraPeriodIndices) {
      const period = periods[idx];
      if (!period) continue;

      if (isQuarterly && idx !== 3) continue;
      if (v.frequency === 'SEMIANNUAL') continue;

      const target = v.targetValue;
      let value: number;

      if (target === 0) {
        value = 0;
      } else if (v.direction === 'AT_MOST') {
        value = Math.round(target * (0.7 + Math.random() * 0.25) * 100) / 100;
      } else {
        value = Math.round(target * (1.0 + Math.random() * 0.08) * 100) / 100;
      }
      value = Math.max(0, value);

      await prisma.executiveMeasurement.create({
        data: {
          indicatorVersionId: v.id,
          periodId: period.id,
          submittedById: users[v.ownerEmail]!.id,
          value,
          trafficLight: 'GREEN',
          status: 'SUBMITTED',
          observation: 'Medición dentro de la meta — período complementario.',
        },
      });

      totalMeasurements++;
    }
  }

  console.log(`[Seed Executive] Completed:`);
  console.log(`   • 1 organization (CORP_MAIN)`);
  console.log(`   • ${usersData.length} users (all password: Admin123!)`);
  console.log(`   • ${processesData.length} processes`);
  console.log(`   • ${totalIndicators} indicators with formulas`);
  console.log(`   • ${totalMeasurements} sample measurements`);
  console.log(`   • 6 reporting periods (Jan–Jun 2026)`);
}
