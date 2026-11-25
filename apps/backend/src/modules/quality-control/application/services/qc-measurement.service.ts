import { evaluate } from 'mathjs';
import { QcMeasurementStatus, QcTrafficLight } from '@prisma/client';
import { IQcMeasurementRepository } from '../../domain/repositories/qc-measurement.repository.js';
import { SemaforoService } from './semaforo.service.js';
import { SubmitMeasurementDto, ReviewMeasurementDto } from '../dto/qc-measurement.dto.js';
import { QcValidationError, QcForbiddenError, QcNotFoundError } from '../../errors.js';

const VALID_MEASUREMENT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'LOCKED',
] as const;

/**
 * Rechaza valores de status que no pertenecen al enum QcMeasurementStatus.
 * (Sin esta validación, un query con `?status=INVALID` rompía con 500 en Prisma.)
 */
function assertValidMeasurementStatus(status?: string) {
  if (status !== undefined && !(VALID_MEASUREMENT_STATUSES as readonly string[]).includes(status)) {
    throw new QcValidationError(
      `Invalid status "${status}". Allowed: ${VALID_MEASUREMENT_STATUSES.join(', ')}`,
    );
  }
}

const PROCUREMENT_INPUTS = [
  'proveedoresConfiables',
  'proveedoresRequierenMejoras',
  'proveedoresSuspendidos',
] as const;

function isProcurementFormula(formula?: string | null) {
  return formula?.includes('proveedoresConfiables') ?? false;
}

function extractFormulaVariables(formula?: string | null): string[] {
  if (!formula) return [];
  const raw = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  const MATH_KEYWORDS = new Set([
    'abs', 'ceil', 'floor', 'round', 'sqrt', 'pow', 'min', 'max', 'sum', 'avg', 'mean',
    'pi', 'e', 'log', 'exp', 'sin', 'cos', 'tan', 'mod',
  ]);
  return [...new Set(raw)].filter((token) => !MATH_KEYWORDS.has(token));
}

function calculateProcurementValue(inputs: Record<string, number>) {
  const confiables = Number(inputs.proveedoresConfiables ?? 0);
  const requierenMejoras = Number(inputs.proveedoresRequierenMejoras ?? 0);
  const suspendidos = Number(inputs.proveedoresSuspendidos ?? 0);

  const values = [confiables, requierenMejoras, suspendidos];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new QcValidationError(
      'Las cantidades de proveedores deben ser números mayores o iguales a cero.',
    );
  }

  const total = confiables + requierenMejoras + suspendidos;

  if (total === 0) {
    throw new QcValidationError(
      'Debe registrar al menos un proveedor para calcular el indicador de Procura.',
    );
  }

  return {
    value: Number(((confiables / total) * 100).toFixed(2)),
    total,
  };
}

export class QcMeasurementService {
  constructor(
    private readonly repo: IQcMeasurementRepository,
    private readonly semaforo: SemaforoService,
  ) {}

