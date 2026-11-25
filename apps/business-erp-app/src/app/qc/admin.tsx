import { Text, View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { qcApi } from '@/features/qc/api/client';
import { BuildingIcon, FolderIcon, UserCogIcon, ActivityIcon } from '@/features/qc/components/icons';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const SHORTCUTS = [
  { label: 'Procesos', desc: 'Estructura', icon: BuildingIcon, route: '/qc/procesos' },
  { label: 'Indicadores', desc: 'Matriz y fórmulas', icon: ActivityIcon, route: '/qc/indicadores' },
  { label: 'Usuarios', desc: 'Permisos', icon: UserCogIcon, route: '/qc/usuarios' },
  { label: 'Auditoría', desc: 'Logs de sistema', icon: FolderIcon, route: '/qc/auditoria' },
];

export default function QcAdminDashboardScreen() {
  const router = useRouter();
  const { isTablet } = useBreakpoint();
  const [summary, setSummary] = useState<any>(null);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, matRes] = await Promise.all([
        qcApi.get<any>('/dashboard/summary'),
        qcApi.get<any>('/dashboard/matrix')
      ]);
      setSummary(sumRes.data || sumRes);
      setMatrix(matRes.data || matRes);
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return QcOpColors.green;
      case 'YELLOW': return QcOpColors.orange;
      case 'RED': return QcOpColors.red;
      default: return QcOpColors.inkSoft;
    }
  };

  return (
    <QcAppShell title="Panel de Administración" subtitle="Consolidado de cumplimiento del sistema">
      {loading ? (
        <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.container}>
          
          {/* Resumen */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary?.green || 0}</Text>
              <Text style={styles.summaryLabel}>En Cumplimiento</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{summary?.red || 0}</Text>
              <Text style={[styles.summaryLabel, { color: '#991b1b' }]}>No Cumplen</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
              <Text style={[styles.summaryValue, { color: '#d97706' }]}>{summary?.yellow || 0}</Text>
              <Text style={[styles.summaryLabel, { color: '#b45309' }]}>Riesgo / Alerta</Text>
            </View>
          </View>

          {/* Shortcuts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administración</Text>
            <View style={[styles.shortcutList, isTablet && styles.gridRowTablet]}>
              {SHORTCUTS.map((s) => (
                <Pressable
                  key={s.label}
                  onPress={() => router.push(s.route as any)}
                  style={({ pressed }) => [
                    styles.shortcutCard,
                    isTablet && styles.gridCardTablet,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.shortcutIconWrap}>
                    <s.icon size={20} color={QcOpColors.teal} />
                  </View>
                  <View style={styles.shortcutText}>
                    <Text style={styles.shortcutTitle}>{s.label}</Text>
                    <Text style={styles.shortcutDesc}>{s.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Matriz Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matriz Consolidada (Últimas Mediciones)</Text>
            <View style={[styles.matrixList, isTablet && styles.gridRowTablet]}>
              {matrix.slice(0, 6).map((item) => (
                <View
                  key={item.id}
                  style={[styles.matrixCard, isTablet && styles.gridCardTablet]}>
                  <View style={styles.matrixHeader}>
                    <Text style={styles.matrixCode}>{item.code}</Text>
                    <View style={[styles.dot, { backgroundColor: getStatusColor(item.trafficLight) }]} />
                  </View>
                  <Text style={styles.matrixName}>{item.name}</Text>
                  <View style={styles.matrixFooter}>
                    <Text style={styles.matrixVal}>
                      Última medición: {item.latestMeasurement !== null ? item.latestMeasurement : 'Sin datos'}
                      {item.unit === 'PERCENTAGE' ? '%' : ''}
                    </Text>
                  </View>
                </View>
              ))}
              {matrix.length === 0 && (
                <Text style={styles.empty}>No hay indicadores registrados.</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: 24, paddingBottom: 24 },
  
  // Summary
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flex: 1, minWidth: 100, backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8 },
  summaryValue: { fontFamily: FontFamilies.display, fontSize: 28, color: QcOpColors.teal, lineHeight: 32 },
  summaryLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.inkSoft, textTransform: 'uppercase', marginTop: 4 },
  
  // Sections
  section: { gap: 12 },
  sectionTitle: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.ink, textTransform: 'uppercase' },
  
  // Shortcuts
  shortcutList: { gap: 8 },
  shortcutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: QcOpColors.surface, padding: 12, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, gap: 12 },
  shortcutIconWrap: { width: 40, height: 40, backgroundColor: '#f0fdf4', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shortcutText: { flex: 1 },
  shortcutTitle: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.ink },
  shortcutDesc: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft },
  
  // Matrix Preview
  matrixList: { gap: 8 },
  matrixCard: { backgroundColor: QcOpColors.surface, padding: 12, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8 },
  matrixHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  matrixCode: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft },
  dot: { width: 10, height: 10, borderRadius: 5 },
  matrixName: { fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.ink },
  matrixFooter: { marginTop: 8, borderTopWidth: 1, borderTopColor: QcOpColors.rule, paddingTop: 8 },
  matrixVal: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft },
  empty: { textAlign: 'center', fontFamily: FontFamilies.body, color: QcOpColors.inkSoft, paddingVertical: 12 },
  gridRowTablet: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCardTablet: { width: '49%' },
  
  pressed: { opacity: 0.7 },
});