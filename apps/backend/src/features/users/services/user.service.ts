import { UserRepository } from '../repositories/user.repository';
import {
  UserResponse,
  UserListResponse,
  UserWithRelations,
  GetUsersQuery,
  UpdateUserRequest,
} from '../interfaces/user.types';

const userToResponse = (user: UserWithRelations): UserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  isActive: user.isActive,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  role: user.role ? { id: user.role.id, name: user.role.name } : null,
  company: user.company ? { id: user.company.id, name: user.company.name } : null,
});

const userToListResponse = (user: UserWithRelations): UserListResponse => ({
  ...userToResponse(user),
});

export class UserService {
  private readonly repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async getAll(query: GetUsersQuery = {}): Promise<UserListResponse[]> {
    const users = await this.repository.findAll(query);
    return users.map(userToListResponse);
  }

  async getById(id: string): Promise<UserListResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return userToListResponse(user);
  }

  async getByRole(roleName: string): Promise<UserListResponse[]> {
    const users = await this.repository.findByRole(roleName);
    return users.map(userToListResponse);
  }

  async update(id: string, data: UpdateUserRequest): Promise<UserListResponse> {
    // Verificar que el usuario existe
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error('Usuario no encontrado');
    }

    const user = await this.repository.update(id, data);
    return userToListResponse(user);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error('Usuario no encontrado');
    }

    await this.repository.delete(id);
  }
}
