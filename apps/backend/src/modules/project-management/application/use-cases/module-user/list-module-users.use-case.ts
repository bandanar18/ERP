import { IModuleUserRepository } from '../../../domain/repositories/module-user.repository.js';
import { PmUser } from '../../../domain/entities/module-user.entity.js';

export class ListModuleUsersUseCase {
  constructor(private readonly userRepository: IModuleUserRepository) {}

  async execute(filters?: { role?: string }): Promise<PmUser[]> {
    return this.userRepository.findAll(filters);
  }
}
