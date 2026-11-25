import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";

const API_URL = "/api/physical-progress";

export interface CreatePhysicalProgressDto {
  projectId: string;
  date: string;
  startDate?: string;
  endDate?: string;
  actualProgress: string;
  plannedProgress: string;
  attentionPoints?: string;
}

export interface UpdatePhysicalProgressDto {
  actualProgress?: string;
  plannedProgress?: string;
  attentionPoints?: string;
  startDate?: string;
  endDate?: string;
}

export const physicalProgressService = {
  async create(data: CreatePhysicalProgressDto) {
    const response = await fetchWithRefresh(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw result;
    return result;
  },

  async getByProject(projectId: string): Promise<any> {
    const response = await fetchWithRefresh(`${API_URL}/project/${projectId}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getByCompany(companyId: string) {
    const response = await fetchWithRefresh(`${API_URL}/company/${companyId}`, {
      method: "GET",
    });

    const result = await response.json();
    if (!response.ok) throw result;
    return result;
  },

  async getAll() {
    const response = await fetchWithRefresh(API_URL, {
      method: "GET",
    });

    const result = await response.json();
    if (!response.ok) throw result;
    return result;
  },

  async update(id: string, data: UpdatePhysicalProgressDto) {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw result;
    return result;
  }
};
