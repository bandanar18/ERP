import { QcUser } from '@prisma/client';
import { IQcAuthRepository } from '../../domain/repositories/qc-auth.repository.js';
import { QcJwtService } from '../../infrastructure/auth/qc-jwt.service.js';
import { QcBcryptService } from '../../infrastructure/auth/qc-bcrypt.service.js';
import { QcOtpService } from '../../infrastructure/auth/qc-otp.service.js';
import { QcPasswordResetService } from '../../infrastructure/auth/qc-password-reset.service.js';
import { LoginDto, RegisterDto, QcProfile, QcLoginResult } from '../dto/qc-auth.dto.js';
import { QcUnauthorizedError } from '../../errors.js';
import { prisma } from '../../../../prisma/prisma.js';

export class QcAuthService {
  constructor(
    private readonly repo: IQcAuthRepository,
    private readonly jwt: QcJwtService,
    private readonly hasher: QcBcryptService,
  ) {}

  async login(dto: LoginDto): Promise<QcLoginResult> {
    const user = await this.resolveLoginUser(dto.login);
    if (!user || user.status !== 'ACTIVE') {
      throw new QcUnauthorizedError('Credenciales inválidas o usuario inactivo');
    }

    const isMatch = await this.hasher.compare(dto.password, user.password);
    if (!isMatch) {
      throw new QcUnauthorizedError('Credenciales inválidas o usuario inactivo');
    }

    // Sincronizar nombres desde el usuario ERP enlazado (externalId) si faltan.
    await this.syncNamesFromErp(user);

    const profile = await this.getEnrichedProfile(user.id);
    if (!profile) {
      throw new QcUnauthorizedError('Perfil no encontrado');
    }

    const token = this.jwt.sign({ sub: profile.id, email: profile.email });

    return {
      token,
      user: profile,
      redirectUrl: this.computeRedirectUrl(profile.roles),
    };
  }

  /**
   * Copia firstName/lastName del usuario ERP (externalId) al qc_users cuando
   * la cuenta del módulo quedó sin nombres. Best-effort: no bloquea el login.
   */
  private async syncNamesFromErp(user: {
    id: string;
    externalId: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<void> {
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

      await prisma.qcUser.update({
        where: { id: user.id },
        data,
      });
    } catch {
      // La sincronización es best-effort: no debe bloquear el login.
    }
  }

  async getEnrichedProfile(userId: string): Promise<QcProfile> {
    const profile = await this.repo.findProfile(userId);
    if (!profile) {
      throw new QcUnauthorizedError('Usuario no encontrado o inactivo');
    }
    return profile;
  }

  computeRedirectUrl(roles: string[]): string {
    if (roles.includes('QC_ADMIN')) return '/quality-control/admin';
    if (roles.includes('QC_DIRECTOR')) return '/quality-control/director';
    if (roles.includes('QC_OWNER')) return '/quality-control/owner';

    return '/quality-control/owner';
  }

  /**
   * Resuelve el identificador de login: si contiene '@' busca por email
   * (case-insensitive); si no, por nombre de usuario.
   */
  private async resolveLoginUser(identifier: string): Promise<QcUser | null> {
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

  async register(dto: RegisterDto): Promise<{ success: boolean; message?: string; error?: string }> {
    // Normalizar email a minúsculas (la columna es @unique en Postgres, sensible a mayúsculas).
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

    const organizationId = await this.repo.findDefaultOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No se encontró una organización por defecto' };
    }

    const hashed = await this.hasher.hash(dto.password);
    const user = await this.repo.create({
      email,
      password: hashed,
      organizationId,
      username: dto.username ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      status: 'ACTIVE',
      emailVerified: false,
    });

    // Rol por defecto para nuevos usuarios: QC_OWNER (mismo criterio que el origen).
    // Asume el seed aplicado (org CORP_MAIN + rol QC_OWNER); si el rol faltara,
    // el usuario quedaría sin roles (403 en todo) como el estado sin-acceso de PM.
    const ownerRoleId = await this.repo.findRoleIdByCode('QC_OWNER');
    if (ownerRoleId) {
      await this.repo.assignRole(user.id, ownerRoleId);
    }

    // Enviar OTP de verificación de email
    const otpService = new QcOtpService();
    await otpService.generateOtp(email, user.id);

    return { success: true, message: 'Cuenta creada. Revisa tu email para verificar tu cuenta.' };
  }

  async sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    return new QcOtpService().generateOtp(email);
  }

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    return new QcOtpService().verifyOtp(email, code);
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    return new QcPasswordResetService().requestReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    return new QcPasswordResetService().resetPassword(token, newPassword);
  }

  /**
   * Cambio de contraseña de un usuario LOGUEADO del módulo: verifica la
   * contraseña actual contra el hash de qc_users y actualiza el hash.
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