  async submitMeasurement(data: SubmitMeasurementDto, userId: string) {
    // 1. Validar el período
    const period = await this.repo.findPeriod(data.periodId);
    if (!period) throw new QcValidationError('Invalid period');
    if (period.status === 'CLOSED') {
      throw new QcForbiddenError('El periodo de reporte esta cerrado y no admite nuevas mediciones.');
    }

    // 2. Cargar la versión del indicador y su meta
    const version = await this.repo.findVersionWithTargets(data.indicatorVersionId);
    if (!version) throw new QcValidationError('Invalid indicator version');

    // 3. Calcular el valor principal según el modo de entrada con validación estricta
    let mainValue = 0;
    const rawInputs = (data.inputs ?? {}) as Record<string, unknown>;
    const normalizedInputs: Record<string, number> = {};

    if (version.inputMode === 'DIRECT_VALUE') {
      if (
        data.directValue === undefined ||
        data.directValue === null ||
        (typeof data.directValue === 'string' && (data.directValue as string).trim() === '')
      ) {
        throw new QcValidationError('El valor directo es requerido.');
      }
      const val = Number(data.directValue);
      if (!Number.isFinite(val) || Number.isNaN(val)) {
        throw new QcValidationError('El valor directo debe ser un número válido.');
      }
      mainValue = val;
    } else {
      // FORMULA_INPUTS
      if (isProcurementFormula(version.formula)) {
        const missing = PROCUREMENT_INPUTS.filter((key) => {
          const v = rawInputs[key];
          return v === undefined || v === null || (typeof v === 'string' && (v as string).trim() === '');
        });
        if (missing.length > 0) {
          throw new QcValidationError(`Faltan campos obligatorios para Procura: ${missing.join(', ')}.`);
        }

        for (const key of PROCUREMENT_INPUTS) {
          const num = Number(rawInputs[key]);
          if (!Number.isFinite(num) || Number.isNaN(num)) {
            throw new QcValidationError(`El campo "${key}" debe ser un número válido.`);
          }
          normalizedInputs[key] = num;
        }

        const result = calculateProcurementValue(normalizedInputs);
        mainValue = result.value;
        data.inputs = normalizedInputs;
      } else if (version.formula) {
        const requiredVars = extractFormulaVariables(version.formula);
        for (const v of requiredVars) {
          const rawVal = rawInputs[v];
          if (
            rawVal === undefined ||
            rawVal === null ||
            (typeof rawVal === 'string' && rawVal.trim() === '')
          ) {
            throw new QcValidationError(`La variable "${v}" es obligatoria y no puede estar vacía.`);
          }
          const num = Number(rawVal);
          if (!Number.isFinite(num) || Number.isNaN(num)) {
            throw new QcValidationError(`El valor para "${v}" debe ser un número válido.`);
          }
          normalizedInputs[v] = num;
        }

        try {
          const evalResult = evaluate(version.formula, normalizedInputs);
          mainValue = Number(evalResult);
        } catch (err: any) {
          throw new QcValidationError(`Error al evaluar la fórmula: ${err?.message ?? 'valores no válidos'}`);
        }
        data.inputs = normalizedInputs;
      } else {
        if (Object.keys(rawInputs).length === 0) {
          throw new QcValidationError('Debe proporcionar los valores de entrada para el indicador.');
        }
        for (const [key, rawVal] of Object.entries(rawInputs)) {
          if (
            rawVal === undefined ||
            rawVal === null ||
            (typeof rawVal === 'string' && (rawVal as string).trim() === '')
          ) {
            throw new QcValidationError(`El campo "${key}" es obligatorio.`);
          }
          const num = Number(rawVal);
          if (!Number.isFinite(num) || Number.isNaN(num)) {
            throw new QcValidationError(`El valor para "${key}" debe ser un número válido.`);
          }
          normalizedInputs[key] = num;
        }
        mainValue = Object.values(normalizedInputs).reduce((a, b) => a + b, 0);
        data.inputs = normalizedInputs;
      }
    }

    if (!Number.isFinite(mainValue) || Number.isNaN(mainValue)) {
      throw new QcValidationError(
        'El cálculo genera un resultado matemático no válido o indeterminación (p. ej. división entre cero). Verifica los valores ingresados.',
      );
    }

    // 4. Calcular el semáforo
    let trafficLight: QcTrafficLight = QcTrafficLight.GRAY;
    if (version.targets && version.targets.length > 0) {
      const targetObj = version.targets[0];
      trafficLight = this.semaforo.calculateTrafficLight(
        mainValue,
        targetObj!.targetValue,
        version.direction,
        targetObj!.thresholds,
      );
    }

    let measurement;
    try {
      // 5. Verificar si ya existe
      const existing = await this.repo.findExistingMeasurement(data.indicatorVersionId, data.periodId);
      
      const measurementData = {
        value: mainValue,
        trafficLight,
        submittedById: userId,
        observation: data.observation,
        status: QcMeasurementStatus.SUBMITTED,
      };

      if (existing) {
        if (existing.status === 'APPROVED') {
          throw new QcForbiddenError('La medición ya ha sido aprobada para este período.');
        }
        if (
          existing.status === 'SUBMITTED' &&
          existing.value !== null &&
          existing.value !== undefined &&
          Number.isFinite(existing.value) &&
          existing.submittedById &&
          existing.submittedById !== userId
        ) {
          throw new QcForbiddenError('Ya existe una medición enviada para este período por otro usuario.');
        }
        // Actualizar la existente (si estaba rechazada, en borrador, con valor nulo/indeterminado, o corrección del mismo usuario)
        measurement = await this.repo.updateMeasurement(existing.id, measurementData);
      } else {
        // Crear nueva
        measurement = await this.repo.createMeasurement({
          indicatorVersionId: data.indicatorVersionId,
          periodId: data.periodId,
          value: measurementData.value,
          trafficLight: measurementData.trafficLight,
          submittedById: measurementData.submittedById,
          observation: measurementData.observation,
        });
      }

      // Guardar inputs (siempre creará nuevos, si queremos evitar duplicados deberíamos borrar los anteriores)
      // Para simplicidad por ahora asumimos que no hay problema, o idealmente en DB deberíamos limpiar:
      if (Object.keys(data.inputs).length > 0) {
        await this.repo.createInputs(measurement.id, data.inputs);
      }

      return {
        success: true,
        measurement,
      };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new QcValidationError(
          'Ya existe una medición para este indicador y período. No se puede duplicar.',
        );
      }
      throw err;
    }
    if (Object.keys(data.inputs).length > 0) {
      await this.repo.createInputs(measurement.id, data.inputs);
    }

    return {
      success: true,
      measurement,
    };
  }

  async findByProcessAssignments(userId: string, status?: string) {
    assertValidMeasurementStatus(status);
    return this.repo.findByProcessAssignments(userId, status as QcMeasurementStatus | undefined);
  }

  async findAll(status?: string) {
    assertValidMeasurementStatus(status);
    return this.repo.findAll(status as QcMeasurementStatus | undefined);
  }

  async reviewMeasurement(id: string, data: ReviewMeasurementDto, reviewerId: string) {
    const measurement = await this.repo.findMeasurementForReview(id);
    if (!measurement) {
      throw new QcNotFoundError('Measurement not found');
    }

    if (measurement.status !== 'SUBMITTED') {
      throw new QcValidationError(
        `Cannot review measurement with status "${measurement.status}". Only SUBMITTED measurements can be reviewed.`,
      );
    }

    const period = await this.repo.findPeriodStatus(measurement.periodId);
    if (period?.status === 'CLOSED') {
      throw new QcForbiddenError('El periodo de reporte esta cerrado y no admite revisiones de mediciones.');
    }

    const updated = await this.repo.updateReview(id, data, reviewerId);

    return { success: true, measurement: updated };
  }
}
