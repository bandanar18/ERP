import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '../theme';
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from './icons';

export interface MetricItem {
  title: string;
  value: string;
  /** Tendencia (ej. "+8% vs mes anterior"). */
  change?: string;
  subLabel?: string;
  /** Color de la barra (hex). */
  rail?: string;
  /** Ancho de la barra (porcentaje). */
  width?: DimensionValue;
}

/**
 * Tira de métricas estilo Business ERP (espejo del `ErpMetricStrip` web):
 * - En teléfonos: 2 columnas simétricas por fila sin desbordamiento.
 * - En tablets: 1 sola fila si son <= 5 métricas; 3 cols si son 6; 4 cols si son >= 7.
 * - Utiliza filas explícitas con `flex: 1` para garantizar simetría matemática
 *   absoluta en cualquier densidad de pantalla (evita problemas de wrap en Android/iOS).
 */
export function MetricStrip({ metrics }: { metrics: MetricItem[] }) {
  const { isTablet } = useBreakpoint();
  const count = metrics.length;

  // En tablets: <= 5 en 1 fila; 6 en 2 filas de 3; >= 7 en filas de 4.
  // En teléfonos: 2 columnas exactas por fila.
  const columns = isTablet ? (count <= 5 ? count : count === 6 ? 3 : 4) : 2;

  // Agrupar en filas simétricas rellenando con null si falta algún slot en la última fila
  const rows: (MetricItem | null)[][] = [];
  for (let i = 0; i < metrics.length; i += columns) {
    const chunk: (MetricItem | null)[] = metrics.slice(i, i + columns);
    while (chunk.length < columns) {
      chunk.push(null);
    }
    rows.push(chunk);
  }

  const getTrend = (change?: string) => {
    if (!change) return null;
    if (change.startsWith('+')) {
      return { Icon: TrendingUpIcon, color: '#4c9b7a' };
    }
    if (change.startsWith('-')) {
      return { Icon: TrendingDownIcon, color: '#c85454' };
    }
    return { Icon: MinusIcon, color: '#4e5558' };
  };

  const isCompact = isTablet && count >= 5;

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((metric, colIndex) => {
            if (!metric) {
              return <View key={`spacer-${colIndex}`} style={styles.spacer} />;
            }

            const originalIndex = rowIndex * columns + colIndex;
            const trend = getTrend(metric.change);
            const TrendIcon = trend?.Icon;

            return (
              <View
                key={originalIndex}
                style={[styles.card, isCompact && styles.cardCompact]}>
                <View>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title} numberOfLines={1}>
                      {metric.title}
                    </Text>
                    <Text style={styles.index}>0{originalIndex + 1}</Text>
                  </View>

                  <View style={styles.valueRow}>
                    <Text
                      style={[styles.value, isCompact && styles.valueCompact]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}>
                      {metric.value}
                    </Text>
                    {metric.subLabel ? (
                      <Text style={styles.subLabel} numberOfLines={1}>
                        {metric.subLabel}
                      </Text>
                    ) : null}
                  </View>

                  {metric.change && trend && TrendIcon ? (
                    <View style={styles.trendRow}>
                      <TrendIcon size={12} color={trend.color} strokeWidth={2.5} />
                      <Text style={[styles.change, { color: trend.color }]} numberOfLines={1}>
                        {metric.change}
                      </Text>
                    </View>
                  ) : metric.change ? (
                    <Text style={styles.change} numberOfLines={1}>
                      {metric.change}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.rail}>
                  <View
                    style={[
                      styles.railFill,
                      {
                        backgroundColor:
                          metric.rail ?? PmOpColors.rails[originalIndex % PmOpColors.rails.length],
                        width: metric.width ?? '72%',
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 11,
    paddingVertical: 10,
    justifyContent: 'space-between',
    minHeight: 106,
    shadowColor: '#1c0f08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardCompact: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    minHeight: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  title: {
    flex: 1,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#4e5558',
  },
  index: {
    fontFamily: FontFamilies.display,
    fontSize: 14,
    letterSpacing: 0.5,
    color: '#d8d0c4',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 4,
  },
  value: {
    fontFamily: FontFamilies.display,
    fontSize: 27,
    lineHeight: 29,
    letterSpacing: 0.5,
    color: '#111416',
  },
  valueCompact: {
    fontSize: 22,
    lineHeight: 24,
  },
  subLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#8d918f',
    flexShrink: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  change: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9.5,
    color: '#4c9b7a',
    flexShrink: 1,
  },
  rail: {
    height: 3,
    marginTop: 10,
    backgroundColor: '#ece6dc',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  railFill: {
    height: '100%',
    borderRadius: 9999,
  },
});