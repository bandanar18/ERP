import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as repo from '../repositories/executive.repository';
import { ExecutiveError } from '../interfaces/executive.errors';
import type { ExecutiveAuthResponse } from '../interfaces/executive.types';

/**
 * MÓDULO EJECUTIVO — Autenticación.
 *
 * JWT PROPIO del módulo (EXECUTIVE_JWT_SECRET), independiente del JWT del ERP.
 * Los roles/permisos/scopes se recalculan desde la BD en cada request.
 */

function requireSecret(): string {
  const value = process.env.EXECUTIVE_JWT_SECRET;
  if (!value) {
    // Fail-fast: nunca firmar/verificar tokens con un secreto por defecto.
    throw new Error('EXECUTIVE_JWT_SECRET is not set — arranca fallido');
  }
  return value;
}

export const EXECUTIVE_JWT_SECRET = requireSecret();
export const EXECUTIVE_JWT_EXPIRES_IN = process.env.EXECUTIVE_JWT_EXPIRES_IN ?? '8h';

function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, EXECUTIVE_JWT_SECRET, {
    expiresIn: EXECUTIVE_JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export class AuthService {
  async register(body: { email: string; password: string }): Promise<ExecutiveAuthResponse> {
    const { email, password } = body;

    if (!email || !password) {
      throw ExecutiveError.badRequest('Email y contraseña son requeridos');
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      throw ExecutiveError.conflict('El correo electrónico ya está registrado');
    }

    const org = await repo.findOrganizationByCode('CORP_MAIN');
    if (!org) {
      throw ExecutiveError.badRequest('No se encontró una organización por defecto');
    }

    const defaultRole = await repo.findRoleByCode('PROCESS_OWNER');
    if (!defaultRole) {
      throw ExecutiveError.badRequest('No se encontró el rol por defecto');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await repo.createUserWithRole({
      email,
      password: hashedPassword,
      organizationId: org.id,
      roleId: defaultRole.id,
    });

    const enrichedUser = await this.getEnrichedProfile(
      (await repo.findUserByEmail(email))!.id,
    );
    const redirectUrl = this.computeRedirectUrl(enrichedUser.roles as string[]);

    return {
      accessToken: signAccessToken(enrichedUser.id as string, email),
      user: enrichedUser as ExecutiveAuthResponse['user'],
      redirectUrl,
    };
  }

  async login(email: string, password?: string): Promise<ExecutiveAuthResponse> {
    const user = await repo.findUserByEmail(email);
    if (!user) {
      throw ExecutiveError.unauthorized('Invalid credentials');
    }

    if (!password || !user.password) {
      throw ExecutiveError.unauthorized('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ExecutiveError.unauthorized('Invalid credentials');
    }

    const enrichedUser = await this.getEnrichedProfile(user.id);
    const redirectUrl = this.computeRedirectUrl(enrichedUser.roles as string[]);

    return {
      accessToken: signAccessToken(user.id, user.email),
      user: enrichedUser as ExecutiveAuthResponse['user'],
      redirectUrl,
    };
  }

  /** Perfil enriquecido: roles, permisos planos y scopes de procesos. */
  async getEnrichedProfile(userId: string) {
    const user = await repo.findUserById(userId);

    if (!user) {
      throw ExecutiveError.unauthorized('User not found');
    }

    const roles = user.roles.map((r) => r.role.code);

    const permissionsSet = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.code);
      });
    });
    const permissions = Array.from(permissionsSet);

    const processes: string[] = [];
    const subprocesses: string[] = [];
    const projects: string[] = [];

    user.processAssignments.forEach((assignment) => {
      if (assignment.processId) processes.push(assignment.processId);
      if (assignment.subprocessId) subprocesses.push(assignment.subprocessId);
      if (assignment.projectId) projects.push(assignment.projectId);
    });

    const scopes = {
      processes: [...new Set(processes)],
      subprocesses: [...new Set(subprocesses)],
      projects: [...new Set(projects)],
    };

    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      roles,
      permissions,
      scopes,
    };
  }

  /** Ruta post-login calculada solo en el servidor (el cliente nunca aprende el mapeo rol→ruta). */
  computeRedirectUrl(roles: string[]): string {
    if (roles.includes('ADMIN')) return '/admin';
    if (roles.includes('DIRECTOR')) return '/director';
    if (roles.includes('PROCESS_OWNER')) return '/owner';
    return '/login';
  }
}
