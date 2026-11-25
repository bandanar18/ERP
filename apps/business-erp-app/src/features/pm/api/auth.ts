import { pmApi } from './client';
import type { LoginDto, LoginResponse, PmUser, RegisterDto } from '../types';

/**
 * Endpoints de autenticación del módulo Project Management.
 * Espeja los endpoints del backend: /api/project-management/auth/*.
 */
export const pmAuthApi = {
  login: (dto: LoginDto) => pmApi.post<LoginResponse>('/auth/login', dto),

  register: (dto: RegisterDto) => pmApi.post<{ message: string }>('/auth/register', dto),

  checkUsername: (username: string) =>
    pmApi.post<{ available: boolean }>('/auth/check-username', { username }),

  sendOtp: (email: string) => pmApi.post<{ message: string }>('/auth/send-otp', { email }),

  verifyOtp: (email: string, code: string) =>
    pmApi.post<{ verified: boolean }>('/auth/verify-otp', { email, code }),

  requestPasswordReset: (email: string) =>
    pmApi.post<{ message: string }>('/auth/request-password-reset', { email }),

  resetPassword: (token: string, newPassword: string) =>
    pmApi.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  me: (token: string) => pmApi.get<PmUser>('/auth/me', token),

  meRedirect: (token: string) => pmApi.get<{ redirectUrl: string }>('/auth/me/redirect', token),

  /** Edita datos personales (firstName/lastName/username/phone). El email NO se edita. */
  updateProfile: (dto: { firstName?: string | null; lastName?: string | null; username?: string | null; phone?: string | null }, token?: string | null) =>
    pmApi.put<PmUser>('/auth/profile', dto, token),

  changePassword: (currentPassword: string, newPassword: string, token?: string | null) =>
    pmApi.put<{ message: string }>('/auth/change-password', { currentPassword, newPassword }, token),
};
