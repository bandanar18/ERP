import { UserManagementRepository } from '../repositories';

export class UserManagementService {
  private readonly repository: UserManagementRepository;

  constructor() {
    this.repository = new UserManagementRepository();
  }

  async getAllUsers(search?: string, page: number = 1, limit: number = 12) {
    const result = await this.repository.findAll(search, page, limit);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  async updateUserRole(userId: string, roleId: string | null) {
    return this.repository.updateRole(userId, roleId);
  }

  async updateUserCompany(userId: string, companyId: string | null) {
    return this.repository.updateCompany(userId, companyId);
  }

  async getAllRoles() {
    return this.repository.findAllRoles();
  }

  async toggleUserActive(userId: string) {
    return this.repository.toggleActive(userId);
  }
}
