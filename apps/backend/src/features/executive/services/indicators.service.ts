import * as repo from '../repositories/executive.repository';
import { ExecutiveError } from '../interfaces/executive.errors';

/**
 * MÓDULO EJECUTIVO — Indicadores.
 * Portado fiel de IndicatorsService (proyecto "Resumen Ejecutivo").
 */
export class IndicatorsService {
  /**
   * Formatea la etiqueta del eje X: mes completo en mayúsculas, con el año
   * solo cuando difiere del primer período. Se leen en UTC porque los
   * períodos se guardan a medianoche UTC.
   */
  private buildPeriodLabelFormatter(periods: { startsAt: Date }[]) {
    const baseYear = periods[0]?.startsAt.getUTCFullYear();

    return (startsAt: Date) => {
      const month = startsAt
        .toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' })
        .toUpperCase();

      return startsAt.getUTCFullYear() === baseYear
        ? month
        : `${month} ${startsAt.getUTCFullYear()}`;
    };
  }

  private attachLinearTrend(chartData: any[], measuredValues: number[]) {
    const trend = this.buildLinearTrend(measuredValues);
    let measuredIndex = 0;
    let lastMeasured: any = null;

    for (const point of chartData) {
      if (point.medicion === null || point.medicion === undefined) continue;

      point.tendencia = trend.at(measuredIndex);
      lastMeasured = point;
      measuredIndex += 1;
    }

    if (lastMeasured) lastMeasured.tendenciaFinal = trend.endpoint;
  }

  private buildLinearTrend(values: number[]) {
    const n = values.length;
    const empty = { at: (_index: number) => null as number | null, endpoint: null as number | null };
    if (n < 2) return empty;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    values.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return empty;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return {
      at: (index: number) => Number((slope * index + intercept).toFixed(2)),
      endpoint: Number((slope * (n - 1) + intercept).toFixed(2)),
    };
  }

  async getIndicatorDetail(id: string) {
    const indicator = await repo.findIndicatorDetail(id);
    if (!indicator) throw ExecutiveError.notFound('Indicator not found');
    return indicator;
  }

  async getChartData(indicatorId: string, periodId?: string) {
    if (indicatorId === 'GENERAL') {
      const versions = await repo.findActiveVersionsAll();
      const versionMap = new Map(versions.map((v) => [v.id, v]));

      const measurements = await repo.findMeasurementsForGeneralChart(periodId);
      const periods = await repo.findReportingPeriods(periodId);
      const formatPeriodLabel = this.buildPeriodLabelFormatter(periods);

      const periodGroups = new Map<
        string,
        { sumMedicion: number; sumMeta: number; count: number }
      >();

      for (const m of measurements) {
        const v = versionMap.get(m.indicatorVersionId);
        if (!v) continue;

        const group = periodGroups.get(m.periodId) ?? { sumMedicion: 0, sumMeta: 0, count: 0 };
        group.sumMedicion += m.value || 0;
        group.sumMeta += v.targets[0]?.targetValue || 0;
        group.count += 1;
        periodGroups.set(m.periodId, group);
      }

      const chartData: any[] = [];
      const measuredValues: number[] = [];

      for (const period of periods) {
        const group = periodGroups.get(period.id);

        if (!group) {
          chartData.push({
            period: formatPeriodLabel(period.startsAt),
            meta: null,
            medicion: null,
            tendencia: null,
            trafficLight: null,
          });
          continue;
        }

        const avgMedicion = group.sumMedicion / group.count;

        chartData.push({
          period: formatPeriodLabel(period.startsAt),
          meta: Number((group.sumMeta / group.count).toFixed(2)),
          medicion: Number(avgMedicion.toFixed(2)),
          tendencia: null,
          trafficLight: 'GRAY',
        });
        measuredValues.push(avgMedicion);
      }

      this.attachLinearTrend(chartData, measuredValues);

      return chartData;
    }

    const version = await repo.findActiveVersionByIndicator(indicatorId);
    if (!version) return [];

    const measurements = await repo.findMeasurementsByVersion(version.id, periodId);
    const periods = await repo.findReportingPeriods(periodId);
    const formatPeriodLabel = this.buildPeriodLabelFormatter(periods);
    const measurementByPeriod = new Map(measurements.map((m) => [m.periodId, m]));
    const targetValue = version.targets[0]?.targetValue ?? 0;

    const chartData: any[] = [];
    let previousValue = 0;

    let accumulatedBilled = 0;
    let accumulatedExecuted = 0;
    const valuesForTrend: number[] = [];
    const measuredValues: number[] = [];

    for (const period of periods) {
      const periodLabel = formatPeriodLabel(period.startsAt);
      const current = measurementByPeriod.get(period.id);

      if (!current) {
        chartData.push({
          period: periodLabel,
          meta: targetValue,
          medicion: null,
          medicionAnterior: previousValue,
          tendencia: null,
          trafficLight: null,
        });
        continue;
      }

      let calculatedValue = current.value || 0;

      const dataPoint: any = {
        period: periodLabel,
        meta: targetValue,
        medicionAnterior: previousValue,
        trafficLight: current.trafficLight || 'GRAY',
      };

      if (version.aggregation === 'CUMULATIVE_RATIO') {
        const billed =
          current.inputs.find((input: any) => input.key === 'montoFacturado')?.value ?? 0;
        const executed =
          current.inputs.find((input: any) => input.key === 'montoActividadesEjecutadas')?.value ?? 0;

        accumulatedBilled += billed;
        accumulatedExecuted += executed;

        const percentage =
          accumulatedExecuted > 0 ? (accumulatedBilled / accumulatedExecuted) * 100 : 0;

        calculatedValue = Number(percentage.toFixed(2));
        dataPoint.accumulatedBilled = Number(accumulatedBilled.toFixed(2));
        dataPoint.accumulatedExecuted = Number(accumulatedExecuted.toFixed(2));
      }

      dataPoint.medicion = calculatedValue;
      valuesForTrend.push(calculatedValue);
      measuredValues.push(calculatedValue);

      if (version.aggregation === 'CUMULATIVE_RATIO') {
        const windowSize = 3;
        const window = valuesForTrend.slice(Math.max(0, valuesForTrend.length - windowSize));
        const average = window.reduce((sum, value) => sum + value, 0) / window.length;
        dataPoint.trend = Number(average.toFixed(2));
      }

      chartData.push(dataPoint);
      previousValue = calculatedValue;
    }

    this.attachLinearTrend(chartData, measuredValues);

    return chartData;
  }

  async getProcurementDistribution(indicatorId: string, startsAt?: string, endsAt?: string) {
    const measurements = await repo.findProcurementMeasurements(indicatorId, startsAt, endsAt);

    const totals = { confiables: 0, requierenMejoras: 0, suspendidos: 0 };

    for (const measurement of measurements) {
      for (const input of measurement.inputs) {
        if (input.key === 'proveedoresConfiables') totals.confiables += input.value;
        if (input.key === 'proveedoresRequierenMejoras') totals.requierenMejoras += input.value;
        if (input.key === 'proveedoresSuspendidos') totals.suspendidos += input.value;
      }
    }

    const total = totals.confiables + totals.requierenMejoras + totals.suspendidos;

    return {
      ...totals,
      total,
      porcentajeConfiables:
        total > 0 ? Number(((totals.confiables / total) * 100).toFixed(2)) : 0,
    };
  }
}
