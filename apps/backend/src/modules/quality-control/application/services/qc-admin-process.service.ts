import type { CreateProcessDto, UpdateProcessDto } from '../dto/qc-admin.dto.js';
import { IQcAdminProcessRepository } from '../../domain/repositories/qc-admin-process.repository.js';
import { QcConflictError, QcNotFoundError } from '../../errors.js';

export class QcAdminProcessService {
  constructor(private readonly repo: IQcAdminProcessRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const process = await this.repo.findOne(id);
    if (!process) throw new QcNotFoundError('Proceso no encontrado');
    return process;
  }

  async create(dto: CreateProcessDto, actorId: string) {
    // Código único
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new QcConflictError(`Ya existe un proceso con el código "${dto.code}"`);
    }

    // Organización CORP_MAIN
    const org = await this.repo.findOrganization('CORP_MAIN');
    if (!org) throw new QcNotFoundError('Organización CORP_MAIN no encontrada');

    // Validar padre si se provee
    if (dto.parentId) {
      const parent = await this.repo.findParent(dto.parentId);
      if (!parent) throw new QcNotFoundError('Proceso padre no encontrado');
    }

    const process = await this.repo.create(dto, org.id);

    // Auditoría
    await this.repo.createAuditLog({
      actorId,
      action: 'CREATE',
      entityType: 'Process',
      entityId: process.id,
      after: { id: process.id, code: process.code, name: process.name },
    });

    return process;
  }

  async update(id: string, dto: UpdateProcessDto, actorId: string) {
    const existing = await this.repo.findOne(id);
    if (!existing) throw new QcNotFoundError('Proceso no encontrado');

    // Verificar unicidad del código si cambia
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.repo.findByCode(dto.code);
      if (duplicate) {
        throw new QcConflictError(`Ya existe otro proceso con el código "${dto.code}"`);
      }
    }

    // Evitar referencia circular: un proceso no puede ser padre de sí mismo
    if (dto.parentId === id) {
      throw new QcConflictError('Un proceso no puede ser padre de sí mismo');
    }

    const before = {
      id: existing.id,
      code: existing.code,
      name: existing.name,
      parentId: existing.parentId,
    };

    const updated = await this.repo.update(id, dto);

    // Auditoría
    await this.repo.createAuditLog({
      actorId,
      action: 'UPDATE',
      entityType: 'Process',
      entityId: id,
      before,
      after: { id: updated.id, code: updated.code, name: updated.name },
    });

    return updated;
  }
}
