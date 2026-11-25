import { PmCompany } from '@prisma/client';

export type CompanyWithRelations = PmCompany & {
  projects?: { id: string; code: string; fullName: string; status: string }[];
  _count?: { users: number; pm_projects: number };
};

export interface CreateCompanyRequest {
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  taxId?: string | null;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

export interface CompanyResponse {
  id: string;
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyListResponse extends CompanyResponse {
  _count?: {
    users: number;
    projects: number;
  };
}
