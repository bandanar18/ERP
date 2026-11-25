import { IModuleUserRepository } from '../../domain/repositories/module-user.repository.js';
import { ListModuleUsersUseCase } from '../use-cases/module-user/list-module-users.use-case.js';
import { UpdateModuleUserRoleUseCase } from '../use-cases/module-user/update-module-user-role.use-case.js';
import { UpdateModuleUserScopesUseCase } from '../use-cases/module-user/update-module-user-scopes.use-case.js';
import { ToggleModuleUserActiveUseCase } from '../use-cases/module-user/toggle-module-user-active.use-case.js';
import { CreateModuleUserUseCase } from '../use-cases/module-user/create-module-user.use-case.js';
import { PmUser } from '../../domain/entities/module-user.entity.js';

export class ModuleUserService {
  private listModuleUsersUseCase: ListModuleUsersUseCase;
  private updateModuleUserRoleUseCase: UpdateModuleUserRoleUseCase;
  private updateModuleUserScopesUseCase: UpdateModuleUserScopesUseCase;
  private toggleModuleUserActiveUseCase: ToggleModuleUserActiveUseCase;
  private createModuleUserUseCase: CreateModuleUserUseCase;

  constructor(private readonly userRepository: IModuleUserRepository) {
    this.listModuleUsersUseCase = new ListModuleUsersUseCase(userRepository);
    this.updateModuleUserRoleUseCase = new UpdateModuleUserRoleUseCase(userRepository);
    this.updateModuleUserScopesUseCase = new UpdateModuleUserScopesUseCase(userRepository);
    this.toggleModuleUserActiveUseCase = new ToggleModuleUserActiveUseCase(userRepository);
    this.createModuleUserUseCase = new CreateModuleUserUseCase(userRepository);
  }

  async listUsers(filters?: { role?: string }): Promise<PmUser[]> {
    return this.listModuleUsersUseCase.execute(filters);
  }

  async updateRole(id: string, roleCode: string): Promise<PmUser> {
    return this.updateModuleUserRoleUseCase.execute(id, roleCode);
  }

  async updateScopes(id: string, scopes: { companyId?: string | null; projectId?: string | null }[]): Promise<PmUser> {
    return this.updateModuleUserScopesUseCase.execute(id, scopes);
  }

  async toggleActive(id: string): Promise<PmUser> {
    return this.toggleModuleUserActiveUseCase.execute(id);
  }

  async listRoles(): Promise<{ id: string; code: string; description: string | null }[]> {
    return this.userRepository.listRoles();
  }

  async createUser(data: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roleCode: string;
    scopes?: { companyId?: string | null; projectId?: string | null }[];
  }): Promise<PmUser> {
    return this.createModuleUserUseCase.execute(data);
  }
}
