import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRepository } from '../repositories';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  TokenPayload,
  TokenPair,
  UserResponse,
  CompanyResponse,
  AssignRequest,
  LoginResponse,
  PendingRoleResponse,
  PendingCompanyResponse,
} from '../interfaces';
import { AuthError, AuthErrorCode } from '../interfaces/auth.errors';
import { ErpRole, PmCompany } from '@prisma/client';
import { sendEmail } from '@/config/email';
import { emailTemplates } from '@/config/email-templates';
import { OtpService } from './otp.service';

const getAccessTokenExpiry = (): string => {
  return (process.env.ACCESS_TOKEN_EXPIRY as string) || '1h';
};

const getRefreshTokenExpiry = (): string => {
  return (process.env.REFRESH_TOKEN_EXPIRY as string) || '7d';
};

const getSecretKey = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno');
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET no está configurado en las variables de entorno');
  }
  return secret;
};

const companyToResponse = (company: PmCompany | null | undefined): CompanyResponse | undefined => {
  if (!company) return undefined;

  return {
    id: company.id,
    name: company.name,
    taxId: company.taxId ?? undefined,
    legalName: company.legalName ?? undefined,
    address: company.address ?? undefined,
    phone: company.phone ?? undefined,
    email: company.email ?? undefined,
  };
};

