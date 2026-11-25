import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { useQcAuth } from '@/features/qc/hooks/useQcAuth';
import { qcApi } from '@/features/qc/api/client';

export default function QcDirectorDashboardScreen() {
  const { user } = useQcAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const sumRes = await qcApi.get<any>('/dashboard/summary');
      setSummary(sumRes.data || sumRes);
    } catch (e) {
      console.error('Error fetching director dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <QcAppShell title="Resumen Ejecutivo" subtitle="Dashboard de Dirección">
      {loading ? (
        <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bienvenido, {user?.email}</Text>
            <Text style={styles.cardText}>
              Vista de solo lectura del estado de calidad de la organización.
            </Text>
          </View>

          <View style={styles.grid}>
            <View style={[styles.metricCard, { borderTopColor: QcOpColors.green, borderTopWidth: 4 }]}>
              <Text style={styles.metricValue}>{summary?.green || 0}</Text>
              <Text style={styles.metricLabel}>En Cumplimiento</Text>
            </View>
            <View style={[styles.metricCard, { borderTopColor: QcOpColors.red, borderTopWidth: 4 }]}>
              <Text style={styles.metricValue}>{summary?.red || 0}</Text>
              <Text style={styles.metricLabel}>En Riesgo</Text>
            </View>
          </View>
        </View>
      )}
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule },
  cardTitle: { fontFamily: FontFamilies.display, fontSize: 20, color: QcOpColors.ink, marginBottom: 8 },
  cardText: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.inkSoft, lineHeight: 20 },
  grid: { flexDirection: 'row', gap: 16 },
  metricCard: { flex: 1, backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, alignItems: 'center' },
  metricValue: { fontFamily: FontFamilies.display, fontSize: 32, color: QcOpColors.teal },
  metricLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
});