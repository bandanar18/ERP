import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";

const API_URL = "/api/companies";

export interface CreateCompanyDto {
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  taxId?: string | null;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

export interface Company {
  id: string;
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    projects: number;
  };
}

export const companyService = {
  async getAll(): Promise<Company[]> {
    const response = await fetchWithRefresh(API_URL, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    return data;
  },

  async getById(id: string): Promise<Company> {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) throw data;

    return data;
  },

  async create(company: CreateCompanyDto): Promise<Company> {
    const response = await fetchWithRefresh(API_URL, {
      method: "POST",
      body: JSON.stringify(company),
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async update(id: string, company: UpdateCompanyDto): Promise<Company> {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(company),
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (!response.ok) throw data;
  },
};