const userToResponse = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: ErpRole | null;
  company?: PmCompany | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse => {
  const isClient = !!user.company;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role ? { id: user.role.id, name: user.role.name } : null,
    isClient,
    company: isClient ? companyToResponse(user.company) : undefined,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly otpService: OtpService;

  constructor() {
    this.repository = new AuthRepository();
    this.otpService = new OtpService();
  }

  async initializeRoles(): Promise<void> {
    await this.repository.createDefaultRoles();
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await this.repository.findByEmail(data.email);

    if (existingUser) {
      throw new AuthError(AuthErrorCode.EMAIL_ALREADY_EXISTS, 'El email ya está registrado', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let roleId: string | null = null;

    if (data.roleName) {
      const role = await this.repository.findRoleByName(data.roleName);
      if (!role) {
        throw new AuthError(AuthErrorCode.ROLE_NOT_FOUND, 'Rol no encontrado', 400);
      }
      roleId = role.id;
    }

    const user = await this.repository.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      roleId: roleId ?? undefined,
      companyId: data.companyId,
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      roleName: user.role?.name ?? '',
      isClient: !!user.companyId,
      companyId: user.companyId ?? undefined,
    });

    return {
      user: userToResponse(user),
      ...tokens,
    };
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await this.repository.findByEmail(data.email);

    if (!user) {
      throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Credenciales inválidas', 401);
    }

    if (!user.isActive) {
      throw new AuthError(
        AuthErrorCode.USER_DISABLED,
        'Tu cuenta está desactivada. Por favor, contacta a soporte para más información.',
        401
      );
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Credenciales inválidas', 401);
    }

    if (!user.emailVerified) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_VERIFIED,
        'Debes verificar tu cuenta para poder ingresar',
        403
      );
    }

    // CASO 1: Sin rol y sin empresa → enviar OTP
    if (!user.roleId && !user.companyId) {
      await this.otpService.generateOtp(user.email, user.id);

      const pendingRoleResponse: PendingRoleResponse = {
        requiresOtp: true,
        message: 'Todavía no se te ha asignado un rol ni una empresa. Hemos enviado un código a tu correo. Contacta al administrador.',
        email: user.email,
      };
      return pendingRoleResponse;
    }

    // CASO 2: Con rol pero sin empresa → login con mensaje informativo
    if (user.roleId && !user.companyId) {
      await this.repository.updateLastLogin(user.id);

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        roleName: user.role!.name,
        isClient: false,
        companyId: undefined,
      });

      const pendingCompanyResponse: PendingCompanyResponse = {
        user: userToResponse(user),
        ...tokens,
        pendingCompany: true,
        message: `Bienvenido. Tu rol es ${user.role!.name}. La empresa aún no ha sido asignada (opcional).`,
      };
      return pendingCompanyResponse;
    }

    // CASO 3: Con rol y empresa → login normal
    await this.repository.updateLastLogin(user.id);

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      roleName: user.role!.name,
      isClient: !!user.companyId,
      companyId: user.companyId ?? undefined,
    });

    return {
      user: userToResponse(user),
      ...tokens,
    };
  }

  async assignRoleAndCompany(userId: string, data: AssignRequest): Promise<UserResponse> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Usuario no encontrado', 404);
    }

    const hadRoleBefore = !!user.roleId;
    const hadCompanyBefore = !!user.companyId;

    // Validar que tenga rol antes de asignar empresa
    if (!hadRoleBefore && !data.roleName && data.companyId) {
      throw new AuthError(
        AuthErrorCode.ROLE_NOT_ASSIGNED,
        'No se puede asignar una empresa sin primero asignar un rol al usuario.',
        400
      );
    }

    // Resolver roleId si viene roleName
    let roleId: string | undefined = undefined;
    if (data.roleName !== undefined) {
      const role = await this.repository.findRoleByName(data.roleName);
      if (!role) {
        throw new AuthError(AuthErrorCode.ROLE_NOT_FOUND, `El rol "${data.roleName}" no existe`, 400);
      }
      roleId = role.id;
    }

    // Validar empresa si viene companyId (permitiendo null explícito para desvincular)
    if (data.companyId !== undefined && data.companyId !== null) {
      const company = await this.repository.findCompanyById(data.companyId);
      if (!company) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La empresa especificada no existe', 404);
      }
    }

    const updatedUser = await this.repository.assignRoleAndCompany(userId, {
      ...data,
      roleId,
    });

    const roleName = updatedUser.role?.name;
    const companyName = updatedUser.company?.name;

    // CASO 1: Primera asignación de rol (sin empresa)
    const isFirstRoleAssignment = !hadRoleBefore && !!roleName && !companyName;
    if (isFirstRoleAssignment) {
      sendEmail({
        to: updatedUser.email,
        subject: 'Rol asignado en Business ERP',
        html: emailTemplates.roleAssigned(updatedUser.firstName, updatedUser.lastName, roleName),
      }).catch((err) => {
        console.error('[AuthService] Error enviando correo de rol asignado:', err);
      });
    }

    // CASO 2: Asignación de empresa a usuario con rol
    const hasRoleNow = !!roleName;
    const isCompanyAssignment = hasRoleNow && !!companyName && !hadCompanyBefore;
    if (isCompanyAssignment) {
      sendEmail({
        to: updatedUser.email,
        subject: 'Empresa asignada en Business ERP',
        html: emailTemplates.companyAssigned(updatedUser.firstName, updatedUser.lastName, roleName!, companyName),
      }).catch((err) => {
        console.error('[AuthService] Error enviando correo de empresa asignada:', err);
      });
    }

    // CASO 3: Ambos asignados juntos (rol + empresa por primera vez)
    const isFirstFullAssignment = !hadRoleBefore && !hadCompanyBefore && !!roleName && !!companyName;
    if (isFirstFullAssignment) {
      sendEmail({
        to: updatedUser.email,
        subject: '¡Tu cuenta en Business ERP está completa!',
        html: emailTemplates.userAssigned(updatedUser.firstName, updatedUser.lastName, roleName, companyName),
      }).catch((err) => {
        console.error('[AuthService] Error enviando correo de cuenta completa:', err);
      });
    }

    return userToResponse(updatedUser);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(refreshToken, getRefreshSecret()) as TokenPayload;

      const user = await this.repository.findById(payload.userId);

      if (!user || !user.isActive) {
        throw new AuthError(AuthErrorCode.USER_DISABLED, 'Usuario inválido o inactivo', 401);
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        roleName: user.role?.name ?? '',
        isClient: !!user.companyId,
        companyId: user.companyId ?? undefined,
      });
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Refresh token inválido o expirado', 401);
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await this.repository.findById(id);
    return user ? userToResponse(user) : null;
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, getSecretKey()) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Token expirado', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Token inválido', 401);
      }
      throw error;
    }
  }

  private generateTokens(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(payload, getSecretKey(), {
      expiresIn: getAccessTokenExpiry() as any,
    });

    const refreshTokenValue = jwt.sign(payload, getRefreshSecret(), {
      expiresIn: getRefreshTokenExpiry() as any,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
