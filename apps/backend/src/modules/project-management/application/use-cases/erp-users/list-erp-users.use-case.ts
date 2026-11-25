import { IErpUsersPort } from '../../../domain/ports/erp-users.port.js';
import { PmErpUser } from '../../../domain/entities/erp-user.entity.js';

export class ListErpUsersUseCase {
  constructor(private readonly repository: IErpUsersPort) {}

  async execute(): Promise<PmErpUser[]> {
    return this.repository.findAll();
  }
}
