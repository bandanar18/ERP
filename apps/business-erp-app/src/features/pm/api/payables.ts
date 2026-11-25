import { pmApi } from './client';
import type {
  CreateObligationRequest,
  PayablesOverview,
  PayablesSnapshot,
} from '../types';

export const payablesService = {
  getOverview: () => pmApi.get<PayablesOverview>('/payables/overview'),
  getByProject: (projectId: string) => pmApi.get<PayablesSnapshot>(`/payables/project/${projectId}`),
  create: (p: CreateObligationRequest) => pmApi.post<PayablesSnapshot>('/payables', p),
  pay: (id: string, amountUsd?: number, note?: string) =>
    pmApi.post<PayablesSnapshot>(`/payables/${id}/pay`, { amountUsd, note }),
  setPaid: (id: string, paid: boolean) =>
    pmApi.patch<PayablesSnapshot>(`/payables/${id}/paid`, { paid }),
  recognize: (
    id: string,
    dto: { isIncurred?: boolean; incurredAt?: string; supportDocument?: string; note?: string }
  ) => pmApi.patch<PayablesSnapshot>(`/payables/${id}/recognize`, dto),
  updateAdvance: (projectId: string, advanceAmount: number, amortizedAmount: number) =>
    pmApi.patch<PayablesSnapshot>(`/payables/project/${projectId}/advance`, {
      advanceAmount,
      amortizedAmount,
    }),
  revertPayment: (paymentId: string) =>
    pmApi.delete<PayablesSnapshot>(`/payables/payments/${paymentId}`),
  remove: (id: string) => pmApi.delete<PayablesSnapshot>(`/payables/${id}`),
};
