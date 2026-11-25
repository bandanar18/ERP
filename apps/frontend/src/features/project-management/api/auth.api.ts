import { apiFetch } from './api-client';
import type { LoginDto, AuthResponse, RedirectResponse, RegisterDto, PmUser } from '../types';

export const authApi = {
  login: (data: LoginDto) => apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkUsername: (username: string) =>
    apiFetch<{ available: boolean; error?: string }>('/auth/check-username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  register: (data: RegisterDto) => apiFetch<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  sendOtp: (email: string) => apiFetch<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyOtp: (email: string, code: string) => apiFetch<{ verified: boolean }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),
  requestPasswordReset: (email: string) => apiFetch<{ message: string }>('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (token: string, newPassword: string) => apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  updateProfile: (data: { firstName?: string | null; lastName?: string | null; username?: string | null; phone?: string | null }) =>
    apiFetch<PmUser>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  me: () => apiFetch<PmUser>('/auth/me'),
  redirect: () => apiFetch<RedirectResponse>('/auth/me/redirect'),
};
