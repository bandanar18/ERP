import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { ChevronRightIcon, TrendingUpIcon } from './icons';
import type { PhysicalProgress, Project } from '../types';

export interface ProjectProgressChartProps {
  projectId?: string;
  progress?: PhysicalProgress[];
  lastProgress?: Project['lastProgress'];
  plannedProgress?: string | number | null;
  actualProgress?: string | number | null;
  projectStartDate?: string;
  projectEndDate?: string;
}

interface ChartPoint {
  name: string;
  periodLabel: string;
  dateLabel: string;
  avanceProyectado: number;
  avanceReal: number | null;
  hasRecord?: boolean;
  recordNote?: string;
}

type Timeframe = 'semanal' | 'mensual' | 'registro';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic',
};

function parsePercent(val: any): number {
  if (val === null || val === undefined) return 0;
  const str = String(val).replace('%', '').trim().replace(',', '.');
  const num = Number.parseFloat(str);
  return Number.isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`;
}

/**
 * Función matemática de Curva S (SmootherStep sigmoidal de 5to orden)
 * S(0) = 0, S(1) = 1 con derivadas nulas en extremos para curvatura suave y natural de obra.
 */
function sCurveFactor(u: number): number {
  const clamped = Math.max(0, Math.min(1, u));
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

interface PeriodItem {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

function getAllPeriods(
  startDate: Date,
  endDate: Date,
  timeframe: 'semanal' | 'mensual',
): PeriodItem[] {
  const periods: PeriodItem[] = [];
  const current = new Date(startDate);
  const finalEndDate = new Date(endDate);
  finalEndDate.setHours(23, 59, 59, 999);

  if (timeframe === 'semanal') {
    let weekIndex = 1;
    while (current <= finalEndDate) {
      const pStart = new Date(current);
      const pEnd = new Date(current);
      pEnd.setDate(pEnd.getDate() + 6);
      pEnd.setHours(23, 59, 59, 999);

      const weekNum = getISOWeek(current);
      const year = current.getFullYear();
      const key = `${year}-W${String(weekNum).padStart(2, '0')}`;

      periods.push({
        key,
        label: `S${weekIndex}`,
        startDate: pStart,
        endDate: pEnd > finalEndDate ? new Date(finalEndDate) : pEnd,
      });

      current.setDate(current.getDate() + 7);
      weekIndex++;
    }
  } else {
    while (current <= finalEndDate) {
      const pStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const pEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);

      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      periods.push({
        key,
        label: formatMonthLabel(key),
        startDate: pStart,
        endDate: pEnd > finalEndDate ? new Date(finalEndDate) : pEnd,
      });

      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
  }

  return periods;
}

function findPeriodIndex(periods: PeriodItem[], date: Date): number {
  if (periods.length === 0) return 0;
  const time = date.getTime();
  if (time <= periods[0].startDate.getTime()) return 0;
  if (time >= periods[periods.length - 1].endDate.getTime()) return periods.length - 1;

  const idx = periods.findIndex((p) => time >= p.startDate.getTime() && time <= p.endDate.getTime());
  if (idx !== -1) return idx;

  const afterIdx = periods.findIndex((p) => p.endDate.getTime() >= time);
  return afterIdx !== -1 ? afterIdx : periods.length - 1;
}

export function ProjectProgressChart({
  projectId,
  progress = [],
  lastProgress,
  plannedProgress,
  actualProgress,
  projectStartDate,
  projectEndDate,
}: ProjectProgressChartProps) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('semanal');
  const [chartWidth, setChartWidth] = useState(320);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Normalizar registros certificados
  const normalizedReports = useMemo(() => {
    return (progress || [])
      .map((p) => {
        const rawDate = p.date || p.endDate || p.startDate || (p as any).createdAt;
        const date = rawDate ? new Date(rawDate) : null;
        if (!date || Number.isNaN(date.getTime())) return null;
        return {
          id: p.id,
          date,
          actual: parsePercent(p.actualProgress),
          planned: parsePercent(p.plannedProgress),
          attentionPoints: p.attentionPoints,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [progress]);

  const currentSnapshot = useMemo(() => {
    if (normalizedReports.length > 0) {
      const last = normalizedReports[normalizedReports.length - 1];
      return { actual: last.actual, planned: last.planned };
    }
    const propActual = parsePercent(lastProgress?.actualProgress ?? actualProgress);
    const propPlanned = parsePercent(lastProgress?.plannedProgress ?? plannedProgress);
    return { actual: propActual, planned: propPlanned };
  }, [normalizedReports, lastProgress, actualProgress, plannedProgress]);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (normalizedReports.length === 0) return [];

    // 1. Por registro
    if (timeframe === 'registro') {
      const result: ChartPoint[] = [];

      if (projectStartDate) {
        const pStart = new Date(projectStartDate);
        if (!Number.isNaN(pStart.getTime()) && pStart.getTime() < normalizedReports[0].date.getTime()) {
          result.push({
            name: 'Inicio',
            periodLabel: 'Inicio de obra',
            dateLabel: pStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            avanceProyectado: 0,
            avanceReal: 0,
          });
        }
      }

      const dateCountMap = new Map<string, number>();
      for (const rep of normalizedReports) {
        const rawKey = rep.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        dateCountMap.set(rawKey, (dateCountMap.get(rawKey) || 0) + 1);
      }

      const dateSeenMap = new Map<string, number>();
      for (const rep of normalizedReports) {
        const rawKey = rep.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const total = dateCountMap.get(rawKey) || 1;
        let displayName = rawKey;
        if (total > 1) {
          const seen = (dateSeenMap.get(rawKey) || 0) + 1;
          dateSeenMap.set(rawKey, seen);
          displayName = `${rawKey} (${seen})`;
        }

        const fullDate = rep.date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        result.push({
          name: displayName,
          periodLabel: `Registro: ${fullDate}`,
          dateLabel: fullDate,
          avanceProyectado: rep.planned,
          avanceReal: rep.actual,
          hasRecord: true,
          recordNote: rep.attentionPoints,
        });
      }

      return result;
    }

    // 2. Semanal o Mensual
    const reportDates = normalizedReports.map((r) => r.date.getTime());
    const minReportDate = Math.min(...reportDates);
    const maxReportDate = Math.max(...reportDates);

    let start = projectStartDate ? new Date(projectStartDate) : new Date(minReportDate);
    let end = projectEndDate ? new Date(projectEndDate) : new Date(maxReportDate);

    if (Number.isNaN(start.getTime())) start = new Date(minReportDate);
    if (Number.isNaN(end.getTime())) end = new Date(maxReportDate);
    if (minReportDate < start.getTime()) start = new Date(minReportDate);

    const lastReport = normalizedReports[normalizedReports.length - 1];
    const currentMaxPlanned = Math.max(...normalizedReports.map((r) => r.planned));
    if (end.getTime() <= maxReportDate && currentMaxPlanned < 100) {
      const elapsedMs = Math.max(86400000 * 7, maxReportDate - start.getTime());
      const remainingRatio = (100 - currentMaxPlanned) / Math.max(1, currentMaxPlanned);
      const remainingMs = Math.min(86400000 * 90, Math.max(86400000 * 21, elapsedMs * remainingRatio));
      end = new Date(maxReportDate + remainingMs);
    } else if (maxReportDate > end.getTime()) {
      end = new Date(maxReportDate);
    }

    const periods = getAllPeriods(start, end, timeframe);
    if (periods.length === 0) return [];

    const totalPeriods = periods.length;
    const lastReportPeriodIdx = findPeriodIndex(periods, lastReport.date);

    const milestoneMap = new Map<number, { planned: number; actual: number }>();
    for (const report of normalizedReports) {
      const idx = findPeriodIndex(periods, report.date);
      milestoneMap.set(idx, { planned: report.planned, actual: report.actual });
    }
    milestoneMap.set(lastReportPeriodIdx, { planned: lastReport.planned, actual: lastReport.actual });

    const knownPoints: { idx: number; planned: number; actual: number }[] = [
      { idx: -1, planned: 0, actual: 0 },
    ];
    const sortedIndices = Array.from(milestoneMap.keys()).sort((a, b) => a - b);
    for (const idx of sortedIndices) {
      if (idx <= lastReportPeriodIdx) {
        knownPoints.push({ idx, ...milestoneMap.get(idx)! });
      }
    }

    return periods.map((period, i) => {
      const matchingReport = normalizedReports.find(
        (r) => r.date >= period.startDate && r.date <= period.endDate,
      );

      let avanceReal: number | null = null;
      let avanceProyectado = 0;

      if (i <= lastReportPeriodIdx) {
        if (milestoneMap.has(i)) {
          const direct = milestoneMap.get(i)!;
          avanceProyectado = direct.planned;
          avanceReal = direct.actual;
        } else {
          let prevPoint = knownPoints[0];
          let nextPoint = knownPoints[knownPoints.length - 1];

          for (let k = 0; k < knownPoints.length; k++) {
            if (knownPoints[k].idx <= i) prevPoint = knownPoints[k];
            if (knownPoints[k].idx >= i) {
              nextPoint = knownPoints[k];
              break;
            }
          }

          const span = nextPoint.idx - prevPoint.idx;
          if (span > 0) {
            const u = (i - prevPoint.idx) / span;
            const sFactor = sCurveFactor(u);
            avanceProyectado = Math.round(prevPoint.planned + (nextPoint.planned - prevPoint.planned) * sFactor);
            avanceReal = Math.round(prevPoint.actual + (nextPoint.actual - prevPoint.actual) * sFactor);
          } else {
            avanceProyectado = nextPoint.planned;
            avanceReal = nextPoint.actual;
          }
        }
      } else {
        avanceReal = null;
        const remainingSteps = totalPeriods - 1 - lastReportPeriodIdx;
        const currentStep = i - lastReportPeriodIdx;
        if (remainingSteps > 0) {
          const u = currentStep / remainingSteps;
          const sFactor = sCurveFactor(u);
          avanceProyectado = Math.min(100, Math.round(lastReport.planned + (100 - lastReport.planned) * sFactor));
        } else {
          avanceProyectado = 100;
        }
      }

      return {
        name: period.label,
        periodLabel: period.label,
        dateLabel: `${period.startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${period.endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
        avanceProyectado: Math.min(100, Math.max(0, avanceProyectado)),
        avanceReal: avanceReal !== null ? Math.min(100, Math.max(0, avanceReal)) : null,
        hasRecord: !!matchingReport,
        recordNote: matchingReport?.attentionPoints,
      };
    });
  }, [normalizedReports, projectStartDate, projectEndDate, timeframe]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 50) {
      setChartWidth(width - 32); // Restar padding interno de la card (16 * 2)
    }
  };

  if (normalizedReports.length === 0) {
    return (
      <View style={styles.card} onLayout={onContainerLayout}>
        <View style={styles.header}>
          <Text style={styles.title}>Evolución de Avance Físico</Text>
          <Text style={styles.subtitle}>Avance físico proyectado versus avance real</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <TrendingUpIcon size={24} color={PmOpColors.orange} />
          </View>
          <Text style={styles.emptyTitle}>No hay registros de avance disponibles</Text>
          <Text style={styles.emptyText}>
            Este proyecto aún no cuenta con certificaciones ni avances físicos reportados.
          </Text>
          {projectId ? (
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
              onPress={() => router.push(`/pm/detalle/${projectId}/avances`)}>
              <Text style={styles.emptyBtnText}>Registrar primer avance</Text>
              <ChevronRightIcon size={14} color={PmOpColors.orangeDeep} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  // Dimensiones del gráfico vectorial SVG
  const chartHeight = 180;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 15;
  const paddingBottom = 26;

  const usableWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const pointsCount = chartData.length;
  const stepX = pointsCount > 1 ? usableWidth / (pointsCount - 1) : usableWidth;

  const getX = (index: number) => paddingLeft + index * stepX;
  const getY = (percent: number) => paddingTop + usableHeight - (Math.min(100, Math.max(0, percent)) / 100) * usableHeight;

  // Curva proyectada (Plan)
  const plannedPathD = chartData.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.avanceProyectado);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Curva real (Certificada)
  const realPoints = chartData
    .map((pt, i) => ({ pt, index: i, x: getX(i), y: pt.avanceReal !== null ? getY(pt.avanceReal) : null }))
    .filter((p): p is { pt: ChartPoint; index: number; x: number; y: number } => p.y !== null);

  const realLineD = realPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Área bajo la curva real
  const realAreaD =
    realPoints.length > 0
      ? `${realLineD} L ${realPoints[realPoints.length - 1].x} ${paddingTop + usableHeight} L ${realPoints[0].x} ${paddingTop + usableHeight} Z`
      : '';

  const activePoint = selectedIndex !== null ? chartData[selectedIndex] : null;

  return (
    <View style={styles.card} onLayout={onContainerLayout}>
      {/* ── Encabezado de la card con badges y título ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Evolución de Avance Físico</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badgePlan}>
              <Text style={styles.badgePlanText}>Plan: {currentSnapshot.planned}%</Text>
            </View>
            <View style={styles.badgeReal}>
              <Text style={styles.badgeRealText}>Real: {currentSnapshot.actual}%</Text>
            </View>
          </View>
        </View>
        <Text style={styles.subtitle}>Avance físico proyectado versus avance real</Text>

        {/* ── Selector de timeframe ── */}
        <View style={styles.timeframeContainer}>
          <Pressable
            onPress={() => {
              setTimeframe('semanal');
              setSelectedIndex(null);
            }}
            style={[styles.timeframeBtn, timeframe === 'semanal' && styles.timeframeBtnActive]}>
            <Text
              style={[
                styles.timeframeBtnText,
                timeframe === 'semanal' && styles.timeframeBtnTextActive,
              ]}>
              Semanal
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setTimeframe('mensual');
              setSelectedIndex(null);
            }}
            style={[styles.timeframeBtn, timeframe === 'mensual' && styles.timeframeBtnActive]}>
            <Text
              style={[
                styles.timeframeBtnText,
                timeframe === 'mensual' && styles.timeframeBtnTextActive,
              ]}>
              Mensual
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setTimeframe('registro');
              setSelectedIndex(null);
            }}
            style={[styles.timeframeBtn, timeframe === 'registro' && styles.timeframeBtnActive]}>
            <Text
              style={[
                styles.timeframeBtnText,
                timeframe === 'registro' && styles.timeframeBtnTextActive,
              ]}>
              Por Registro
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Gráfico vectorial SVG ── */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4c9b7a" stopOpacity="0.28" />
              <Stop offset="100%" stopColor="#4c9b7a" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Líneas horizontales de guía (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            return (
              <G key={`grid-${val}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e8e2d8"
                  strokeWidth="1"
                  strokeDasharray={val === 0 || val === 100 ? undefined : '3 3'}
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 3.5}
                  fontSize="8"
                  fill="#8d918f"
                  textAnchor="end"
                  fontFamily={FontFamilies.bodyBold}>
                  {val}%
                </SvgText>
              </G>
            );
          })}

          {/* Área sombreada real */}
          {realAreaD ? <Path d={realAreaD} fill="url(#realGradient)" /> : null}

          {/* Curva Proyectada (Plan, color naranja) */}
          {plannedPathD ? (
            <Path
              d={plannedPathD}
              stroke="#b9561d"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 3"
            />
          ) : null}

          {/* Curva Real (Certificada, color verde esmeralda) */}
          {realLineD ? (
            <Path d={realLineD} stroke="#4c9b7a" strokeWidth="2.5" fill="none" />
          ) : null}

          {/* Puntos certificados sobre la curva real */}
          {realPoints.map((p) => {
            const isSelected = selectedIndex === p.index;
            return (
              <G key={`point-${p.index}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill="#ffffff"
                  stroke="#4c9b7a"
                  strokeWidth={isSelected ? 3 : 2}
                />
              </G>
            );
          })}

          {/* Etiquetas del eje X (mostramos hasta 5 distribuidas simétricamente) */}
          {chartData.map((pt, i) => {
            const shouldShowLabel =
              pointsCount <= 6 ||
              i === 0 ||
              i === pointsCount - 1 ||
              i === Math.floor(pointsCount / 2);

            if (!shouldShowLabel) return null;
            const x = getX(i);
            const y = chartHeight - 8;
            return (
              <SvgText
                key={`label-${i}`}
                x={x}
                y={y}
                fontSize="8"
                fill="#8d918f"
                textAnchor={i === 0 ? 'start' : i === pointsCount - 1 ? 'end' : 'middle'}
                fontFamily={FontFamilies.body}>
                {pt.name}
              </SvgText>
            );
          })}
        </Svg>

        {/* Capas táctiles sobre cada punto para seleccionar y ver detalle */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {chartData.map((pt, i) => {
            const x = getX(i);
            return (
              <Pressable
                key={`hit-${i}`}
                onPress={() => setSelectedIndex(selectedIndex === i ? null : i)}
                style={[
                  styles.hitArea,
                  {
                    left: Math.max(0, x - 15),
                    width: 30,
                    height: chartHeight,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* ── Tooltip/Detalle del punto seleccionado ── */}
      {activePoint ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailPeriod}>{activePoint.periodLabel}</Text>
            <Text style={styles.detailDate}>{activePoint.dateLabel}</Text>
          </View>
          <View style={styles.detailMetrics}>
            <View style={styles.detailMetricCol}>
              <Text style={styles.detailMetricLabel}>PROYECTADO</Text>
              <Text style={[styles.detailMetricVal, { color: '#b9561d' }]}>
                {activePoint.avanceProyectado}%
              </Text>
            </View>
            <View style={styles.detailMetricCol}>
              <Text style={styles.detailMetricLabel}>REAL CERTIFICADO</Text>
              <Text style={[styles.detailMetricVal, { color: '#4c9b7a' }]}>
                {activePoint.avanceReal !== null ? `${activePoint.avanceReal}%` : 'Pendiente'}
              </Text>
            </View>
          </View>
          {activePoint.recordNote ? (
            <Text style={styles.detailNote}>Obs: {activePoint.recordNote}</Text>
          ) : null}
        </View>
      ) : null}

      {/* ── Leyenda inferior de la gráfica ── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: '#b9561d', borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>Avance Proyectado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4c9b7a' }]} />
          <Text style={styles.legendText}>Avance Real</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: '#111416',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePlan: {
    backgroundColor: '#fff0eb',
    borderWidth: 1,
    borderColor: '#edb6a5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePlanText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#b9561d',
  },
  badgeReal: {
    backgroundColor: '#eaf4ee',
    borderWidth: 1,
    borderColor: '#b8dfca',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRealText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#376850',
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#4e5558',
    marginTop: 2,
  },
  timeframeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#f5f0e8',
    padding: 2,
    marginTop: 10,
  },
  timeframeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeBtnActive: {
    backgroundColor: '#111416',
  },
  timeframeBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#4e5558',
  },
  timeframeBtnTextActive: {
    color: '#ffffff',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  hitArea: {
    position: 'absolute',
    top: 0,
  },
  detailCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fbf9f5',
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailPeriod: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#111416',
  },
  detailDate: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
  },
  detailMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailMetricCol: {
    gap: 2,
  },
  detailMetricLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#8d918f',
    letterSpacing: 0.5,
  },
  detailMetricVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
  },
  detailNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLine: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
  },
  legendText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#4e5558',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f0e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: '#111416',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#4e5558',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#b9561d',
  },
  pressed: {
    opacity: 0.7,
  },
});
