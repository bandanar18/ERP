import type { CreateIndicatorDto, UpdateIndicatorDto } from '../dto/qc-admin.dto.js';
import { IQcAdminIndicatorRepository } from '../../domain/repositories/qc-admin-indicator.repository.js';
import { QcConflictError, QcNotFoundError, QcValidationError } from '../../errors.js';

export class QcAdminIndicatorService {
  constructor(private readonly repo: IQcAdminIndicatorRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const indicator = await this.repo.findOne(id);
    if (!indicator) throw new QcNotFoundError('Indicador no encontrado');
    return indicator;
  }

  async create(dto: CreateIndicatorDto, actorId: string) {
    // Verificar unicidad del código
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new QcConflictError(`Ya existe un indicador con el código "${dto.code}"`);
    }

    // Verificar que el proceso exista
    const process = await this.repo.findProcess(dto.processId);
    if (!process) throw new QcValidationError('El proceso especificado no existe');

    // Obtener la organización CORP_MAIN
    const org = await this.repo.findOrganization('CORP_MAIN');
    if (!org) throw new QcNotFoundError('Organización CORP_MAIN no encontrada');

    const result = await this.repo.createWithInitialVersion(dto, org.id);

    // Auditoría
    await this.repo.createAuditLog({
      actorId,
      action: 'CREATE',
      entityType: 'Indicator',
      entityId: result.id,
      after: result,
    });

    return result;
  }

  async update(id: string, dto: UpdateIndicatorDto, actorId: string) {
    const existing = await this.repo.findOne(id);
    if (!existing) throw new QcNotFoundError('Indicador no encontrado');

    const before = {
      id: existing.id,
      code: existing.code,
      name: existing.name,
      processId: existing.processId,
      subprocessId: existing.subprocessId,
      projectId: existing.projectId,
      chartType: existing.chartType,
    };

    // Determinar si cambió algún campo técnico (dispara nuevo versionado)
    const technicalChange =
      dto.frequency !== undefined ||
      dto.direction !== undefined ||
      dto.formula !== undefined ||
      dto.inputMode !== undefined ||
      dto.displayAsPercent !== undefined ||
      dto.aggregation !== undefined ||
      dto.targetValue !== undefined ||
      dto.unit !== undefined ||
      dto.thresholds !== undefined;

    let result: { id: string };
    if (technicalChange) {
      result = await this.repo.updateWithVersioning(id, dto);
    } else {
      result = await this.repo.updateBaseFields(id, dto);
    }

    // Auditoría
    await this.repo.createAuditLog({
      actorId,
      action: 'UPDATE',
      entityType: 'Indicator',
      entityId: id,
      before,
      after: result,
    });

    return result;
  }
}
