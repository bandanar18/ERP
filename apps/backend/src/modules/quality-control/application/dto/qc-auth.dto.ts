import { z } from 'zod';

export const loginSchema = z.object({
  // Acepta email O nombre de usuario (el servicio resuelve cuál es).
  login: z.string().min(1, 'Ingresa tu correo o nombre de usuario'),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const usernameAvailableSchema = z.object({
  username: z
    .string()
    .min(4, 'El nombre de usuario debe tener al menos 4 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario no puede contener espacios'),
});

export type UsernameAvailableDto = z.infer<typeof usernameAvailableSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  username: z
    .string()
    .min(4, 'El nombre de usuario debe tener al menos 4 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario no puede contener espacios')
    .optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1).optional(),
});

export type OtpDto = z.infer<typeof otpSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type PasswordResetRequestDto = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetDto = z.infer<typeof passwordResetSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export interface QcProfile {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  scopes: {
    processIds: string[];
    subprocessIds: string[];
    projectIds: string[];
  };
}

export interface QcLoginResult {
  token: string;
  user: QcProfile;
  redirectUrl: string;
}
