import { PmErpUser, CreatePmErpUser, UpdatePmErpUser } from '../entities/erp-user.entity.js';

export interface IErpUsersPort {
  findAll(): Promise<PmErpUser[]>;
  findById(id: string): Promise<PmErpUser | null>;
  create(data: CreatePmErpUser): Promise<PmErpUser>;
  update(id: string, data: UpdatePmErpUser): Promise<PmErpUser>;
  delete(id: string): Promise<void>;
}
