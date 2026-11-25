import { PmModuleUser } from '@prisma/client';
import { IModuleAuthRepository } from '../../domain/repositories/module-auth.repository.js';
import { JwtService } from '../../infrastructure/auth/jwt.service.js';
import { BcryptService } from '../../infrastructure/auth/bcrypt.service.js';
import { PmOtpService } from '../../infrastructure/auth/pm-otp.service.js';
import { PmPasswordResetService } from '../../infrastructure/auth/pm-password-reset.service.js';
import { LoginDto, RegisterDto, PmProfile, UpdateProfileDto } from '../dto/auth.dto.js';
import { PmUnauthorizedError, PmValidationError } from '../../errors.js';
import { prisma } from '../../../../prisma/prisma.js';

export interface AuthLoginResult {
  token: string;
  user: PmProfile;
  redirectUrl: string;
}

export class AuthService {
  constructor(
    private readonly repo: IModuleAuthRepository,
    private readonly jwt: JwtService,
    private readonly hasher: BcryptService
  ) {}

  async login(dto: LoginDto): Promise<AuthLoginResult> {
    const user = await this.resolveLoginUser(dto.login);
    if (!user || user.status !== 'ACTIVE') {
      throw new PmUnauthorizedError('Credenciales inválidas o usuario inactivo');
    }

    const isMatch = await this.hasher.compare(dto.password, user.password);
    if (!isMatch) {
      throw new PmUnauthorizedError('Credenciales inválidas o usuario inactivo');
    }

    // Sincronizar nombres desde el usuario ERP enlazado (externalId) si faltan:
    // evita que los planificadores aparezcan como "null null" en proyectos/avances.
    await this.syncNamesFromErp(user);

    const profile = await this.getEnrichedProfile(user.id);
    if (!profile) {
      throw new PmUnauthorizedError('Perfil no encontrado');
    }

    const token = this.jwt.sign({ sub: profile.id, email: profile.email });

    return {
      token,
      user: profile,
      redirectUrl: this.computeRedirectUrl(profile.roles),
    };
  }

  /**
   * Resuelve el identificador de login: si contiene '@' busca por email
   * (case-insensitive); si no, por nombre de usuario.
   */
  private async resolveLoginUser(identifier: string): Promise<PmModuleUser | null> {
    const raw = identifier.trim();
    if (raw.includes('@')) {
      const byEmail = await this.repo.findByEmail(raw.toLowerCase());
      if (byEmail) return byEmail;
    }
    return this.repo.findByUsername(raw);
  }

  /**
   * Valida que un nombre de usuario no esté ya en uso (único).
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    return (await this.repo.findByUsername(username.trim())) !== null;
  }

  /**
   * Copia firstName/lastName del usuario ERP (externalId) al pm_users cuando
   * la cuenta del módulo quedó sin nombres (p.ej. enlaces creados antes de la
   * migración add_pm_user_names).
   */
  private async syncNamesFromErp(user: { id: string; externalId: string | null; firstName?: string | null; lastName?: string | null }): Promise<void> {
    if (!user.externalId || (user.firstName && user.lastName)) return;

    try {
      const erpUser = await prisma.erpUser.findUnique({
        where: { id: user.externalId },
        select: { firstName: true, lastName: true },
      });
      if (!erpUser) return;

      const data: { firstName?: string | null; lastName?: string | null } = {};
      if (!user.firstName) data.firstName = erpUser.firstName;
      if (!user.lastName) data.lastName = erpUser.lastName;
      if (Object.keys(data).length === 0) return;

      await prisma.pmModuleUser.update({
        where: { id: user.id },
        data,
      });
    } catch {
      // La sincronización es best-effort: no debe bloquear el login.
    }
  }

  async getEnrichedProfile(userId: string): Promise<PmProfile> {
    const profile = await this.repo.findProfile(userId);
    if (!profile) {
      throw new PmUnauthorizedError('Usuario no encontrado o inactivo');
    }
    return profile;
  }

  /**
   * Actualiza datos personales del usuario logueado (nombre, apellido,
   * nombre de usuario). El email NO se puede editar: es la identidad del
   * login y del OTP. Devuelve el perfil enriquecido actualizado.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PmProfile> {
    const data: { firstName?: string | null; lastName?: string | null; username?: string | null; phone?: string | null } = {};

    if (dto.username !== undefined) {
      const username = dto.username ? dto.username.trim() : null;
      if (username) {
        const existing = await this.repo.findByUsername(username);
        if (existing && existing.id !== userId) {
          throw new PmValidationError('El nombre de usuario ya está en uso');
        }
      }
      data.username = username;
    }
    if (dto.firstName !== undefined) data.firstName = dto.firstName?.trim() || null;
    if (dto.lastName !== undefined) data.lastName = dto.lastName?.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;

    const profile = await this.repo.updateProfile(userId, data);
    if (!profile) {
      throw new PmUnauthorizedError('Usuario no encontrado o inactivo');
    }
    return profile;
  }

  computeRedirectUrl(roles: string[]): string {
    if (roles.includes('PM_ADMIN_FINANCIERO') && !roles.includes('PM_ADMIN') && !roles.includes('PM_GESTION'))
      return '/project-management/finanzas';
    if (roles.includes('PM_ADMIN')) return '/project-management/gestion';
    if (roles.includes('PM_GESTION')) return '/project-management/gestion';
    if (roles.includes('PM_PLANIFICADOR')) return '/project-management/planificador';
    if (roles.includes('PM_DIRECCION')) return '/project-management/cliente';

    return '/project-management/gestion';
  }

  async linkModuleUserToErp(pmUserId: string, erpUserId: string): Promise<void> {
    await this.repo.linkExternalId(pmUserId, erpUserId);
  }

  async register(dto: RegisterDto): Promise<{ success: boolean; message?: string; error?: string }> {
    // Normalizar email a minúsculas (el login ya es case-insensitive y la
    // columna es @unique en Postgres, sensible a mayúsculas).
    const email = dto.email.trim().toLowerCase();
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      return { success: false, error: 'El email ya está registrado' };
    }

    if (dto.username) {
      const existingUsername = await this.repo.findByUsername(dto.username);
      if (existingUsername) {
        return { success: false, error: 'El nombre de usuario ya está en uso' };
      }
    }

    const hashed = await this.hasher.hash(dto.password);
    const user = await this.repo.create({
      email,
      password: hashed,
      username: dto.username ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      status: 'ACTIVE',
      emailVerified: false,
    });

    // Enviar OTP de verificación
    const otpService = new PmOtpService();
    await otpService.generateOtp(email, user.id);

    return { success: true, message: 'Cuenta creada. Revisa tu email para verificar tu cuenta.' };
  }

  async sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    return new PmOtpService().generateOtp(email);
  }

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    return new PmOtpService().verifyOtp(email, code);
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    return new PmPasswordResetService().requestReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    return new PmPasswordResetService().resetPassword(token, newPassword);
  }

  /**
   * Cambio de contraseña de un usuario LOGUEADO del módulo: verifica la
   * contraseña actual contra el hash de pmModuleUser y actualiza el hash.
   * La sesión (JWT) sigue siendo válida: no depende de la contraseña.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = await this.repo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      return { success: false, error: 'Usuario no encontrado o inactivo' };
    }

    const isValid = await this.hasher.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: 'La contraseña actual es incorrecta' };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'La nueva contraseña debe ser diferente a la actual' };
    }

    const hashed = await this.hasher.hash(newPassword);
    await this.repo.updatePassword(userId, hashed);

    return { success: true };
  }
}
