import { IErpUsersPort } from '../../../domain/ports/erp-users.port.js';
import { PmErpUser, UpdatePmErpUser } from '../../../domain/entities/erp-user.entity.js';
import { PmNotFoundError } from '../../../errors.js';

export class UpdateErpUserUseCase {
  constructor(private readonly repository: IErpUsersPort) {}

  async execute(id: string, data: UpdatePmErpUser): Promise<PmErpUser> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new PmNotFoundError('ERP User not found');
    }
    return this.repository.update(id, data);
  }
}
