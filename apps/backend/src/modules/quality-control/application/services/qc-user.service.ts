import { IQcUserRepository } from '../../domain/repositories/qc-user.repository.js';
import { QcBcryptService } from '../../infrastructure/auth/qc-bcrypt.service.js';
import { QcConflictError, QcForbiddenError, QcNotFoundError, QcValidationError } from '../../errors.js';

export class QcUserService {
  constructor(
    private readonly repo: IQcUserRepository,
    private readonly hasher: QcBcryptService = new QcBcryptService()
  ) {}

  async findAll() {
    return this.repo.findAll();
  }

  async getRoles() {
    return this.repo.findRoles();
  }

  async getPermissions() {
    return this.repo.findPermissions();
  }

  async updateUserRoles(userId: string, roleIdentifiers: string[]) {
    if (!Array.isArray(roleIdentifiers) || roleIdentifiers.length === 0) {
      throw new QcValidationError('Debe proporcionar al menos un rol.');
    }

    // Validar que todos los roles existan (por ID o por código)
    const roles = await this.repo.findRolesByIdsOrCodes(roleIdentifiers);
    const found = new Set<string>();
    for (const r of roles) {
      found.add(r.id);
      found.add(r.code);
    }
    const missing = roleIdentifiers.filter((idOrCode) => !found.has(idOrCode));
    if (missing.length > 0) {
      throw new QcValidationError(`Los siguientes roles no existen: ${missing.join(', ')}`);
    }

    await this.repo.replaceUserRoles(userId, roles);
    return { success: true };
  }

  async updateUserScopes(userId: string, processIds: string[]) {
    if (!Array.isArray(processIds)) {
      throw new QcValidationError('processIds debe ser un arreglo.');
    }

    // Validar que los procesos existan cuando se proveen IDs
    if (processIds.length > 0) {
      const processes = await this.repo.findProcessesByIds(processIds);
      if (processes.length !== processIds.length) {
        const found = new Set(processes.map((p) => p.id));
        const missing = processIds.filter((id) => !found.has(id));
        throw new QcValidationError(`Los siguientes procesos no existen: ${missing.join(', ')}`);
      }
    }

    await this.repo.replaceUserScopes(userId, processIds);
    return { success: true };
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    if (!Array.isArray(permissionIds)) {
      throw new QcValidationError('permissionIds debe ser un arreglo.');
    }

    // Validar que el rol exista
    const role = await this.repo.findRoleById(roleId);
    if (!role) {
      throw new QcValidationError(`El rol con ID "${roleId}" no existe.`);
    }

    // Validar que los permisos existan
    if (permissionIds.length > 0) {
      const permissions = await this.repo.findPermissionsByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        const found = new Set(permissions.map((p) => p.id));
        const missing = permissionIds.filter((id) => !found.has(id));
        throw new QcValidationError(`Los siguientes permisos no existen: ${missing.join(', ')}`);
      }
    }

    await this.repo.replaceRolePermissions(roleId, permissionIds);
    return { success: true };
  }

  // ── CRUD de usuarios del módulo (solo QC_ADMIN) ───────────────────────

  async createUser(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    roleCodes: string[];
    processIds: string[];
  }) {
    // Email único
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new QcConflictError('El email ya está registrado en el sistema de calidad');
    }

    // Username único (cuando se provee)
    if (dto.username) {
      const existingUsername = await this.repo.findByUsername(dto.username);
      if (existingUsername) {
        throw new QcConflictError('El nombre de usuario ya está en uso');
      }
    }

    // Organización por defecto (misma que usa el register)
    const organizationId = await this.repo.findDefaultOrganizationId();
    if (!organizationId) {
      throw new QcValidationError('No se encontró una organización por defecto');
    }

    // Roles existentes (por ID o por código)
    const roles = await this.repo.findRolesByIdsOrCodes(dto.roleCodes);
    const foundRoles = new Set<string>();
    for (const r of roles) {
      foundRoles.add(r.id);
      foundRoles.add(r.code);
    }
    const missingRoles = dto.roleCodes.filter((idOrCode) => !foundRoles.has(idOrCode));
    if (missingRoles.length > 0) {
      throw new QcValidationError(`Los siguientes roles no existen: ${missingRoles.join(', ')}`);
    }

    // Procesos existentes (cuando se proveen)
    if (dto.processIds.length > 0) {
      const processes = await this.repo.findProcessesByIds(dto.processIds);
      if (processes.length !== dto.processIds.length) {
        const found = new Set(processes.map((p) => p.id));
        const missing = dto.processIds.filter((id) => !found.has(id));
        throw new QcValidationError(`Los siguientes procesos no existen: ${missing.join(', ')}`);
      }
    }

    const hashed = await this.hasher.hash(dto.password);
    const user = await this.repo.createUser({
      email: dto.email,
      password: hashed,
      organizationId,
      username: dto.username ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      roleIds: roles.map((r) => r.id),
      processIds: dto.processIds,
    });

    return { success: true, id: user.id };
  }

  async updateProfile(userId: string, dto: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  }) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new QcNotFoundError('Usuario no encontrado');
    }

    if (dto.username) {
      const existingUsername = await this.repo.findByUsername(dto.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new QcConflictError('El nombre de usuario ya está en uso');
      }
    }

    await this.repo.updateProfile(userId, dto);
    return { success: true };
  }

  async toggleActive(userId: string, requesterId?: string) {
    if (requesterId && userId === requesterId) {
      throw new QcForbiddenError('No puedes desactivar tu propia cuenta');
    }

    const user = await this.repo.findById(userId);
    if (!user) {
      throw new QcNotFoundError('Usuario no encontrado');
    }

    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.repo.updateStatus(userId, nextStatus);
    return { success: true, status: nextStatus };
  }

  async resetPassword(userId: string, newPassword: string) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new QcNotFoundError('Usuario no encontrado');
    }

    const hashed = await this.hasher.hash(newPassword);
    await this.repo.updatePassword(userId, hashed);
    return { success: true };
  }

  async remove(userId: string, requesterId?: string) {
    if (requesterId && userId === requesterId) {
      throw new QcForbiddenError('No puedes eliminar tu propia cuenta');
    }

    const user = await this.repo.findById(userId);
    if (!user) {
      throw new QcNotFoundError('Usuario no encontrado');
    }

    // Soft delete: desactiva y marca deletedAt (conserva historial de mediciones)
    await this.repo.softDelete(userId);
    return { success: true };
  }
}
