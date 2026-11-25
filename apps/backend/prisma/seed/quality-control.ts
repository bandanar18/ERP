import 'dotenv/config';
import {
  PrismaClient,
  QcFrequencyType,
  QcTargetDirection,
  QcMeasurementInputMode,
  QcMeasurementStatus,
  QcTrafficLight,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Seed del módulo Quality Control (qc_*).
 *
 * Portado del proyecto origen `Proyecto-Business-Gestion_Calidad` (NestJS) al
 * monorepo, adaptado a:
 *  - Modelos `qc_*` (QcUser, QcRole, QcOrganization, QcProcess, ...)
 *  - Roles del módulo: QC_ADMIN / QC_DIRECTOR / QC_OWNER
 *  - Permisos con prefijo QC_ (aislamiento del módulo, patrón PM_*)
 *  - Usuarios enlazados al ERP vía externalId cuando el email coincide
 *
 * Crea:
 *  1 organización CORP_MAIN, 3 roles, 9 permisos + mapeos
 *  9 usuarios (8 portados + admin@test.com enlazado al ERP como QC_ADMIN)
 *  7 procesos (COM, FIN, TH, SST, SGC, PRO, MTO) + asignaciones
 *  6 períodos de reporte (ene–jun 2026)
 *  16 indicadores KPI con fórmula mathjs, meta, thresholds y mediciones muestra
 *
 * Idempotencia: el seed vacía todas las tablas qc_* al inicio (deleteMany), por
 * lo que es seguro re-ejecutarlo. Solo en fallos a mitad de corrida podrían
 * duplicarse procesos/indicadores (no tienen constraint único) — aceptado para
 * seed de desarrollo (mismo comportamiento que el origen).
 */

export async function seedQcModule(prisma: PrismaClient) {
  console.log('  Seeding quality-control module...');

  // ── 0. Clean up (solo tablas qc_*) ──────────────────────────────────────
  await prisma.qcAuditLog.deleteMany({});
  await prisma.qcMeasurementInput.deleteMany({});
  await prisma.qcMeasurement.deleteMany({});
  await prisma.qcActionPlan.deleteMany({});
  await prisma.qcIndicatorTarget.deleteMany({});
  await prisma.qcIndicatorVersion.deleteMany({});
  await prisma.qcIndicator.deleteMany({});
  await prisma.qcUserProcessAssignment.deleteMany({});
  await prisma.qcProject.deleteMany({});
  await prisma.qcProcess.deleteMany({});
  await prisma.qcReportingPeriod.deleteMany({});
  await prisma.qcUserRole.deleteMany({});
  await prisma.qcOtpToken.deleteMany({});
  await prisma.qcPasswordResetToken.deleteMany({});
  await prisma.qcUser.deleteMany({});
  await prisma.qcRolePermission.deleteMany({});
  await prisma.qcRole.deleteMany({});
  await prisma.qcPermission.deleteMany({});
  await prisma.qcOrganization.deleteMany({});

  // Password unificada para TODOS los usuarios demo
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ── 1. Organization ─────────────────────────────────────────────────────
  const corpOrg = await prisma.qcOrganization.upsert({
    where: { code: 'CORP_MAIN' },
    update: {},
    create: { code: 'CORP_MAIN', name: 'Corporación Principal' },
  });

  // ── 2. Roles ────────────────────────────────────────────────────────────
  const rolesData = [
    { code: 'QC_ADMIN', description: 'Administrador del Sistema de Calidad' },
    { code: 'QC_DIRECTOR', description: 'Director Ejecutivo' },
    { code: 'QC_OWNER', description: 'Dueño de Proceso' },
  ];
  const roles: Record<string, { id: string }> = {};
  for (const r of rolesData) {
    roles[r.code] = await prisma.qcRole.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // ── 3. Permissions ──────────────────────────────────────────────────────
  const permissionsData = [
    { code: 'QC_VIEW_DASHBOARD', description: 'Ver dashboard principal' },
    { code: 'QC_SUBMIT_MEASUREMENT', description: 'Cargar medición' },
    { code: 'QC_MANAGE_USERS', description: 'Gestionar usuarios' },
    { code: 'QC_MANAGE_STRUCTURE', description: 'Gestionar estructura organizacional' },
    { code: 'QC_MANAGE_INDICATORS', description: 'Gestionar indicadores y metas' },
    { code: 'QC_MANAGE_PERIODS', description: 'Gestionar períodos de medición' },
    { code: 'QC_REVIEW_MEASUREMENTS', description: 'Revisar y aprobar mediciones' },
    { code: 'QC_VIEW_REPORTS', description: 'Consultar informes consolidados' },
    { code: 'QC_VIEW_AUDIT_LOG', description: 'Consultar bitácora de auditoría' },
  ];

  const directorPermCodes = ['QC_VIEW_DASHBOARD', 'QC_VIEW_REPORTS'];
  const ownerPermCodes = ['QC_SUBMIT_MEASUREMENT'];

  for (const p of permissionsData) {
    const perm = await prisma.qcPermission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });

    // QC_ADMIN recibe TODOS los permisos (upsert incondicional)
    await prisma.qcRolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['QC_ADMIN'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles['QC_ADMIN'].id, permissionId: perm.id },
    });

    if (directorPermCodes.includes(p.code)) {
      await prisma.qcRolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['QC_DIRECTOR'].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles['QC_DIRECTOR'].id, permissionId: perm.id },
      });
    }

    if (ownerPermCodes.includes(p.code)) {
      await prisma.qcRolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['QC_OWNER'].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles['QC_OWNER'].id, permissionId: perm.id },
      });
    }
  }

  // ── 4. Users ────────────────────────────────────────────────────────────
  // Usuarios portados del origen + admin del módulo enlazado al ERP (patrón PM).
  // Todos con username, nombre y contraseña unificada Password123!
  const usersData = [
    { email: 'administrador@corp.com', username: 'qc.admin', firstName: 'Admin', lastName: 'Calidad', role: 'QC_ADMIN' },
    { email: 'direccion@corp.com', username: 'direccion', firstName: 'Dirección', lastName: 'Ejecutiva', role: 'QC_DIRECTOR' },
    // Process Owners — uno por proceso
    { email: 'finanzas@corp.com', username: 'finanzas', firstName: 'Finanzas', lastName: 'Corporativas', role: 'QC_OWNER' }, // Administración y Finanzas
    { email: 'talentohumano@corp.com', username: 'talentohumano', firstName: 'Talento', lastName: 'Humano', role: 'QC_OWNER' }, // Talento Humano + SST
    { email: 'gestioncalidad@corp.com', username: 'gestioncalidad', firstName: 'Gestión', lastName: 'Calidad', role: 'QC_OWNER' }, // Sistema Gestión Calidad
    { email: 'operaciones@corp.com', username: 'operaciones', firstName: 'Operaciones', lastName: 'Mantenimiento', role: 'QC_OWNER' }, // Servicios Mantenimiento
    { email: 'procura@corp.com', username: 'procura', firstName: 'Procura', lastName: 'Compras', role: 'QC_OWNER' }, // Procura
    { email: 'comercial@corp.com', username: 'comercial', firstName: 'Comercial', lastName: 'Ventas', role: 'QC_OWNER' }, // Comercialización
    // Admin del módulo enlazado al ERP (admin@test.com) — mismo patrón que PM
    { email: 'admin@test.com', username: 'admin', firstName: 'Admin', lastName: 'ERP', role: 'QC_ADMIN' },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const erpUser = await prisma.erpUser.findUnique({ where: { email: u.email } });
    const externalIdTaken = erpUser
      ? await prisma.qcUser.findFirst({ where: { externalId: erpUser.id } })
      : null;
    const safeExternalId = erpUser && !externalIdTaken ? erpUser.id : null;

    users[u.email] = await prisma.qcUser.upsert({
      where: { email: u.email },
      update: {
        password: passwordHash,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        emailVerified: true,
      },
      create: {
        email: u.email,
        username: u.username,
        password: passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        organizationId: corpOrg.id,
        externalId: safeExternalId,
        emailVerified: true,
      },
    });

    await prisma.qcUserRole.upsert({
      where: { userId_roleId: { userId: users[u.email].id, roleId: roles[u.role].id } },
      update: {},
      create: { userId: users[u.email].id, roleId: roles[u.role].id },
    });
  }

  // ── 5. Processes (reales del Excel 2026) ────────────────────────────────
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
    let process = await prisma.qcProcess.findFirst({
      where: { organizationId: corpOrg.id, code: p.code },
    });
    if (!process) {
      process = await prisma.qcProcess.create({
        data: { organizationId: corpOrg.id, code: p.code, name: p.name },
      });
    }
    processes[p.code] = process;

    const existingAssignment = await prisma.qcUserProcessAssignment.findFirst({
      where: { userId: users[p.ownerEmail].id, processId: process.id },
    });
    if (!existingAssignment) {
      await prisma.qcUserProcessAssignment.create({
        data: { userId: users[p.ownerEmail].id, processId: process.id },
      });
    }
  }

  // ── 6. Reporting Periods (Monthly, Jan–Jun 2026) ────────────────────────
  const periods: { id: string }[] = [];
  for (let m = 1; m <= 6; m++) {
    const mm = m.toString().padStart(2, '0');
    const next = (m === 12 ? 1 : m + 1).toString().padStart(2, '0');
    const nextY = m === 12 ? '2027' : '2026';
    periods.push(
      await prisma.qcReportingPeriod.create({
        data: {
          startsAt: new Date(`2026-${mm}-01T00:00:00.000Z`),
          endsAt: new Date(`2026-${mm}-28T23:59:59.000Z`),
          dueDate: new Date(`${nextY}-${next}-05T00:00:00.000Z`),
        },
      }),
    );
  }

  // ── 7. Indicator templates (MATRIZ INDICADORES del Excel) ───────────────
  interface IndicatorTemplate {
    processCode: string;
    code: string;
    name: string;
    frequency: QcFrequencyType;
    direction: QcTargetDirection;
    formula: string;
    targetValue: number;
    unit: string;
    thresholds: Record<string, number>;
    ownerEmail: string;
    chartType?: 'LINE' | 'BAR' | 'PIE';
    inputMode?: QcMeasurementInputMode;
    displayAsPercent?: boolean;
    sampleMeasurements: {
      inputs: Record<string, number>;
      value: number;
      trafficLight: QcTrafficLight;
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
      targetValue: 10, // Excel: ≥ 0.1
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
      targetValue: 80, // Excel: > 0.8
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
      direction: 'AT_LEAST', // Excel: = 1 (100% de cumplimiento de presupuesto)
      formula: '(costo_ejecutado / costo_presupuestado) * 100',
      targetValue: 100, // Excel: = 1
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
      targetValue: 20, // Excel: = 0.2
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
      targetValue: 90, // Excel: > 0.9
      unit: '%',
      thresholds: { green: 1.0 },
      ownerEmail: 'talentohumano@corp.com',
      sampleMeasurements: [
        {
          inputs: { personal_competente: 50, total_evaluado: 50 },
          value: 100, // Excel: JUN = 1
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
      targetValue: 85, // Excel: ≥ 0.85
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
      direction: 'AT_MOST', // Excel: = 0
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
      direction: 'AT_MOST', // Excel: = 0
      formula: 'nro_nc_abiertas',
      targetValue: 0,
      unit: 'NC',
      thresholds: { green: 0 },
      ownerEmail: 'gestioncalidad@corp.com',
      sampleMeasurements: [
        { inputs: { nro_nc_abiertas: 0 }, value: 0, trafficLight: 'GREEN', observation: 'CUMPLE — Sin NC abiertas (MAR).' },
        { inputs: { nro_nc_abiertas: 0 }, value: 0, trafficLight: 'GREEN', observation: 'CUMPLE — Sin NC abiertas (JUN).' },
      ],
    },
    {
      processCode: 'SGC',
      code: 'KPI-SGC-02',
      name: '% Cumplimiento del Plan de auditorías',
      frequency: 'QUARTERLY',
      direction: 'AT_LEAST',
      formula: '(auditorias_ejecutadas / auditorias_programadas) * 100',
      targetValue: 90, // Excel: ≥ 0.9
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
      targetValue: 90, // Excel: ≥ 0.9
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

    // ── PROCURA (gráficas de torta PIE) ───────────────────────────────────
    {
      processCode: 'PRO',
      code: 'KPI-PRO-01',
      name: '% de proveedores calificados como Confiables (Servicios)',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(proveedoresConfiables / (proveedoresConfiables + proveedoresRequierenMejoras + proveedoresSuspendidos)) * 100',
      targetValue: 90, // Excel: ≥ 0.9
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
          trafficLight: 'RED', // 75% < meta 90%
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
      formula: '(proveedoresConfiables / (proveedoresConfiables + proveedoresRequierenMejoras + proveedoresSuspendidos)) * 100',
      targetValue: 90, // Excel: ≥ 0.9
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
          trafficLight: 'RED', // 75% < meta 90%
          observation: 'Clasificación de proveedores de productos.',
        },
      ],
    },

    // ── SERVICIO DE MANTENIMIENTO (MA-413 / MA-414 / MA-436) ──────────────
    {
      processCode: 'MTO',
      code: 'KPI-MTO-01',
      name: 'Avance Físico del proyecto',
      frequency: 'MONTHLY',
      direction: 'AT_LEAST',
      formula: '(actividades_ejecutadas / actividades_programadas) * 100',
      targetValue: 95, // Excel: ≥ 0.95
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
      targetValue: 95, // Excel: ≥ 0.95
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
      targetValue: 90, // Excel: ≥ 0.9
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
      direction: 'AT_MOST', // Excel: = 0
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

  // ── 8. Create Indicators, Versions, Targets, Measurements ───────────────
  let totalIndicators = 0;
  let totalMeasurements = 0;
  const createdVersions: {
    id: string;
    frequency: QcFrequencyType;
    direction: QcTargetDirection;
    ownerEmail: string;
    targetValue: number;
    chartType: string;
  }[] = [];

  for (const tpl of indicatorTemplates) {
    const process = processes[tpl.processCode];

    const indicator = await prisma.qcIndicator.create({
      data: {
        organizationId: corpOrg.id,
        processId: process.id,
        code: tpl.code,
        name: tpl.name,
        chartType: tpl.chartType ?? 'LINE',
      },
    });

    const version = await prisma.qcIndicatorVersion.create({
      data: {
        indicatorId: indicator.id,
        frequency: tpl.frequency,
        direction: tpl.direction,
        formula: tpl.formula,
        inputMode: tpl.inputMode ?? QcMeasurementInputMode.FORMULA_INPUTS,
        displayAsPercent: tpl.displayAsPercent ?? tpl.unit === '%',
        effectiveFrom: new Date('2026-01-01'),
      },
    });

    await prisma.qcIndicatorTarget.create({
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
      targetValue: tpl.targetValue,
      chartType: tpl.chartType ?? 'LINE',
    });

    // Mediciones de muestra en los primeros períodos
    for (let i = 0; i < tpl.sampleMeasurements.length; i++) {
      const sample = tpl.sampleMeasurements[i];
      const period = periods[i];
      if (!period) continue;

      const measurement = await prisma.qcMeasurement.create({
        data: {
          indicatorVersionId: version.id,
          periodId: period.id,
          submittedById: users[tpl.ownerEmail].id,
          value: sample.value,
          trafficLight: sample.trafficLight,
          status: QcMeasurementStatus.SUBMITTED,
          observation: sample.observation,
        },
      });

      if (Object.keys(sample.inputs).length > 0) {
        await prisma.qcMeasurementInput.createMany({
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

  // ── 9. Relleno mínimo para poblar las tendencias ────────────────────────
  const extraPeriodIndices = [2, 3, 4, 5]; // marzo, abril, mayo, junio

  for (const v of createdVersions) {
    if (v.chartType === 'PIE') continue; // las tortas de Procura quedan exactas

    const isQuarterly = v.frequency === QcFrequencyType.QUARTERLY;

    for (const idx of extraPeriodIndices) {
      const period = periods[idx];
      if (!period) continue;

      if (isQuarterly && idx !== 3) continue;
      if (v.frequency === QcFrequencyType.SEMIANNUAL) continue;

      const target = v.targetValue;
      let value: number;

      if (target === 0) {
        value = 0;
      } else if (v.direction === QcTargetDirection.AT_MOST) {
        value = Math.round(target * (0.7 + Math.random() * 0.25) * 100) / 100;
      } else {
        value = Math.round(target * (1.0 + Math.random() * 0.08) * 100) / 100;
      }
      value = Math.max(0, value);

      await prisma.qcMeasurement.create({
        data: {
          indicatorVersionId: v.id,
          periodId: period.id,
          submittedById: users[v.ownerEmail].id,
          value,
          trafficLight: QcTrafficLight.GREEN,
          status: QcMeasurementStatus.SUBMITTED,
          observation: 'Medición dentro de la meta — período complementario.',
        },
      });

      totalMeasurements++;
    }
  }

  // ── 10. Proyectos QC (qc_projects) — historial de proyectos de mantenimiento ──
  const qcProjectsData = [
    { processCode: 'MTO', code: 'MA-413', name: 'Mantenimiento de Planta 413' },
    { processCode: 'MTO', code: 'MA-414', name: 'Mantenimiento de Planta 414' },
    { processCode: 'MTO', code: 'MA-436', name: 'Mantenimiento de Planta 436' },
    { processCode: 'SGC', code: 'SGC-2026-01', name: 'Auditoría interna ISO 9001 2026' },
    { processCode: 'COM', code: 'COM-2026-01', name: 'Campaña comercial Q1 2026' },
  ];

  const qcProjects: Record<string, { id: string }> = {};
  for (const p of qcProjectsData) {
    const process = processes[p.processCode];
    if (!process) continue;
    const existing = await prisma.qcProject.findFirst({
      where: { processId: process.id, code: p.code },
    });
    if (!existing) {
      qcProjects[p.code] = await prisma.qcProject.create({
        data: { processId: process.id, code: p.code, name: p.name, status: 'ACTIVE' },
      });
    } else {
      qcProjects[p.code] = existing;
    }
  }
  console.log(`   • ${Object.keys(qcProjects).length} qc projects`);

  // ── 11. Action plans para mediciones con semáforo en rojo (historial) ──
  const redMeasurements = await prisma.qcMeasurement.findMany({
    where: { trafficLight: 'RED' },
    take: 6,
    include: { submittedBy: true },
  });
  let actionPlanCount = 0;
  const actionTemplates = [
    'Ejecutar auditoría pendiente del plan y documentar resultados.',
    'Convocar reunión con proveedores para revisar plan de mejora.',
    'Reforzar capacitación del personal responsable del indicador.',
    'Implementar plan de acción correctivo y dar seguimiento semanal.',
  ];
  for (const m of redMeasurements) {
    const action = actionTemplates[actionPlanCount % actionTemplates.length];
    await prisma.qcActionPlan.create({
      data: {
        measurementId: m.id,
        action,
        dates: '15 días',
        progress: 0.25 + Math.random() * 0.5,
        ownerId: m.submittedById,
      },
    });
    actionPlanCount++;
  }
  console.log(`   • ${actionPlanCount} action plans`);

  // ── 12. Audit log de historial (qc_audit_logs) ──
  const auditAdmin = users['admin@test.com'];
  if (auditAdmin) {
    const auditEntries = [
      {
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: 'session',
        route: '/api/quality-control/auth/login',
      },
      {
        action: 'CREATE',
        entityType: 'PROCESS',
        entityId: processes['SGC']?.id ?? 'SGC',
        after: { code: 'SGC', name: 'Sistema de Gestión de Calidad' },
        route: '/api/quality-control/admin/processes',
      },
      {
        action: 'CREATE',
        entityType: 'INDICATOR',
        entityId: 'KPI-SGC-01',
        after: { code: 'KPI-SGC-01', name: 'Nro. NC Abiertas/Pendientes' },
        route: '/api/quality-control/admin/indicators',
      },
      {
        action: 'REVIEW',
        entityType: 'MEASUREMENT',
        entityId: 'measurement',
        after: { status: 'APPROVED' },
        route: '/api/quality-control/measurements/:id/review',
      },
      {
        action: 'UPDATE',
        entityType: 'USER',
        entityId: users['finanzas@corp.com']?.id ?? 'user',
        after: { role: 'QC_OWNER' },
        route: '/api/quality-control/users/:id/roles',
      },
    ];
    for (const entry of auditEntries) {
      await prisma.qcAuditLog.create({
        data: {
          actorId: auditAdmin.id,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          before: undefined,
          after: entry.after,
          ip: '127.0.0.1',
          route: entry.route,
        },
      });
    }
    console.log(`   • ${auditEntries.length} audit logs`);
  }

  console.log('[Seed] Quality Control seeded:');
  console.log(`   • 1 organization (CORP_MAIN)`);
  console.log(`   • ${usersData.length} users (password: Password123!)`);
  console.log(`   • ${processesData.length} processes`);
  console.log(`   • ${totalIndicators} indicators with formulas`);
  console.log(`   • ${totalMeasurements} sample measurements`);
  console.log(`   • 6 reporting periods (Jan–Jun 2026)`);
  console.log('   Users:');
  usersData.forEach((u) => console.log(`     ${u.email} → ${u.role} (${u.username})`));
}

// Ejecución standalone: pnpm --filter backend db:seed:qc
const isDirectRun = process.argv[1] && process.argv[1].endsWith('quality-control.ts');
if (isDirectRun) {
  import('../../src/config/database')
    .then(async ({ prisma }) => {
      await seedQcModule(prisma);
    })
    .catch((e) => {
      console.error('[Seed QC] Failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      const { prisma } = await import('../../src/config/database');
      await prisma.$disconnect();
      process.exit(0);
    });
}
