export type ObligationCategory = string;
export type ObligationStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO';

export interface ObligationPayment {
  id: string;
  amountUsd: number;
  paidAt: string;
  note?: string | null;
}

export interface Obligation {
  id: string;
  projectId: string;
  category: string;
  description: string;
  supplier?: string | null;
  invoiceNumber?: string | null;
  dueDate?: string | null;
  status: ObligationStatus;
  amountUsd: number;
  paidUsd: number;
  pendingUsd: number;
  paidAt?: string | null;
  isIncurred?: boolean;
  incurredAt?: string | null;
  supportDocument?: string | null;
  payments: ObligationPayment[];
}

export interface PayablesSummary {
  totalDebt: number;
  totalPaid: number;
  totalPending: number;
  actualCost?: number;
  totalIncurred?: number;
  directExpenses?: number;
  collectedAmount?: number;
  openCount: number;
  totalCount: number;
}

export interface ProjectAdvance {
  advanceAmount: number;
  amortizedAmount: number;
  pendingAmortization: number;
}

export interface PayablesSnapshot {
  items: Obligation[];
  summary: PayablesSummary;
  advance?: ProjectAdvance;
}

export interface CreateObligationRequest {
  projectId: string;
  category: string;
  description: string;
  supplier?: string | null;
  invoiceNumber?: string | null;
  amountUsd: number;
  dueDate?: string | null;
  isIncurred?: boolean;
  incurredAt?: string | null;
  supportDocument?: string | null;
}

export interface UpdateAdvanceRequest {
  advanceAmount: number;
  amortizedAmount: number;
}

export interface ProjectPayablesOverview {
  id: string;
  code: string;
  fullName: string;
  shortName?: string | null;
  status: string;
  company?: { id: string; name: string } | null;
  advanceAmount?: number;
  amortizedAmount?: number;
  summary: PayablesSummary;
}

export interface PayablesOverview {
  globalSummary: {
    totalDebt: number;
    totalPaid: number;
    totalPending: number;
    totalActualCost?: number;
    totalCollected?: number;
    totalAdvance?: number;
    totalAmortized?: number;
    openCount: number;
    totalProjects: number;
  };
  projects: ProjectPayablesOverview[];
}
