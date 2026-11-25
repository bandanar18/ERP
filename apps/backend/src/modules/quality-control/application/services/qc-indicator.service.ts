import { IQcIndicatorRepository } from '../../domain/repositories/qc-indicator.repository.js';
import { QcNotFoundError } from '../../errors.js';

export interface ChartPoint {
  period: string;
  meta: number | null;
  medicion: number | null;
  medicionAnterior?: number | null;
  tendencia?: number | null;
  tendenciaFinal?: number | null;
  trafficLight: string | null;
  accumulatedBilled?: number;
  accumulatedExecuted?: number;
  trend?: number;
}

export class QcIndicatorService {
  constructor(private readonly repo: IQcIndicatorRepository) {}

  /**
   * Etiqueta del eje X: nombre del mes en mayúsculas, con el año solo cuando
   * difiere del primer período del eje (ABRIL … DICIEMBRE, ENERO 2025 …).
   * Fechas en UTC (los períodos se guardan a medianoche UTC).
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

  /** Regresión lineal por mínimos cuadrados (la línea de tendencia del Excel). */
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

  /** Escribe la tendencia en cada punto medido y la anotación final en el último. */
  private attachLinearTrend(chartData: ChartPoint[], measuredValues: number[]) {
    const trend = this.buildLinearTrend(measuredValues);
    let measuredIndex = 0;
    let lastMeasured: ChartPoint | null = null;

    for (const point of chartData) {
      if (point.medicion === null || point.medicion === undefined) continue;

      point.tendencia = trend.at(measuredIndex);
      lastMeasured = point;
      measuredIndex += 1;
    }

    if (lastMeasured) lastMeasured.tendenciaFinal = trend.endpoint;
  }

  async getIndicatorDetail(id: string) {
    const indicator = await this.repo.getIndicatorDetail(id);
    if (!indicator) throw new QcNotFoundError('Indicator not found');
    return indicator;
  }

  async getChartData(indicatorId: string, periodId?: string): Promise<ChartPoint[]> {
    if (indicatorId === 'GENERAL') {
      // 1. Todas las versiones activas de CORP_MAIN con sus metas
      const versions = await this.repo.getActiveVersionsWithTargets();
      const versionMap = new Map(versions.map((v) => [v.id, v]));

      // 2. Mediciones ordenadas por período
      const measurements = await this.repo.getMeasurementsForChart(periodId);

      // 3. Calendario completo: los períodos sin medición conservan su columna
      const periods = await this.repo.getReportingPeriods(periodId);
      const formatPeriodLabel = this.buildPeriodLabelFormatter(periods);

      // 4. Agrupar por período
      const periodGroups = new Map<string, { sumMedicion: number; sumMeta: number; count: number }>();

      for (const m of measurements) {
        const v = versionMap.get(m.indicatorVersionId);
        if (!v) continue;

        const group = periodGroups.get(m.periodId) ?? { sumMedicion: 0, sumMeta: 0, count: 0 };
        group.sumMedicion += m.value || 0;
        group.sumMeta += v.targets[0]?.targetValue || 0;
        group.count += 1;
        periodGroups.set(m.periodId, group);
      }

      // 5. Un punto por período del calendario; los vacíos quedan en null
      const chartData: ChartPoint[] = [];
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

    // 1. Última versión activa del indicador y su meta
    const version = await this.repo.getActiveVersionByIndicator(indicatorId);
    if (!version) return [];

    // 2. Mediciones ordenadas por período
    const measurements = await this.repo.getMeasurementsByVersion(version.id, periodId);

    // 3. Calendario completo
    const periods = await this.repo.getReportingPeriods(periodId);
    const formatPeriodLabel = this.buildPeriodLabelFormatter(periods);
    const measurementByPeriod = new Map(measurements.map((m) => [m.periodId, m]));
    const targetValue = version.targets[0]?.targetValue ?? 0;

    // 4. Formato para la gráfica interactiva
    const chartData: ChartPoint[] = [];
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

      const dataPoint: ChartPoint = {
        period: periodLabel,
        meta: targetValue,
        medicion: null,
        medicionAnterior: previousValue,
        trafficLight: current.trafficLight || 'GRAY',
      };

      if (version.aggregation === 'CUMULATIVE_RATIO') {
        const billed = current.inputs.find((input) => input.key === 'montoFacturado')?.value ?? 0;
        const executed =
          current.inputs.find((input) => input.key === 'montoActividadesEjecutadas')?.value ?? 0;

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

    // 5. Línea de tendencia lineal + anotación final
    this.attachLinearTrend(chartData, measuredValues);

    return chartData;
  }

  async getProcurementDistribution(indicatorId: string, startsAt?: string, endsAt?: string) {
    const measurements = await this.repo.getProcurementMeasurements(indicatorId, startsAt, endsAt);

    const totals = {
      confiables: 0,
      requierenMejoras: 0,
      suspendidos: 0,
    };

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
      porcentajeConfiables: total > 0 ? Number(((totals.confiables / total) * 100).toFixed(2)) : 0,
    };
  }
}
