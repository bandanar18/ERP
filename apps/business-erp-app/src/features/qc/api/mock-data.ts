import type { QcMatrixEntry, QcPerformanceReport, QcReportingPeriod, QcSummary, QcTrendEntry } from '../types';
import type { QcMeasurement } from './measurement';
import type { QcAuditEntry } from './audit';
import type { QcAdminProcess } from './admin';
import type { QcUserListItem, QcRoleWithPermissions, QcPermissionItem } from './user';

/* ============================================================================
   Dashboard
============================================================================ */

export const MOCK_SUMMARY: QcSummary = {
  total: 24,
  green: 18,
  red: 3,
  yellow: 2,
  gray: 1,
};

export const MOCK_PERIOD: QcReportingPeriod = {
  id: 'period-1',
  startsAt: '2026-08-01T00:00:00Z',
  endsAt: '2026-08-31T23:59:59Z',
  dueDate: '2026-09-05T23:59:59Z',
  status: 'OPEN',
};

export const MOCK_MATRIX: QcMatrixEntry[] = [
  { id: 'm1', process: 'Comercial', processCode: 'COM', code: 'COM-01', name: 'Solicitudes adjudicadas', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 80, unit: '%', latestMeasurement: 87, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm2', process: 'Comercial', processCode: 'COM', code: 'COM-02', name: 'Calificación de clientes', frequency: 'Trimestral', direction: 'Mínimo (>=)', targetValue: 4.5, unit: '/5', latestMeasurement: 4.2, complianceStatus: 'YELLOW', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm3', process: 'Comercial', processCode: 'COM', code: 'COM-03', name: 'Tiempo de respuesta a cotizaciones', frequency: 'Mensual', direction: 'Máximo (<=)', targetValue: 48, unit: 'horas', latestMeasurement: 36, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm4', process: 'Operaciones', processCode: 'OPE', code: 'OPE-01', name: 'Cumplimiento de cronograma', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 90, unit: '%', latestMeasurement: 92, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm5', process: 'Operaciones', processCode: 'OPE', code: 'OPE-02', name: 'Calidad de entregables', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 95, unit: '%', latestMeasurement: 94, complianceStatus: 'RED', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm6', process: 'Operaciones', processCode: 'OPE', code: 'OPE-03', name: 'Satisfacción del cliente interno', frequency: 'Trimestral', direction: 'Mínimo (>=)', targetValue: 4.0, unit: '/5', latestMeasurement: 4.3, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm7', process: 'Recursos Humanos', processCode: 'RRHH', code: 'RRHH-01', name: 'Rotación de personal', frequency: 'Mensual', direction: 'Máximo (<=)', targetValue: 5, unit: '%', latestMeasurement: 3.2, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm8', process: 'Recursos Humanos', processCode: 'RRHH', code: 'RRHH-02', name: 'Horas de capacitación', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 8, unit: 'horas', latestMeasurement: 6, complianceStatus: 'RED', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm9', process: 'Finanzas', processCode: 'FIN', code: 'FIN-01', name: 'Margen de ganancia', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 15, unit: '%', latestMeasurement: 18.5, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm10', process: 'Finanzas', processCode: 'FIN', code: 'FIN-02', name: 'Días de cartera', frequency: 'Mensual', direction: 'Máximo (<=)', targetValue: 45, unit: 'días', latestMeasurement: 52, complianceStatus: 'RED', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm11', process: 'Procura', processCode: 'PRO', code: 'PRO-01', name: 'Proveedores confiables', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 70, unit: '%', latestMeasurement: 75, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm12', process: 'Procura', processCode: 'PRO', code: 'PRO-02', name: 'Tiempo de entrega de proveedores', frequency: 'Mensual', direction: 'Máximo (<=)', targetValue: 15, unit: 'días', latestMeasurement: 12, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm13', process: 'IT', processCode: 'IT', code: 'IT-01', name: 'Disponibilidad de sistemas', frequency: 'Mensual', direction: 'Mínimo (>=)', targetValue: 99, unit: '%', latestMeasurement: 99.5, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm14', process: 'IT', processCode: 'IT', code: 'IT-02', name: 'Tiempo de resolución de incidentes', frequency: 'Mensual', direction: 'Máximo (<=)', targetValue: 4, unit: 'horas', latestMeasurement: 2.5, complianceStatus: 'GREEN', period: 'Agosto 2026', conclusion: null, observation: null },
  { id: 'm15', process: 'Ambiental', processCode: 'AMB', code: 'AMB-01', name: 'Reducción de residuos', frequency: 'Trimestral', direction: 'Mínimo (>=)', targetValue: 10, unit: '%', latestMeasurement: 8, complianceStatus: 'YELLOW', period: 'Agosto 2026', conclusion: null, observation: null },
];

export const MOCK_TREND: QcTrendEntry[] = [
  { period: 'Ene 2026', totalGreen: 12, totalRed: 5, total: 20, compliancePct: 60 },
  { period: 'Feb 2026', totalGreen: 14, totalRed: 4, total: 20, compliancePct: 70 },
  { period: 'Mar 2026', totalGreen: 15, totalRed: 3, total: 20, compliancePct: 75 },
  { period: 'Abr 2026', totalGreen: 16, totalRed: 3, total: 22, compliancePct: 73 },
  { period: 'May 2026', totalGreen: 17, totalRed: 2, total: 22, compliancePct: 77 },
  { period: 'Jun 2026', totalGreen: 16, totalRed: 3, total: 22, compliancePct: 73 },
  { period: 'Jul 2026', totalGreen: 18, totalRed: 3, total: 24, compliancePct: 75 },
  { period: 'Ago 2026', totalGreen: 18, totalRed: 3, total: 24, compliancePct: 75 },
];

export const MOCK_PERFORMANCE: QcPerformanceReport = {
  totalIndicators: 24,
  complying: 18,
  notComplying: 3,
  byProcess: {
    'Comercial': [
      { indicator: 'Solicitudes adjudicadas', value: 87, status: 'GREEN' },
      { indicator: 'Calificación de clientes', value: 4.2, status: 'YELLOW' },
      { indicator: 'Tiempo de respuesta a cotizaciones', value: 36, status: 'GREEN' },
    ],
    'Operaciones': [
      { indicator: 'Cumplimiento de cronograma', value: 92, status: 'GREEN' },
      { indicator: 'Calidad de entregables', value: 94, status: 'RED' },
      { indicator: 'Satisfacción del cliente interno', value: 4.3, status: 'GREEN' },
    ],
    'Recursos Humanos': [
      { indicator: 'Rotación de personal', value: 3.2, status: 'GREEN' },
      { indicator: 'Horas de capacitación', value: 6, status: 'RED' },
    ],
    'Finanzas': [
      { indicator: 'Margen de ganancia', value: 18.5, status: 'GREEN' },
      { indicator: 'Días de cartera', value: 52, status: 'RED' },
    ],
    'Procura': [
      { indicator: 'Proveedores confiables', value: 75, status: 'GREEN' },
      { indicator: 'Tiempo de entrega de proveedores', value: 12, status: 'GREEN' },
    ],
    'IT': [
      { indicator: 'Disponibilidad de sistemas', value: 99.5, status: 'GREEN' },
      { indicator: 'Tiempo de resolución de incidentes', value: 2.5, status: 'GREEN' },
    ],
    'Ambiental': [
      { indicator: 'Reducción de residuos', value: 8, status: 'YELLOW' },
    ],
  },
};

/* ============================================================================
   Mediciones
============================================================================ */

export const MOCK_MEASUREMENTS: QcMeasurement[] = [
  {
    id: 'meas-1', indicatorVersionId: 'iv-1', periodId: 'period-1', value: 87, status: 'APPROVED',
    trafficLight: 'GREEN', submittedById: 'u1', reviewedById: 'u2', reviewedAt: '2026-08-25T10:00:00Z',
    observation: 'Buen rendimiento este mes', createdAt: '2026-08-20T08:00:00Z', updatedAt: '2026-08-25T10:00:00Z',
    version: { id: 'iv-1', frequency: 'Mensual', direction: 'Mínimo (>=)', formula: null, inputMode: 'DIRECT_VALUE', displayAsPercent: false, aggregation: 'LAST',
      indicator: { id: 'ind-1', code: 'COM-01', name: 'Solicitudes adjudicadas', chartType: 'LINE',
        process: { id: 'p1', code: 'COM', name: 'Comercial' } },
      targets: [{ id: 't1', targetValue: 80, unit: '%', thresholds: {} }] },
    period: { id: 'period-1', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T23:59:59Z', dueDate: '2026-09-05T23:59:59Z', status: 'OPEN' },
    submittedBy: { email: 'maria.garcia@corp.com' }, reviewedBy: { email: 'admin@test.com' },
    inputs: [],
  },
  {
    id: 'meas-2', indicatorVersionId: 'iv-2', periodId: 'period-1', value: 94, status: 'SUBMITTED',
    trafficLight: 'RED', submittedById: 'u3', reviewedById: null, reviewedAt: null,
    observation: 'Necesita mejora en la calidad', createdAt: '2026-08-22T14:00:00Z', updatedAt: '2026-08-22T14:00:00Z',
    version: { id: 'iv-2', frequency: 'Mensual', direction: 'Mínimo (>=)', formula: null, inputMode: 'DIRECT_VALUE', displayAsPercent: false, aggregation: 'LAST',
      indicator: { id: 'ind-2', code: 'OPE-02', name: 'Calidad de entregables', chartType: 'LINE',
        process: { id: 'p2', code: 'OPE', name: 'Operaciones' } },
      targets: [{ id: 't2', targetValue: 95, unit: '%', thresholds: {} }] },
    period: { id: 'period-1', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T23:59:59Z', dueDate: '2026-09-05T23:59:59Z', status: 'OPEN' },
    submittedBy: { email: 'carlos.lopez@corp.com' }, reviewedBy: null,
    inputs: [],
  },
  {
    id: 'meas-3', indicatorVersionId: 'iv-3', periodId: 'period-1', value: 6, status: 'REJECTED',
    trafficLight: 'RED', submittedById: 'u4', reviewedById: 'u2', reviewedAt: '2026-08-26T16:00:00Z',
    observation: 'Horas por debajo del mínimo requerido', createdAt: '2026-08-21T09:00:00Z', updatedAt: '2026-08-26T16:00:00Z',
    version: { id: 'iv-3', frequency: 'Mensual', direction: 'Mínimo (>=)', formula: null, inputMode: 'DIRECT_VALUE', displayAsPercent: false, aggregation: 'SUM',
      indicator: { id: 'ind-3', code: 'RRHH-02', name: 'Horas de capacitación', chartType: 'BAR',
        process: { id: 'p3', code: 'RRHH', name: 'Recursos Humanos' } },
      targets: [{ id: 't3', targetValue: 8, unit: 'horas', thresholds: {} }] },
    period: { id: 'period-1', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T23:59:59Z', dueDate: '2026-09-05T23:59:59Z', status: 'OPEN' },
    submittedBy: { email: 'ana.martinez@corp.com' }, reviewedBy: { email: 'admin@test.com' },
    inputs: [],
  },
  {
    id: 'meas-4', indicatorVersionId: 'iv-4', periodId: 'period-1', value: 52, status: 'DRAFT',
    trafficLight: null, submittedById: 'u5', reviewedById: null, reviewedAt: null,
    observation: null, createdAt: '2026-08-28T11:00:00Z', updatedAt: '2026-08-28T11:00:00Z',
    version: { id: 'iv-4', frequency: 'Mensual', direction: 'Máximo (<=)', formula: null, inputMode: 'DIRECT_VALUE', displayAsPercent: false, aggregation: 'AVG',
      indicator: { id: 'ind-4', code: 'FIN-02', name: 'Días de cartera', chartType: 'LINE',
        process: { id: 'p4', code: 'FIN', name: 'Finanzas' } },
      targets: [{ id: 't4', targetValue: 45, unit: 'días', thresholds: {} }] },
    period: { id: 'period-1', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T23:59:59Z', dueDate: '2026-09-05T23:59:59Z', status: 'OPEN' },
    submittedBy: { email: 'pedro.sanchez@corp.com' }, reviewedBy: null,
    inputs: [],
  },
  {
    id: 'meas-5', indicatorVersionId: 'iv-5', periodId: 'period-1', value: 92, status: 'APPROVED',
    trafficLight: 'GREEN', submittedById: 'u6', reviewedById: 'u2', reviewedAt: '2026-08-24T09:00:00Z',
    observation: 'Cumplimiento aceptable', createdAt: '2026-08-19T15:00:00Z', updatedAt: '2026-08-24T09:00:00Z',
    version: { id: 'iv-5', frequency: 'Mensual', direction: 'Mínimo (>=)', formula: null, inputMode: 'DIRECT_VALUE', displayAsPercent: false, aggregation: 'LAST',
      indicator: { id: 'ind-5', code: 'OPE-01', name: 'Cumplimiento de cronograma', chartType: 'LINE',
        process: { id: 'p2', code: 'OPE', name: 'Operaciones' } },
      targets: [{ id: 't5', targetValue: 90, unit: '%', thresholds: {} }] },
    period: { id: 'period-1', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T23:59:59Z', dueDate: '2026-09-05T23:59:59Z', status: 'OPEN' },
    submittedBy: { email: 'laura.rios@corp.com' }, reviewedBy: { email: 'admin@test.com' },
    inputs: [],
  },
];

/* ============================================================================
   Auditoría
============================================================================ */

export const MOCK_AUDIT: QcAuditEntry[] = [
  { id: 'a1', actorId: 'u2', action: 'UPDATE', entityType: 'Measurement', entityId: 'meas-1', before: { status: 'SUBMITTED' }, after: { status: 'APPROVED' }, ip: '192.168.1.10', route: '/api/quality-control/measurements/meas-1/review', createdAt: '2026-08-25T10:00:00Z', actor: { id: 'u2', email: 'admin@test.com' } },
  { id: 'a2', actorId: 'u2', action: 'UPDATE', entityType: 'Measurement', entityId: 'meas-3', before: { status: 'SUBMITTED' }, after: { status: 'REJECTED', observation: 'Horas por debajo del mínimo requerido' }, ip: '192.168.1.10', route: '/api/quality-control/measurements/meas-3/review', createdAt: '2026-08-26T16:00:00Z', actor: { id: 'u2', email: 'admin@test.com' } },
  { id: 'a3', actorId: 'u3', action: 'CREATE', entityType: 'Measurement', entityId: 'meas-2', before: null, after: { value: 94, indicatorCode: 'OPE-02' }, ip: '192.168.1.15', route: '/api/quality-control/measurements', createdAt: '2026-08-22T14:00:00Z', actor: { id: 'u3', email: 'carlos.lopez@corp.com' } },
  { id: 'a4', actorId: 'u1', action: 'CREATE', entityType: 'Indicator', entityId: 'ind-new-1', before: null, after: { code: 'AMB-02', name: 'Índice de satisfacción ambiental', processId: 'p-amb' }, ip: '192.168.1.20', route: '/api/quality-control/admin/indicators', createdAt: '2026-08-20T11:00:00Z', actor: { id: 'u1', email: 'maria.garcia@corp.com' } },
  { id: 'a5', actorId: 'u2', action: 'UPDATE', entityType: 'Process', entityId: 'p-it', before: { name: 'Tecnología' }, after: { name: 'IT' }, ip: '192.168.1.10', route: '/api/quality-control/admin/processes/p-it', createdAt: '2026-08-18T09:00:00Z', actor: { id: 'u2', email: 'admin@test.com' } },
  { id: 'a6', actorId: 'u2', action: 'CREATE', entityType: 'User', entityId: 'u-new-1', before: null, after: { email: 'nuevo.usuario@corp.com', roleCodes: ['QC_OWNER'] }, ip: '192.168.1.10', route: '/api/quality-control/users', createdAt: '2026-08-15T14:00:00Z', actor: { id: 'u2', email: 'admin@test.com' } },
  { id: 'a7', actorId: 'u4', action: 'CREATE', entityType: 'Measurement', entityId: 'meas-4', before: null, after: { value: 52, indicatorCode: 'FIN-02' }, ip: '192.168.1.25', route: '/api/quality-control/measurements', createdAt: '2026-08-28T11:00:00Z', actor: { id: 'u4', email: 'ana.martinez@corp.com' } },
];

/* ============================================================================
   Procesos
============================================================================ */

export const MOCK_PROCESSES: QcAdminProcess[] = [
  {
    id: 'p-com', organizationId: 'org-1', code: 'COM', name: 'Comercial', parentId: null,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    children: [
      { id: 'p-com-sub1', organizationId: 'org-1', code: 'COM-VTA', name: 'Ventas', parentId: 'p-com', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', children: [], qc_indicators: [{ id: 'ind-1', code: 'COM-01', name: 'Solicitudes adjudicadas', chartType: 'LINE' }] },
      { id: 'p-com-sub2', organizationId: 'org-1', code: 'COM-MKT', name: 'Marketing', parentId: 'p-com', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', children: [], qc_indicators: [{ id: 'ind-2', code: 'COM-02', name: 'Calificación de clientes', chartType: 'LINE' }] },
    ],
    qc_indicators: [],
  },
  {
    id: 'p-ope', organizationId: 'org-1', code: 'OPE', name: 'Operaciones', parentId: null,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    children: [
      { id: 'p-ope-sub1', organizationId: 'org-1', code: 'OPE-PRJ', name: 'Proyectos', parentId: 'p-ope', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', children: [], qc_indicators: [{ id: 'ind-4', code: 'OPE-01', name: 'Cumplimiento de cronograma', chartType: 'LINE' }, { id: 'ind-5', code: 'OPE-02', name: 'Calidad de entregables', chartType: 'LINE' }] },
    ],
    qc_indicators: [],
  },
  {
    id: 'p-rrhh', organizationId: 'org-1', code: 'RRHH', name: 'Recursos Humanos', parentId: null,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    children: [],
    qc_indicators: [{ id: 'ind-6', code: 'RRHH-01', name: 'Rotación de personal', chartType: 'LINE' }, { id: 'ind-7', code: 'RRHH-02', name: 'Horas de capacitación', chartType: 'BAR' }],
  },
  {
    id: 'p-fin', organizationId: 'org-1', code: 'FIN', name: 'Finanzas', parentId: null,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    children: [],
    qc_indicators: [{ id: 'ind-8', code: 'FIN-01', name: 'Margen de ganancia', chartType: 'LINE' }, { id: 'ind-9', code: 'FIN-02', name: 'Días de cartera', chartType: 'LINE' }],
  },
  {
    id: 'p-pro', organizationId: 'org-1', code: 'PRO', name: 'Procura', parentId: null,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    children: [],
    qc_indicators: [{ id: 'ind-10', code: 'PRO-01', name: 'Proveedores confiables', chartType: 'PIE' }],
  },
  {
    id: 'p-it', organizationId: 'org-1', code: 'IT', name: 'Tecnología', parentId: null,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    children: [],
    qc_indicators: [{ id: 'ind-11', code: 'IT-01', name: 'Disponibilidad de sistemas', chartType: 'LINE' }],
  },
];

/* ============================================================================
   Usuarios
============================================================================ */

export const MOCK_USERS: QcUserListItem[] = [
  { id: 'u1', email: 'admin@test.com', firstName: 'Admin', lastName: 'ERP', username: 'admin', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-01-10T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r1', code: 'QC_ADMIN', description: 'Administrador del Sistema de Calidad' } }], processAssignments: [] },
  { id: 'u2', email: 'administrador@corp.com', firstName: 'Admin', lastName: 'Calidad', username: 'qc.admin', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-02-15T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r1', code: 'QC_ADMIN', description: 'Administrador del Sistema de Calidad' } }], processAssignments: [] },
  { id: 'u3', email: 'carlos.lopez@corp.com', firstName: 'Carlos', lastName: 'López', username: 'clopez', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-03-20T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r3', code: 'QC_OWNER', description: 'Responsable de Proceso' } }], processAssignments: [{ process: { id: 'p-ope', code: 'OPE', name: 'Operaciones' } }] },
  { id: 'u4', email: 'ana.martinez@corp.com', firstName: 'Ana', lastName: 'Martínez', username: 'amartinez', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-04-10T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r3', code: 'QC_OWNER', description: 'Responsable de Proceso' } }], processAssignments: [{ process: { id: 'p-rrhh', code: 'RRHH', name: 'Recursos Humanos' } }] },
  { id: 'u5', email: 'pedro.sanchez@corp.com', firstName: 'Pedro', lastName: 'Sánchez', username: 'psanchez', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-05-05T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r3', code: 'QC_OWNER', description: 'Responsable de Proceso' } }], processAssignments: [{ process: { id: 'p-fin', code: 'FIN', name: 'Finanzas' } }] },
  { id: 'u6', email: 'laura.rios@corp.com', firstName: 'Laura', lastName: 'Ríos', username: 'lrios', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-06-01T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r2', code: 'QC_DIRECTOR', description: 'Director Ejecutivo' } }], processAssignments: [] },
  { id: 'u7', email: 'maria.garcia@corp.com', firstName: 'María', lastName: 'García', username: 'mgarcia', status: 'ACTIVE', emailVerified: true, deletedAt: null, createdAt: '2026-06-15T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [{ role: { id: 'r3', code: 'QC_OWNER', description: 'Responsable de Proceso' } }], processAssignments: [{ process: { id: 'p-com', code: 'COM', name: 'Comercial' } }] },
  { id: 'u8', email: 'roberto.diaz@corp.com', firstName: 'Roberto', lastName: 'Díaz', username: 'rdiaz', status: 'INACTIVE', emailVerified: false, deletedAt: null, createdAt: '2026-07-20T00:00:00Z', organization: { name: 'Business & Development' }, qc_user_roles: [], processAssignments: [] },
];

export const MOCK_ROLES: QcRoleWithPermissions[] = [
  { id: 'r1', code: 'QC_ADMIN', description: 'Administrador del Sistema de Calidad', qc_role_permissions: [{ permission: { id: 'p1', code: 'QC_CREATE_PROCESS', description: 'Crear procesos' } }, { permission: { id: 'p2', code: 'QC_UPDATE_PROCESS', description: 'Editar procesos' } }, { permission: { id: 'p3', code: 'QC_MANAGE_USERS', description: 'Gestionar usuarios' } }] },
  { id: 'r2', code: 'QC_DIRECTOR', description: 'Director Ejecutivo', qc_role_permissions: [{ permission: { id: 'p4', code: 'QC_VIEW_REPORTS', description: 'Ver reportes' } }, { permission: { id: 'p5', code: 'QC_EXPORT_REPORTS', description: 'Exportar reportes' } }] },
  { id: 'r3', code: 'QC_OWNER', description: 'Responsable de Proceso', qc_role_permissions: [{ permission: { id: 'p6', code: 'QC_SUBMIT_MEASUREMENT', description: 'Enviar mediciones' } }] },
];

export const MOCK_PERMISSIONS: QcPermissionItem[] = [
  { id: 'p1', code: 'QC_CREATE_PROCESS', description: 'Crear procesos' },
  { id: 'p2', code: 'QC_UPDATE_PROCESS', description: 'Editar procesos' },
  { id: 'p3', code: 'QC_MANAGE_USERS', description: 'Gestionar usuarios' },
  { id: 'p4', code: 'QC_VIEW_REPORTS', description: 'Ver reportes' },
  { id: 'p5', code: 'QC_EXPORT_REPORTS', description: 'Exportar reportes' },
  { id: 'p6', code: 'QC_SUBMIT_MEASUREMENT', description: 'Enviar mediciones' },
  { id: 'p7', code: 'QC_REVIEW_MEASUREMENT', description: 'Revisar mediciones' },
  { id: 'p8', code: 'QC_MANAGE_INDICATORS', description: 'Gestionar indicadores' },
];
