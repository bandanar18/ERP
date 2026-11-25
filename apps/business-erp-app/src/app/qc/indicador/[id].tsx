import { Text, View, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { indicatorApi, QcIndicatorDetail, QcChartPoint } from '@/features/qc/api/indicator';
import { ArrowLeftIcon } from 'lucide-react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';

const QC_FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  PROJECT_BASED: 'Por Proyecto',
};

const QC_DIRECTION_LABELS: Record<string, string> = {
  AT_LEAST: 'Maximizar (≥ Meta)',
  AT_MOST: 'Minimizar (≤ Meta)',
  RANGE: 'Mantener en Rango',
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  DRAFT: 'Borrador',
  LOCKED: 'Bloqueada',
};

function formatValue(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '--';
  return Number.isInteger(value) ? String(value) : value.toFixed(decimals);
}

export default function QcIndicadorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [detail, setDetail] = useState<QcIndicatorDetail | null>(null);
  const [chartData, setChartData] = useState<QcChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [detailRes, chartRes] = await Promise.all([
        indicatorApi.detail(id as string),
        indicatorApi.chart(id as string).catch(() => [] as QcChartPoint[])
      ]);
      setDetail((detailRes as any).data || detailRes);
      setChartData((chartRes as any).data || chartRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [loadData, id]);

  if (loading) {
    return (
      <QcAppShell title="Cargando..." scrollable={false}>
        <ActivityIndicator color={QcOpColors.accent} style={{ marginTop: 40 }} />
      </QcAppShell>
    );
  }

  if (!detail) {
    return (
      <QcAppShell title="Error" scrollable={false}>
        <Text style={styles.empty}>Indicador no encontrado.</Text>
      </QcAppShell>
    );
  }

  const activeVersion = detail.versions?.find(v => v.effectiveTo === null) || detail.versions?.[0];
  const target = activeVersion?.targets?.[0];
  const measurements = activeVersion?.measurements || [];

  return (
    <QcAppShell 
      title={detail.name} 
      subtitle={`${detail.process?.name || ''} • ${QC_FREQUENCY_LABELS[activeVersion?.frequency ?? ''] ?? activeVersion?.frequency}`} 
      scrollable={true}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeftIcon size={16} color={QcOpColors.inkSoft} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      <View style={styles.cardsGrid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Frecuencia</Text>
          <Text style={styles.cardValue}>
            {QC_FREQUENCY_LABELS[activeVersion?.frequency ?? ''] ?? activeVersion?.frequency ?? '--'}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Dirección</Text>
          <Text style={styles.cardValue}>
            {QC_DIRECTION_LABELS[activeVersion?.direction ?? ''] ?? activeVersion?.direction ?? '--'}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Meta</Text>
          <Text style={styles.cardValue}>
            {formatValue(target?.targetValue, target?.targetValue === Math.round(target?.targetValue ?? 0) ? 0 : 2)}
            {target?.unit ? ` ${target.unit}` : ''}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mediciones</Text>
          <Text style={styles.cardValue}>{measurements.length}</Text>
        </View>
      </View>

      {activeVersion?.formula ? (
        <View style={styles.formulaCard}>
          <Text style={styles.cardLabel}>Fórmula de cálculo</Text>
          <Text style={styles.formulaText}>{activeVersion.formula}</Text>
        </View>
      ) : null}

      <View style={styles.trendCard}>
        <Text style={styles.trendTitle}>Tendencia de la medición</Text>
        <Text style={styles.trendSubtitle}>Meta vs. medición por período</Text>
        
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <SimpleBarChart data={chartData} targetValue={target?.targetValue || 0} />
          </View>
        ) : (
          <Text style={styles.empty}>No hay datos suficientes para graficar.</Text>
        )}
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.trendTitle}>Historial de mediciones</Text>
        <View style={styles.historyList}>
          {measurements.length > 0 ? (
            measurements.map(m => (
              <View key={m.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyPeriod}>{m.period?.startsAt ? new Date(m.period.startsAt).toLocaleDateString() : 'N/A'}</Text>
                  <Text style={styles.historyStatus}>{STATUS_LABELS[m.status] || m.status}</Text>
                </View>
                <View style={styles.historyValueContainer}>
                  <Text style={styles.historyValue}>{m.value ?? '--'}</Text>
                  {m.trafficLight && (
                    <View style={[styles.trafficLight, { backgroundColor: m.trafficLight === 'GREEN' ? QcOpColors.green : m.trafficLight === 'YELLOW' ? QcOpColors.orange : QcOpColors.red }]} />
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No hay mediciones registradas.</Text>
          )}
        </View>
      </View>

    </QcAppShell>
  );
}

function SimpleBarChart({ data, targetValue }: { data: QcChartPoint[], targetValue: number }) {
  const chartHeight = 200;
  const screenWidth = Dimensions.get('window').width - 64; // Padding
  const paddingVertical = 20;
  const paddingHorizontal = 10;
  
  // Clean data
  const validData = data.filter(d => d.medicion !== null && d.medicion !== undefined);
  if (validData.length === 0) return <Text style={styles.empty}>Sin mediciones para graficar.</Text>;

  const maxVal = Math.max(...validData.map(d => d.medicion as number), targetValue) * 1.1;
  const minVal = Math.min(0, Math.min(...validData.map(d => d.medicion as number), targetValue));
  
  const range = maxVal - minVal || 1;
  const drawableWidth = screenWidth - paddingHorizontal * 2;
  const stepX = drawableWidth / Math.max(1, validData.length);
  const barWidth = Math.min(30, stepX * 0.6);

  const getY = (val: number) => chartHeight - paddingVertical - ((val - minVal) / range) * (chartHeight - paddingVertical * 2);
  const getX = (index: number) => paddingHorizontal + index * stepX + (stepX / 2);

  const targetY = getY(targetValue);

  return (
    <View style={{ height: chartHeight + 20, width: '100%' }}>
      <Svg width={screenWidth} height={chartHeight}>
        {/* Target Line */}
        <Line x1="0" y1={targetY} x2={screenWidth} y2={targetY} stroke={QcOpColors.green} strokeWidth="2" strokeDasharray="4 4" />
        <Line x1="0" y1={chartHeight - paddingVertical} x2={screenWidth} y2={chartHeight - paddingVertical} stroke={QcOpColors.rule} strokeWidth="1" />
        
        {/* Target Text */}
        <SvgText x={screenWidth} y={targetY - 5} fontSize="10" fill={QcOpColors.green} textAnchor="end" fontWeight="bold">
          Meta: {targetValue}
        </SvgText>
        
        {/* Bars and values */}
        {validData.map((d, i) => {
          const xCenter = getX(i);
          const yTop = getY(d.medicion as number);
          const barHeight = chartHeight - paddingVertical - yTop;
          
          return (
            <G key={`bar-${i}`}>
              <Rect 
                x={xCenter - barWidth / 2} 
                y={yTop} 
                width={barWidth} 
                height={Math.max(0, barHeight)} 
                fill={QcOpColors.teal} 
                rx={4}
              />
              <SvgText 
                x={xCenter} 
                y={yTop - 5} 
                fontSize="10" 
                fill={QcOpColors.ink} 
                textAnchor="middle"
                fontWeight="bold"
              >
                {formatValue(d.medicion, 2)}
              </SvgText>
            </G>
          );
        })}

        {/* X-axis labels */}
        {validData.map((d, i) => (
          <SvgText 
            key={`x-${i}`} 
            x={getX(i)} 
            y={chartHeight} 
            fontSize="10" 
            fill={QcOpColors.inkSoft} 
            textAnchor="middle"
          >
            {d.period.substring(0, 7)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 24, fontFamily: FontFamilies.body, color: QcOpColors.inkSoft },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft, textTransform: 'uppercase' },
  
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, width: '48%' },
  cardLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.inkSoft, textTransform: 'uppercase', marginBottom: 6 },
  cardValue: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink },

  formulaCard: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, marginBottom: 16 },
  formulaText: { fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.ink, backgroundColor: QcOpColors.paper, padding: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 },

  trendCard: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, marginBottom: 24 },
  trendTitle: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink, marginBottom: 2 },
  trendSubtitle: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginBottom: 16 },
  chartContainer: { height: 220, width: '100%' },

  historyCard: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, marginBottom: 24 },
  historyList: { marginTop: 12 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: QcOpColors.rule },
  historyPeriod: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.ink },
  historyStatus: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginTop: 4 },
  historyValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyValue: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink },
  trafficLight: { width: 12, height: 12, borderRadius: 6 },
});
