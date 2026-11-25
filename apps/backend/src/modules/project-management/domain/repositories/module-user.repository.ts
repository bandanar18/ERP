import { PmUser } from '../entities/module-user.entity.js';

export interface IModuleUserRepository {
  findAll(filters?: { role?: string }): Promise<PmUser[]>;
  findById(id: string): Promise<PmUser | null>;
  updateRole(id: string, roleCode: string): Promise<PmUser>;
  updateScopes(id: string, scopes: { companyId?: string | null; projectId?: string | null }[]): Promise<PmUser>;
  toggleActive(id: string): Promise<PmUser>;
  listRoles(): Promise<{ id: string; code: string; description: string | null }[]>;
  create(data: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roleCode: string;
    scopes?: { companyId?: string | null; projectId?: string | null }[];
  }): Promise<PmUser>;
}
