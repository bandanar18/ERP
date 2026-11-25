import { IErpUsersPort } from '../../../domain/ports/erp-users.port.js';
import { PmNotFoundError } from '../../../errors.js';

export class DeleteErpUserUseCase {
  constructor(private readonly repository: IErpUsersPort) {}

  async execute(id: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new PmNotFoundError('ERP User not found');
    }
    return this.repository.delete(id);
  }
}
