export const ProjectStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESCHEDULED: 'RESCHEDULED',
  DELAYED: 'DELAYED',
  // Legado / compatibilidad
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const PROJECT_STATUS_OPTIONS = [
  { value: ProjectStatus.IN_PROGRESS, label: "En ejecución" },
  { value: ProjectStatus.ON_HOLD, label: "Paralizado" },
  { value: ProjectStatus.RESCHEDULED, label: "Reprogramado" },
  { value: ProjectStatus.DELAYED, label: "Retraso" },
] as const;

export const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; barClass: string }
> = {
  IN_PROGRESS: {
    label: "En ejecución",
    badgeClass: "bg-[#4c9b7a] text-white",
    barClass: "bg-[#4c9b7a]",
  },
  ON_HOLD: {
    label: "Paralizado",
    badgeClass: "bg-[#71717a] text-white",
    barClass: "bg-[#71717a]",
  },
  RESCHEDULED: {
    label: "Reprogramado",
    badgeClass: "bg-[#5e8fc2] text-white",
    barClass: "bg-[#5e8fc2]",
  },
  DELAYED: {
    label: "Retraso",
    badgeClass: "bg-[#df6e84] text-white",
    barClass: "bg-[#df6e84]",
  },
  // Fallbacks de compatibilidad
  PLANNED: {
    label: "En ejecución",
    badgeClass: "bg-[#4c9b7a] text-white",
    barClass: "bg-[#4c9b7a]",
  },
  COMPLETED: {
    label: "Completado",
    badgeClass: "bg-[#5e8fc2] text-white",
    barClass: "bg-[#5e8fc2]",
  },
  CANCELLED: {
    label: "Cancelado",
    badgeClass: "bg-[#df6e84] text-white",
    barClass: "bg-[#df6e84]",
  },
};

export interface Project {
  id: string;
  code: string;
  fullName: string;
  shortName?: string;
  description?: string;
  managerId?: string;
  companyId: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  offeredAmount: number;
  estimatedCost?: number;
  actualPhysicalProgress?: string | null;
  plannedPhysicalProgress?: string | null;
  advanceAmount?: number;
  amortizedAmount?: number;
  cuentasPorPagar?: number;
  accountsPayable?: number;
  actualCost?: number;
  billedAmount?: number;
  collectedAmount?: number;
  lastProgress?: {
    id?: string;
    date?: string;
    actualProgress?: string | null;
    plannedProgress?: string | null;
    attentionPoints?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  manager?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    managerPhone?: string | null;
    email?: string | null;
    managerEmail?: string | null;
    managerName?: string | null;
  };
}

export interface CreateProjectDto {
  code: string;
  fullName: string;
  shortName?: string;
  description?: string;
  companyId: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  managerId?: string;
  offeredAmount: number;
  estimatedCost?: number;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

export interface ProjectExpense {
  id: string;
  projectId: string;
  description: string;
  amountUsd: number;
  expenseDate: string;
  createdById?: string | null;
  obligationPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCollection {
  id: string;
  projectId: string;
  valuationId?: string | null;
  reference?: string | null;
  grossAmountUsd?: number | null;
  amortizedAmountUsd?: number | null;
  amountUsd: number;
  collectedAt: string;
  createdById?: string | null;
  valuation?: {
    id: string;
    valuationNumber: string;
    invoiceNumber?: string | null;
    amountUsd: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}
