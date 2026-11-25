import { PmProjectStatus } from '@prisma/client';

export interface CreateProjectRequest {
  code: string;
  fullName: string;
  shortName?: string;
  description?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  status?: PmProjectStatus;
  offeredAmount: number;
  estimatedCost?: number;
  actualPhysicalProgress?: string | null;
  plannedPhysicalProgress?: string | null;
}

export interface UpdateProjectRequest {
  fullName?: string;
  shortName?: string;
  description?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  status?: PmProjectStatus;
  offeredAmount?: number;
  estimatedCost?: number;
  actualPhysicalProgress?: string | null;
  plannedPhysicalProgress?: string | null;
}

export interface ProjectResponse {
  id: string;
  code: string;
  fullName: string;
  shortName: string | null;
  description: string | null;
  managerId: string | null;
  companyId: string;
  startDate: Date | null;
  endDate: Date | null;
  status: PmProjectStatus;
  offeredAmount: number;
  estimatedCost: number;
  advanceAmount?: number;
  amortizedAmount?: number;
  cuentasPorPagar?: number;
  actualCost?: number;
  collectedAmount?: number;
  billedAmount?: number;
  financialValuations?: any[];
  actualPhysicalProgress?: string | null;
  plannedPhysicalProgress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
