import { IModuleUserRepository } from '../../../domain/repositories/module-user.repository.js';
import { PmUser } from '../../../domain/entities/module-user.entity.js';

export class CreateModuleUserUseCase {
  constructor(private readonly userRepository: IModuleUserRepository) {}

  async execute(data: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roleCode: string;
    scopes?: { companyId?: string | null; projectId?: string | null }[];
  }): Promise<PmUser> {
    return this.userRepository.create(data);
  }
}
