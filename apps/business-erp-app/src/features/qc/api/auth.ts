import { qcApi } from './client';
import type { QcAuthResponse, QcLoginDto } from '../types';

/**
 * Endpoints de autenticación del módulo Quality Control.
 * Espeja los endpoints del backend: /api/quality-control/auth/*.
 */
export const qcAuthApi = {
  /** Acepta correo O nombre de usuario en `login`. */
  login: (dto: QcLoginDto) => qcApi.post<QcAuthResponse>('/auth/login', dto),

  me: (token: string) => qcApi.get<QcAuthResponse>('/auth/me', token),
};
