import { evaluate as mathEvaluate } from 'mathjs';
import * as repo from '../repositories/executive.repository';
import { ExecutiveError } from '../interfaces/executive.errors';
import type { TrafficLightValue } from '../interfaces/executive.types';

/**
 * MÓDULO EJECUTIVO — Mediciones.
 * Portado fiel de MeasurementsService + SemaforoService (proyecto
 * "Resumen Ejecutivo").
 */

const PROCUREMENT_INPUTS = [
  'proveedoresConfiables',
  'proveedoresRequierenMejoras',
  'proveedoresSuspendidos',
] as const;

type ProcurementInputKey = (typeof PROCUREMENT_INPUTS)[number];

function isProcurementFormula(formula?: string | null) {
  return formula?.includes('proveedoresConfiables') ?? false;
}

function calculateProcurementValue(inputs: Record<string, number>) {
  const confiables = Number(inputs.proveedoresConfiables ?? 0);
  const requierenMejoras = Number(inputs.proveedoresRequierenMejoras ?? 0);
  const suspendidos = Number(inputs.proveedoresSuspendidos ?? 0);

  const values = [confiables, requierenMejoras, suspendidos];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw ExecutiveError.badRequest(
      'Las cantidades de proveedores deben ser números mayores o iguales a cero.',
    );
  }

  const total = confiables + requierenMejoras + suspendidos;

  if (total === 0) {
    throw ExecutiveError.badRequest(
      'Debe registrar al menos un proveedor para calcular el indicador de Procura.',
    );
  }

  return {
    value: Number(((confiables / total) * 100).toFixed(2)),
    total,
  };
}

/**
 * Calcula el color del semáforo (SemaforoService portado).
 *  - AT_LEAST: measured >= target → GREEN
 *  - AT_MOST:  measured <= target → GREEN (también meta=0 → measured=0 → GREEN)
 *  - RANGE: sin rango configurado → GRAY (fallback)
 */
function calculateTrafficLight(
  measured: number,
  target: number,
  direction: string,
  thresholdsConfig?: any,
): TrafficLightValue {
  if (target === 0) {
    return measured <= 0 ? 'GREEN' : 'RED';
  }

  const ratio = measured / target;

  const thresholds = thresholdsConfig ?? {
    green: 1.0,
    yellow: direction === 'AT_LEAST' ? 0.95 : 1.05,
  };

  if (direction === 'AT_LEAST') {
    if (ratio >= (thresholds.green ?? 1.0)) return 'GREEN';
    return 'RED';
  }

  if (direction === 'AT_MOST') {
    if (ratio <= (thresholds.green ?? 1.0)) return 'GREEN';
    return 'RED';
  }

  if (direction === 'RANGE') {
    // Sin configuración de rango no se puede evaluar
    return 'GRAY';
  }

  return 'GRAY';
}

export class MeasurementsService {
  async submitMeasurement(
    data: {
      indicatorVersionId: string;
      periodId: string;
      directValue?: number;
      inputs?: Record<string, number>;
      observation?: string;
      analysisInternal?: string;
      analysisExternal?: string;
    },
    userId: string,
  ) {
    const period = await repo.findPeriodById(data.periodId);
    if (!period) throw ExecutiveError.badRequest('Invalid period');
    if (period.status === 'CLOSED') {
      throw ExecutiveError.forbidden('Reporting period is closed');
    }

    const version = await repo.findVersionWithTargets(data.indicatorVersionId);
    if (!version) throw ExecutiveError.badRequest('Invalid indicator version');

    let mainValue = 0;
    let normalizedInputs = data.inputs ?? {};

    if (version.inputMode === 'DIRECT_VALUE') {
      if (data.directValue === undefined || data.directValue === null) {
        throw ExecutiveError.badRequest('directValue is required for DIRECT_VALUE indicators');
      }
      mainValue = data.directValue;
    } else {
      // FORMULA_INPUTS
      if (isProcurementFormula(version.formula)) {
        const missing = PROCUREMENT_INPUTS.filter(
          (key) => normalizedInputs[key] === undefined,
        );
        if (missing.length > 0) {
          throw ExecutiveError.badRequest(
            `Faltan campos obligatorios para Procura: ${missing.join(', ')}.`,
          );
        }

        const result = calculateProcurementValue(normalizedInputs);
        mainValue = result.value;

        normalizedInputs = {
          proveedoresConfiables: Number(normalizedInputs.proveedoresConfiables),
          proveedoresRequierenMejoras: Number(normalizedInputs.proveedoresRequierenMejoras),
          proveedoresSuspendidos: Number(normalizedInputs.proveedoresSuspendidos),
        };
      } else if (version.formula) {
        try {
          mainValue = Number(mathEvaluate(version.formula, normalizedInputs));
        } catch {
          throw ExecutiveError.badRequest('Error evaluando la fórmula con los valores provistos');
        }
      } else {
        mainValue = Object.values(normalizedInputs).reduce((a: number, b: number) => a + b, 0);
      }
    }

    let trafficLight: TrafficLightValue = 'GRAY';
    if (version.targets && version.targets.length > 0) {
      const targetObj = version.targets[0]!;
      trafficLight = calculateTrafficLight(
        mainValue,
        targetObj.targetValue,
        version.direction,
        targetObj.thresholds,
      );
    }

    let measurement;
    try {
      measurement = await repo.createMeasurement({
        indicatorVersionId: data.indicatorVersionId,
        periodId: data.periodId,
        value: mainValue,
        trafficLight,
        status: 'SUBMITTED',
        submittedById: userId,
        observation: data.observation ?? null,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw ExecutiveError.badRequest(
          'Ya existe una medición para este indicador y período. No se puede duplicar.',
        );
      }
      throw err;
    }

    const inputRows = Object.entries(normalizedInputs).map(([key, val]) => ({
      measurementId: measurement.id,
      key,
      value: val as number,
    }));
    if (inputRows.length > 0) {
      await repo.createMeasurementInputs(inputRows);
    }

    return { success: true, measurement };
  }

  async findByProcessAssignments(userId: string, status?: string) {
    return repo.findMeasurementsByProcessAssignments(userId, status);
  }

  async reviewMeasurement(
    id: string,
    data: { status: string; observation?: string; analysisInternal?: string },
    reviewerId: string,
  ) {
    const measurement = await repo.findMeasurementBasic(id);
    if (!measurement) {
      throw ExecutiveError.notFound('Measurement not found');
    }

    if (measurement.status !== 'SUBMITTED') {
      throw ExecutiveError.badRequest(
        `Cannot review measurement with status "${measurement.status}". Only SUBMITTED measurements can be reviewed.`,
      );
    }

    const period = await repo.findPeriodStatus(measurement.periodId);
    if (period?.status === 'CLOSED') {
      throw ExecutiveError.forbidden('Cannot review measurements in a closed period');
    }

    const updated = await repo.updateMeasurementReview(id, {
      status: data.status,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      observation: data.observation,
      analysisInternal: data.analysisInternal,
    });

    return { success: true, measurement: updated };
  }

  async findAll(status?: string) {
    return repo.findMeasurementsAll(status);
  }
}
