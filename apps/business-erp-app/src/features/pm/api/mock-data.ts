import type { Company, Project, ProjectStats } from '../types';

/* ============================================================================
   Proyectos de ejemplo
============================================================================ */

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1', code: 'PRJ-001', fullName: 'Sistema de Gestión de Calidad', shortName: 'SGC',
    description: 'Implementación del sistema de gestión de calidad ISO 9001 para toda la organización.',
    managerId: 'mgr-1', companyId: 'comp-1', startDate: '2026-01-15', endDate: '2026-06-30',
    status: 'IN_PROGRESS', offeredAmount: 150000, estimatedCost: 120000,
    createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-20T00:00:00Z',
    company: { id: 'comp-1', name: 'Business & Development' },
    manager: { id: 'mgr-1', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@corp.com' },
    lastProgress: { id: 'prog-1', date: '2026-08-15', actualProgress: '75', plannedProgress: '80', attentionPoints: 'Retraso en módulo de indicadores' },
  },
  {
    id: 'proj-2', code: 'PRJ-002', fullName: 'Plataforma E-Commerce Regional', shortName: 'E-Commerce',
    description: 'Desarrollo de plataforma de comercio electrónico para mercado regional.',
    managerId: 'mgr-2', companyId: 'comp-2', startDate: '2026-03-01', endDate: '2026-12-31',
    status: 'IN_PROGRESS', offeredAmount: 280000, estimatedCost: 210000,
    createdAt: '2026-02-20T00:00:00Z', updatedAt: '2026-08-25T00:00:00Z',
    company: { id: 'comp-2', name: 'TechVentures S.A.', logoUrl: undefined },
    manager: { id: 'mgr-2', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@corp.com' },
    lastProgress: { id: 'prog-2', date: '2026-08-10', actualProgress: '45', plannedProgress: '50', attentionPoints: undefined },
  },
  {
    id: 'proj-3', code: 'PRJ-003', fullName: 'Migración Infraestructura Cloud', shortName: 'Cloud Migr.',
    description: 'Migración de servidores on-premise a AWS con alta disponibilidad.',
    managerId: 'mgr-1', companyId: 'comp-1', startDate: '2026-04-01', endDate: '2026-09-30',
    status: 'IN_PROGRESS', offeredAmount: 95000, estimatedCost: 82000,
    createdAt: '2026-03-25T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z',
    company: { id: 'comp-1', name: 'Business & Development' },
    manager: { id: 'mgr-1', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@corp.com' },
    lastProgress: { id: 'prog-3', date: '2026-08-20', actualProgress: '68', plannedProgress: '70', attentionPoints: undefined },
  },
  {
    id: 'proj-4', code: 'PRJ-004', fullName: 'Consultoría ERP Financiero', shortName: 'ERP Fin.',
    description: 'Consultoría e implementación de módulo financiero ERP para cliente del sector bananero.',
    managerId: 'mgr-3', companyId: 'comp-3', startDate: '2025-11-01', endDate: '2026-05-15',
    status: 'COMPLETED', offeredAmount: 75000, estimatedCost: 65000,
    createdAt: '2025-10-20T00:00:00Z', updatedAt: '2026-05-15T00:00:00Z',
    company: { id: 'comp-3', name: 'AgroExpolis C.A.', logoUrl: undefined },
    manager: { id: 'mgr-3', firstName: 'Pedro', lastName: 'Sánchez', email: 'pedro.sanchez@corp.com' },
    lastProgress: null,
  },
  {
    id: 'proj-5', code: 'PRJ-005', fullName: 'App Móvil de Gestión de Proyectos', shortName: 'App PM',
    description: 'Aplicación móvil para gestión y seguimiento de proyectos en tiempo real.',
    managerId: 'mgr-2', companyId: 'comp-2', startDate: '2026-06-01', endDate: '2026-11-30',
    status: 'PLANNED', offeredAmount: 120000, estimatedCost: 98000,
    createdAt: '2026-05-15T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
    company: { id: 'comp-2', name: 'TechVentures S.A.', logoUrl: undefined },
    manager: { id: 'mgr-2', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@corp.com' },
    lastProgress: null,
  },
  {
    id: 'proj-6', code: 'PRJ-006', fullName: 'Auditoría de Seguridad Informática', shortName: 'Aud. Seg.',
    description: 'Auditoría integral de seguridad informática y Plan de Continuidad del Negocio.',
    managerId: 'mgr-1', companyId: 'comp-4', startDate: '2026-07-01', endDate: '2026-10-31',
    status: 'IN_PROGRESS', offeredAmount: 45000, estimatedCost: 38000,
    createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-08-22T00:00:00Z',
    company: { id: 'comp-4', name: 'Industrias Metalúrgicas del Norte', logoUrl: undefined },
    manager: { id: 'mgr-1', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@corp.com' },
    lastProgress: { id: 'prog-6', date: '2026-08-18', actualProgress: '30', plannedProgress: '35', attentionPoints: 'Pendiente acceso a servidores' },
  },
  {
    id: 'proj-7', code: 'PRJ-007', fullName: 'Desarrollo de Línea de Productos Sostenibles', shortName: 'Prod. Verdes',
    description: 'Investigación y desarrollo de nueva línea de productos eco-friendly.',
    managerId: 'mgr-3', companyId: 'comp-3', startDate: '2026-02-01', endDate: '2026-08-31',
    status: 'ON_HOLD', offeredAmount: 60000, estimatedCost: 52000,
    createdAt: '2026-01-25T00:00:00Z', updatedAt: '2026-07-15T00:00:00Z',
    company: { id: 'comp-3', name: 'AgroExpolis C.A.', logoUrl: undefined },
    manager: { id: 'mgr-3', firstName: 'Pedro', lastName: 'Sánchez', email: 'pedro.sanchez@corp.com' },
    lastProgress: null,
  },
  {
    id: 'proj-8', code: 'PRJ-008', fullName: 'Portal de Auto-Service para Empleados', shortName: 'Portal HR',
    description: 'Portal web para gestión de solicitudes de RRHH por parte de empleados.',
    managerId: 'mgr-2', companyId: 'comp-1', startDate: '2026-05-01', endDate: '2026-08-15',
    status: 'COMPLETED', offeredAmount: 35000, estimatedCost: 30000,
    createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z',
    company: { id: 'comp-1', name: 'Business & Development' },
    manager: { id: 'mgr-2', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@corp.com' },
    lastProgress: { id: 'prog-8', date: '2026-08-15', actualProgress: '100', plannedProgress: '100', attentionPoints: undefined },
  },
];

export const MOCK_COMPANIES: Company[] = [
  { id: 'comp-1', name: 'Business & Development', taxId: 'J-40123456-7', legalName: 'Business & Development C.A.', address: 'Caracas, Venezuela', phone: '+58 212-555-1234', email: 'info@bizdev.com', logoUrl: undefined },
  { id: 'comp-2', name: 'TechVentures S.A.', taxId: 'J-30987654-1', legalName: 'TechVentures Soluciones S.A.', address: 'Maracaibo, Venezuela', phone: '+58 261-555-5678', email: 'contacto@techventures.com', logoUrl: undefined },
  { id: 'comp-3', name: 'AgroExpolis C.A.', taxId: 'J-20567890-3', legalName: 'AgroExpolis Comercial C.A.', address: 'Valencia, Venezuela', phone: '+58 241-555-9012', email: 'ventas@agroexpolis.com', logoUrl: undefined },
  { id: 'comp-4', name: 'Industrias Metalúrgicas del Norte', taxId: 'J-40876543-2', legalName: 'Industrias Metalúrgicas del Norte C.A.', address: 'Barquisimeto, Venezuela', phone: '+58 251-555-3456', email: 'admin@imetnorte.com', logoUrl: undefined },
];

export const MOCK_STATS: ProjectStats = {
  totalProjects: 8,
  projectsInProgress: 5,
};
