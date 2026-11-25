import { IErpUsersPort } from '../../../domain/ports/erp-users.port.js';
import { PmErpUser } from '../../../domain/entities/erp-user.entity.js';
import { PmNotFoundError } from '../../../errors.js';

export class GetErpUserUseCase {
  constructor(private readonly repository: IErpUsersPort) {}

  async execute(id: string): Promise<PmErpUser> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new PmNotFoundError('ERP User not found');
    }
    return user;
  }
}
