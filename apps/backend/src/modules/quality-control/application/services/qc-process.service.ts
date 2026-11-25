import { IQcProcessRepository } from '../../domain/repositories/qc-process.repository.js';

export class QcProcessService {
  constructor(private readonly repo: IQcProcessRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findMine(userId: string) {
    return this.repo.findMine(userId);
  }
}
