import type { CreateProjectDto, Project, UpdateProjectDto, ProjectExpense, ProjectCollection } from "../interfaces/project.types";
import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";

const API_URL = "/api/projects";

export interface ProjectsResponse {
  summary: {
    totalProjects: number;
    totalCompanies: number;
    projectsWithManager: number;
    projectsWithoutManager: number;
  };
  projects: any[]; // Usamos any[] temporalmente para mapear
}

export const projectService = {
  async getAll(): Promise<Project[]> {
    const response = await fetchWithRefresh(API_URL, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    // Normalizar: Si es el objeto de Gestión, devolver solo los proyectos mapeados
    if (data.projects && Array.isArray(data.projects)) {
      // Si la respuesta también trae data de la empresa (como en direccion), la anexamos
      const companyData = data.company || null;
      
      const mappedProjects = data.projects.map((p: any) => ({
        ...p,
        id: p.projectId || p.id,
        code: p.projectCode || p.code,
        fullName: p.projectName || p.fullName,
        shortName: p.shortName,
        description: p.description,
        status: p.status,
        companyId: p.companyId,
        startDate: p.startDate,
        endDate: p.endDate,
        offeredAmount: p.offeredAmount,
        estimatedCost: p.estimatedCost,
        lastProgress: p.lastProgress,
        actualPhysicalProgress: p.actualPhysicalProgress || p.lastProgress?.actualProgress || null,
        plannedPhysicalProgress: p.plannedPhysicalProgress || p.lastProgress?.plannedProgress || null,
        managerId: p.managerId,
        advanceAmount: p.advanceAmount != null ? Number(p.advanceAmount) : 0,
        amortizedAmount: p.amortizedAmount != null ? Number(p.amortizedAmount) : 0,
        cuentasPorPagar: p.cuentasPorPagar != null ? Number(p.cuentasPorPagar) : (p.accountsPayable != null ? Number(p.accountsPayable) : 0),
        accountsPayable: p.cuentasPorPagar != null ? Number(p.cuentasPorPagar) : (p.accountsPayable != null ? Number(p.accountsPayable) : 0),
        actualCost: p.actualCost != null ? Number(p.actualCost) : 0,
        billedAmount: p.billedAmount != null ? Number(p.billedAmount) : 0,
        collectedAmount: p.collectedAmount != null ? Number(p.collectedAmount) : 0,
        financialValuations: p.financialValuations,
        company: p.company || { id: p.companyId, name: p.companyName }
      })) as Project[];
      
      // Adjuntamos la información de la empresa y el resumen si existen
      if (companyData) {
        Object.assign(mappedProjects, { company: companyData });
      }
      if (data.summary) {
        Object.assign(mappedProjects, { summary: data.summary });
      }
      return mappedProjects;
    }

    return data as Project[];
  },

  async getById(id: string): Promise<any> {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    if (data && !data.manager && data.pm_users) {
      data.manager = {
        managerId: data.pm_users.id,
        managerEmail: data.pm_users.email,
        managerName: `${data.pm_users.firstName || ''} ${data.pm_users.lastName || ''}`.trim() || data.pm_users.email,
        phone: data.pm_users.phone || null,
        managerPhone: data.pm_users.phone || null,
      };
    }

    return data;
  },

  async getCompanies(): Promise<{ id: string; name: string; logoUrl?: string }[]> {
    const response = await fetchWithRefresh(`${API_URL}/companies`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    // Si viene en formato objeto { totalCompanies, companies }
    if (data.companies && Array.isArray(data.companies)) {
        return data.companies.map((c: any) => ({
            id: c.companyId || c.id,
            name: c.companyName || c.name,
            logoUrl: c.logoUrl
        }));
    }

    return data;
  },

  async getProjectsByCompany(companyId: string): Promise<{ projects: Project[], summary: any }> {
    const response = await fetchWithRefresh(`${API_URL}/company/${companyId}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    const rawProjects = data.projects || [];
    const normalizedProjects = rawProjects.map((p: any) => ({
      id: p.projectId || p.id,
      code: p.projectCode || p.code,
      fullName: p.projectName || p.fullName,
      shortName: p.shortName,
      description: p.description,
      status: p.status,
      companyId: p.companyId,
      startDate: p.startDate,
      endDate: p.endDate,
      company: { id: p.companyId, name: p.companyName || p.company?.name }
    })) as Project[];

    return { projects: normalizedProjects, summary: data.summary };
  },

  async create(project: CreateProjectDto): Promise<Project> {
    const response = await fetchWithRefresh(API_URL, {
      method: "POST",
      body: JSON.stringify(project),
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async update(id: string, project: UpdateProjectDto): Promise<Project> {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getStats() {
    const response = await fetchWithRefresh(API_URL, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    // Si es el formato de Gestión con summary
    if (data.summary) {
      return {
        totalProjects: data.summary.totalProjects,
        projectsInProgress: data.projects.filter((p: any) => p.status === 'IN_PROGRESS').length,
      };
    }

    // Fallback si devuelve array pelado
    if (Array.isArray(data)) {
      return {
        totalProjects: data.length,
        projectsInProgress: data.filter((p: any) => p.status === 'IN_PROGRESS').length,
      };
    }

    return { totalProjects: 0, projectsInProgress: 0 };
  },

  async assignManager(projectId: string, managerId: string): Promise<Project> {
    const response = await fetchWithRefresh(`${API_URL}/${projectId}/manager`, {
      method: "PUT",
      body: JSON.stringify({ managerId }),
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async updateAdvance(projectId: string, advanceAmount: number, amortizedAmount: number): Promise<any> {
    const response = await fetchWithRefresh(`${API_URL}/${projectId}/advance`, {
      method: "PATCH",
      body: JSON.stringify({ advanceAmount, amortizedAmount }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getExpenses(projectId: string): Promise<ProjectExpense[]> {
    const response = await fetchWithRefresh(`${API_URL}/${projectId}/expenses`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async addExpense(projectId: string, expense: { description: string; amountUsd: number; expenseDate?: string }): Promise<ProjectExpense> {
    const response = await fetchWithRefresh(`${API_URL}/${projectId}/expenses`, {
      method: "POST",
      body: JSON.stringify(expense),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async updateExpense(
    expenseId: string,
    expense: { description?: string; amountUsd?: number; expenseDate?: string }
  ): Promise<ProjectExpense> {
    const response = await fetchWithRefresh(`${API_URL}/expenses/${expenseId}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async removeExpense(expenseId: string): Promise<{ message: string }> {
    const response = await fetchWithRefresh(`${API_URL}/expenses/${expenseId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getCollections(projectId: string): Promise<ProjectCollection[]> {
    const response = await fetchWithRefresh(`${API_URL}/${projectId}/collections`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async addCollection(
    projectId: string,
    collection: {
      amountUsd: number;
      reference?: string;
      collectedAt?: string;
      valuationId?: string;
      grossAmountUsd?: number;
      amortizedAmountUsd?: number;
    }
  ): Promise<ProjectCollection> {
    const response = await fetchWithRefresh(`${API_URL}/${projectId}/collections`, {
      method: "POST",
      body: JSON.stringify(collection),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async updateCollection(
    collectionId: string,
    collection: {
      amountUsd: number;
      reference?: string;
      collectedAt?: string;
      valuationId?: string | null;
      grossAmountUsd?: number | null;
      amortizedAmountUsd?: number;
    }
  ): Promise<ProjectCollection> {
    const response = await fetchWithRefresh(`${API_URL}/collections/${collectionId}`, {
      method: "PUT",
      body: JSON.stringify(collection),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async removeCollection(collectionId: string): Promise<{ message: string }> {
    const response = await fetchWithRefresh(`${API_URL}/collections/${collectionId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async transferProjects(payload: {
    sourceCompanyId: string;
    targetCompanyId: string;
    projectIds: string[];
  }): Promise<{
    transferred: number;
    targetCompanyName: string;
  }> {
    const response = await fetchWithRefresh(`${API_URL}/transfer`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },
};
