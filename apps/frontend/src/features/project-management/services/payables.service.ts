import { apiFetch } from '../api/api-client';
import type { PayablesSnapshot, CreateObligationRequest, PayablesOverview } from '../interfaces/payables.types';

const j = (body: unknown) => JSON.stringify(body);

export const payablesService = {
  getOverview: () => apiFetch<PayablesOverview>('/payables/overview'),
  getByProject: (projectId: string) => apiFetch<PayablesSnapshot>(`/payables/project/${projectId}`),
  create: (p: CreateObligationRequest) => apiFetch<PayablesSnapshot>('/payables', { method: 'POST', body: j(p) }),
  pay: (id: string, amountUsd?: number, note?: string) =>
    apiFetch<PayablesSnapshot>(`/payables/${id}/pay`, { method: 'POST', body: j({ amountUsd, note }) }),
  setPaid: (id: string, paid: boolean) =>
    apiFetch<PayablesSnapshot>(`/payables/${id}/paid`, { method: 'PATCH', body: j({ paid }) }),
  recognize: (id: string, dto: { isIncurred?: boolean; incurredAt?: string; supportDocument?: string; note?: string }) =>
    apiFetch<PayablesSnapshot>(`/payables/${id}/recognize`, { method: 'PATCH', body: j(dto) }),
  updateAdvance: (projectId: string, advanceAmount: number, amortizedAmount: number) =>
    apiFetch<PayablesSnapshot>(`/payables/project/${projectId}/advance`, {
      method: 'PATCH',
      body: j({ advanceAmount, amortizedAmount }),
    }),
  revertPayment: (paymentId: string) => apiFetch<PayablesSnapshot>(`/payables/payments/${paymentId}`, { method: 'DELETE' }),
  remove: (id: string) => apiFetch<PayablesSnapshot>(`/payables/${id}`, { method: 'DELETE' }),
};
