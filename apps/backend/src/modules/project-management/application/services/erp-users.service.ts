import { PmErpUser, CreatePmErpUser, UpdatePmErpUser } from '../../domain/entities/erp-user.entity.js';
import { ListErpUsersUseCase } from '../use-cases/erp-users/list-erp-users.use-case.js';
import { GetErpUserUseCase } from '../use-cases/erp-users/get-erp-user.use-case.js';
import { CreateErpUserUseCase } from '../use-cases/erp-users/create-erp-user.use-case.js';
import { UpdateErpUserUseCase } from '../use-cases/erp-users/update-erp-user.use-case.js';
import { DeleteErpUserUseCase } from '../use-cases/erp-users/delete-erp-user.use-case.js';

export class ErpUsersService {
  constructor(
    private readonly listUseCase: ListErpUsersUseCase,
    private readonly getUseCase: GetErpUserUseCase,
    private readonly createUseCase: CreateErpUserUseCase,
    private readonly updateUseCase: UpdateErpUserUseCase,
    private readonly deleteUseCase: DeleteErpUserUseCase
  ) {}

  async findAll(): Promise<PmErpUser[]> {
    return this.listUseCase.execute();
  }

  async findById(id: string): Promise<PmErpUser> {
    return this.getUseCase.execute(id);
  }

  async create(data: CreatePmErpUser): Promise<PmErpUser> {
    return this.createUseCase.execute(data);
  }

  async update(id: string, data: UpdatePmErpUser): Promise<PmErpUser> {
    return this.updateUseCase.execute(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
