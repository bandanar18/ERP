import { getPmToken, PmApiError } from './client';
import type { Company, CreateProjectDto, Project, ProjectStats, UpdateProjectDto, ProjectExpense, ProjectCollection } from '../types';
import { resolveMediaUrl } from '../utils/media';

/**
 * Servicio de proyectos del módulo PM.
 * Usa los endpoints legacy del ERP (`/api/projects/*`) con el token del módulo.
 */
const API_BASE = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/projects`;

async function projectsFetch<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const token = getPmToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new PmApiError(0, `No se pudo conectar con el servidor (${API_BASE}).`);
  }

  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = (data as { error?: string; message?: string } | undefined)?.error
      ?? (data as { error?: string; message?: string } | undefined)?.message
      ?? `Error ${response.status}`;
    throw new PmApiError(response.status, message, data);
  }

  return data as T;
}

/**
 * Proyecto "detailed" tal como lo devuelve el backend legacy (camelCase:
 * projectId/projectCode/projectName y manager con managerName).
 */
interface LegacyDetailedProject {
  id?: string;
  code?: string;
  fullName?: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  shortName?: string | null;
  description?: string | null;
  status: Project['status'];
  startDate?: string | null;
  endDate?: string | null;
  companyId: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
    legalName?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  companyName?: string;
  managerId?: string | null;
  offeredAmount: number;
  estimatedCost?: number;
  createdAt?: string;
  updatedAt?: string;
  manager?: {
    id?: string;
    managerId?: string;
    firstName?: string;
    lastName?: string;
    managerName?: string;
    managerEmail?: string;
    email?: string;
    phone?: string;
    managerPhone?: string;
  } | null;
  lastProgress?: {
    id: string;
    date?: string;
    actualProgress?: string;
    plannedProgress?: string;
    attentionPoints?: string;
  } | null;
}

/**
 * Normaliza un proyecto del backend legacy (projectId/projectCode/projectName
 * + manager con managerName) al tipo Project del móvil (id/code/fullName +
 * manager con firstName/lastName), igual que hacemos con las empresas.
 */
const normalizeProject = (p: LegacyDetailedProject): Project => ({
  id: p.projectId ?? p.id ?? '',
  code: p.projectCode ?? p.code ?? '',
  fullName: p.projectName ?? p.fullName ?? '',
  shortName: p.shortName ?? undefined,
  description: p.description ?? undefined,
  managerId: p.managerId ?? undefined,
  companyId: p.companyId,
  startDate: p.startDate ?? undefined,
  endDate: p.endDate ?? undefined,
  status: p.status,
  offeredAmount: p.offeredAmount,
  estimatedCost: p.estimatedCost,
  createdAt: p.createdAt ?? '',
  updatedAt: p.updatedAt ?? '',
  company: p.company
    ? {
        id: p.company.id,
        name: p.company.name,
        logoUrl: resolveMediaUrl(p.company.logoUrl),
        legalName: p.company.legalName,
        address: p.company.address,
        phone: p.company.phone,
        email: p.company.email,
      }
    : p.companyName
      ? { id: p.companyId, name: p.companyName }
      : undefined,
  manager: p.manager
    ? {
        id: p.manager.managerId ?? p.manager.id ?? p.managerId ?? '',
        firstName: p.manager.managerName ?? p.manager.firstName ?? '',
        lastName: p.manager.lastName ?? '',
        email: p.manager.managerEmail ?? p.manager.email,
        phone: (p.manager as any).phone || (p.manager as any).managerPhone || (p as any).pm_users?.phone || undefined,
        managerName: p.manager.managerName,
        managerEmail: p.manager.managerEmail ?? p.manager.email,
        managerPhone: (p.manager as any).phone || (p.manager as any).managerPhone || (p as any).pm_users?.phone || undefined,
      }
    : (p as any).pm_users
      ? {
          id: (p as any).pm_users.id ?? p.managerId ?? '',
          firstName: `${(p as any).pm_users.firstName || ''} ${(p as any).pm_users.lastName || ''}`.trim() || (p as any).pm_users.email,
          lastName: '',
          email: (p as any).pm_users.email,
          phone: (p as any).pm_users.phone || undefined,
          managerName: `${(p as any).pm_users.firstName || ''} ${(p as any).pm_users.lastName || ''}`.trim() || (p as any).pm_users.email,
          managerEmail: (p as any).pm_users.email,
          managerPhone: (p as any).pm_users.phone || undefined,
        }
      : undefined,
  financialValuations: (p as any).financialValuations ?? (p as any).pm_financial_valuations ?? undefined,
  lastProgress: p.lastProgress ?? undefined,
  actualPhysicalProgress: (p as any).actualPhysicalProgress || p.lastProgress?.actualProgress || null,
  plannedPhysicalProgress: (p as any).plannedPhysicalProgress || p.lastProgress?.plannedProgress || null,
  advanceAmount: (p as any).advanceAmount != null ? Number((p as any).advanceAmount) : 0,
  amortizedAmount: (p as any).amortizedAmount != null ? Number((p as any).amortizedAmount) : 0,
  cuentasPorPagar: (p as any).cuentasPorPagar != null ? Number((p as any).cuentasPorPagar) : ((p as any).accountsPayable != null ? Number((p as any).accountsPayable) : 0),
  accountsPayable: (p as any).cuentasPorPagar != null ? Number((p as any).cuentasPorPagar) : ((p as any).accountsPayable != null ? Number((p as any).accountsPayable) : 0),
  actualCost: (p as any).actualCost != null ? Number((p as any).actualCost) : 0,
  billedAmount: (p as any).billedAmount != null ? Number((p as any).billedAmount) : 0,
  collectedAmount: (p as any).collectedAmount != null ? Number((p as any).collectedAmount) : 0,
});

// --- In-Memory Cache ---
// Evita peticiones duplicadas al cambiar de pestañas en el ERP
let _getAllCache: Promise<{ projects: Project[]; summary?: unknown; company?: any }> | null = null;
let _getStatsCache: Promise<ProjectStats> | null = null;
let _getCompaniesCache: Promise<{ companies: Company[] }> | null = null;

export const projectService = {
  clearCache: () => {
    _getAllCache = null;
    _getStatsCache = null;
    _getCompaniesCache = null;
  },

  getAll: async (forceRefresh = false): Promise<{ projects: Project[]; summary?: unknown; company?: any }> => {
    if (!forceRefresh && _getAllCache) return _getAllCache;

    _getAllCache = projectsFetch<{ projects: LegacyDetailedProject[]; summary?: unknown; company?: any }>('')
      .then(data => ({ ...data, company: data.company, projects: (data.projects ?? []).map(normalizeProject) }))
      .catch(e => { _getAllCache = null; throw e; });

    return _getAllCache;
  },

  getStats: async (forceRefresh = false): Promise<ProjectStats> => {
    if (!forceRefresh && _getStatsCache) return _getStatsCache;

    _getStatsCache = projectsFetch<{ projects?: Project[]; summary?: { totalProjects: number } }>('')
      .then(data => {
        if (data.summary) {
          return {
            totalProjects: data.summary.totalProjects,
            projectsInProgress: (data.projects ?? []).filter((p: any) => p.status === 'IN_PROGRESS').length,
          };
        }
        return { totalProjects: 0, projectsInProgress: 0 };
      })
      .catch(e => { _getStatsCache = null; throw e; });

    return _getStatsCache;
  },

  getById: async (id: string): Promise<Project> => {
    const data = await projectsFetch<LegacyDetailedProject>(`/${id}`);
    return normalizeProject(data);
  },

  create: async (payload: CreateProjectDto) => {
    const res = await projectsFetch<Project>('', 'POST', payload);
    projectService.clearCache();
    return res;
  },

  update: async (id: string, payload: UpdateProjectDto) => {
    const res = await projectsFetch<Project>(`/${id}`, 'PUT', payload);
    projectService.clearCache();
    return res;
  },

  getCompanies: async (forceRefresh = false): Promise<{ companies: Company[] }> => {
    if (!forceRefresh && _getCompaniesCache) return _getCompaniesCache;

    _getCompaniesCache = projectsFetch<any>('/companies')
      .then(data => ({
        companies: (data.companies ?? []).map((c: any) => ({
          id: c.companyId,
          name: c.companyName,
          taxId: c.taxId,
          legalName: c.legalName,
          address: c.address,
          phone: c.phone,
          email: c.email,
          logoUrl: resolveMediaUrl(c.logoUrl),
        })),
      }))
      .catch(e => { _getCompaniesCache = null; throw e; });

    return _getCompaniesCache;
  },

  getProjectsByCompany: async (companyId: string) => {
    const data = await projectsFetch<{ projects: LegacyDetailedProject[]; summary: unknown }>(
      `/company/${companyId}`,
    );
    return { ...data, projects: (data.projects ?? []).map(normalizeProject) };
  },

  updateAdvance: async (projectId: string, advanceAmount: number, amortizedAmount: number) => {
    return projectsFetch(`/${projectId}/advance`, 'PATCH', { advanceAmount, amortizedAmount });
  },

  getExpenses: async (projectId: string): Promise<ProjectExpense[]> => {
    return projectsFetch<ProjectExpense[]>(`/${projectId}/expenses`);
  },

  addExpense: async (
    projectId: string,
    expense: { description: string; amountUsd: number; expenseDate?: string }
  ): Promise<ProjectExpense> => {
    return projectsFetch<ProjectExpense>(`/${projectId}/expenses`, 'POST', expense);
  },

  updateExpense: async (
    expenseId: string,
    expense: { description?: string; amountUsd?: number; expenseDate?: string }
  ): Promise<ProjectExpense> => {
    return projectsFetch<ProjectExpense>(`/expenses/${expenseId}`, 'PUT', expense);
  },

  removeExpense: async (expenseId: string): Promise<{ message: string }> => {
    return projectsFetch<{ message: string }>(`/expenses/${expenseId}`, 'DELETE');
  },

  getCollections: async (projectId: string): Promise<ProjectCollection[]> => {
    return projectsFetch<ProjectCollection[]>(`/${projectId}/collections`);
  },

  addCollection: async (
    projectId: string,
    collection: {
      amountUsd: number;
      reference?: string;
      collectedAt?: string;
      valuationId?: string;
      grossAmountUsd?: number;
      amortizedAmountUsd?: number;
    }
  ): Promise<ProjectCollection> => {
    return projectsFetch<ProjectCollection>(`/${projectId}/collections`, 'POST', collection);
  },

  updateCollection: async (
    collectionId: string,
    collection: {
      amountUsd: number;
      reference?: string;
      collectedAt?: string;
      valuationId?: string | null;
      grossAmountUsd?: number | null;
      amortizedAmountUsd?: number;
    }
  ): Promise<ProjectCollection> => {
    return projectsFetch<ProjectCollection>(`/collections/${collectionId}`, 'PUT', collection);
  },

  removeCollection: async (collectionId: string): Promise<{ message: string }> => {
    return projectsFetch<{ message: string }>(`/collections/${collectionId}`, 'DELETE');
  },
};
