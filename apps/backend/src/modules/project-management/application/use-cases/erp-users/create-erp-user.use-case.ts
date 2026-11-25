import { IErpUsersPort } from '../../../domain/ports/erp-users.port.js';
import { PmErpUser, CreatePmErpUser } from '../../../domain/entities/erp-user.entity.js';

export class CreateErpUserUseCase {
  constructor(private readonly repository: IErpUsersPort) {}

  async execute(data: CreatePmErpUser): Promise<PmErpUser> {
    return this.repository.create(data);
  }
}
