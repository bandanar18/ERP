import { IModuleUserRepository } from '../../../domain/repositories/module-user.repository.js';
import { PmUser } from '../../../domain/entities/module-user.entity.js';
import { PmNotFoundError } from '../../../errors.js';

export class UpdateModuleUserRoleUseCase {
  constructor(private readonly userRepository: IModuleUserRepository) {}

  async execute(id: string, roleCode: string): Promise<PmUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new PmNotFoundError('Usuario no encontrado');
    }
    return this.userRepository.updateRole(id, roleCode);
  }
}
