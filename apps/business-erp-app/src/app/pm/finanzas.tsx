import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '@/features/pm/theme';
import { payablesService } from '@/features/pm/api/payables';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { MetricStrip, type MetricItem } from '@/features/pm/components/metric-strip';
import { ArrowUpRightIcon, PrinterIcon, SearchIcon } from '@/features/pm/components/icons';
import { FinancialReportModal } from '@/features/pm/components/financial-report-modal';
import { formatCurrency } from '@/features/pm/utils/format';
import type { PayablesOverview, ProjectPayablesOverview } from '@/features/pm/types';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { usePermission } from '@/features/pm/hooks/usePermission';

export default function PmFinanzasScreen() {
  const router = useRouter();
  const { status } = usePmAuth();
  const { canPrintFinancialReport } = usePermission();
  const { isTablet } = useBreakpoint();
  const [data, setData] = useState<PayablesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      setError(null);
      const res = await payablesService.getOverview();
      setData(res);
    } catch (err: any) {
      console.error('Error al cargar datos financieros:', err);
      setError(err?.message || 'Error al cargar resumen financiero');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];
    if (!search.trim()) return data.projects;
    const q = search.toLowerCase();
    return data.projects.filter(
      (p) =>
        p.code?.toLowerCase().includes(q) ||
        p.fullName?.toLowerCase().includes(q) ||
        (p.shortName && p.shortName.toLowerCase().includes(q)) ||
        (p.company?.name && p.company.name.toLowerCase().includes(q))
    );
  }, [data, search]);

  const metrics: MetricItem[] = useMemo(() => {
    if (!data) return [];
    const { globalSummary } = data;
    const paidPct =
      globalSummary.totalDebt > 0
        ? Math.round((globalSummary.totalPaid / globalSummary.totalDebt) * 100)
        : 0;

    return [
      {
        title: 'Costo Real Acumulado',
        value: formatCurrency(globalSummary.totalActualCost ?? 0),
        change: 'Total gastado en obras',
        rail: PmOpColors.orangeDeep,
      },
      {
        title: 'Total Cobrado',
        value: formatCurrency(globalSummary.totalCollected ?? 0),
        change: 'Ingresos de clientes',
        rail: PmOpColors.green,
      },
      {
        title: 'Deuda Comprometida',
        value: formatCurrency(globalSummary.totalDebt),
        change: `${globalSummary.totalProjects} proyectos reg.`,
        rail: PmOpColors.orange,
      },
      {
        title: 'Total Pagado',
        value: formatCurrency(globalSummary.totalPaid),
        change: `${paidPct}% saldado del total`,
        rail: PmOpColors.blue,
      },
      {
        title: 'Por Pagar',
        value: formatCurrency(globalSummary.totalPending),
        change: globalSummary.totalPending > 0 ? 'Pendiente desembolso' : 'Sin deuda pendiente',
        rail: globalSummary.totalPending > 0 ? PmOpColors.red : PmOpColors.inkSoft,
      },
    ];
  }, [data]);

  const renderProjectItem = useCallback(
    ({ item }: ListRenderItemInfo<ProjectPayablesOverview>) => {
      const pct =
        item.summary.totalDebt > 0
          ? Math.round((item.summary.totalPaid / item.summary.totalDebt) * 100)
          : 0;

      return (
        <View style={isTablet ? styles.cardCell : undefined}>
          <View style={styles.card}>
            {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
              <Pressable
                onPress={() => router.push(`/pm/detalle/${item.id}`)}
                style={styles.projectNamePressable}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {item.fullName || item.shortName || item.code}
                </Text>
              </Pressable>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.company?.name || 'Sin empresa asignada'}
              </Text>
            </View>

            <View style={styles.cardHeaderRight}>
              {item.summary.totalCount === 0 ? (
                <View style={[styles.badge, styles.badgeNeutral]}>
                  <Text style={[styles.badgeText, styles.badgeTextNeutral]}>Sin registros</Text>
                </View>
              ) : item.summary.openCount === 0 ? (
                <View style={[styles.badge, styles.badgeGreen]}>
                  <Text style={[styles.badgeText, styles.badgeTextGreen]}>Al día</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeRed]}>
                  <Text style={[styles.badgeText, styles.badgeTextRed]}>
                    {item.summary.openCount} abierta{item.summary.openCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Symmetrical 3-box Grid */}
          <View style={styles.metricsGrid}>
            {/* Box 1: Costo / Cobro */}
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel} numberOfLines={1}>
                Costo / Cobro
              </Text>
              <View style={styles.metricBoxValues}>
                <Text style={[styles.metricValRow, styles.costVal]} numberOfLines={1}>
                  <Text style={styles.metricValPrefix}>Real: </Text>
                  {formatCurrency(item.summary.actualCost ?? 0)}
                </Text>
                <Text style={[styles.metricValRow, styles.cobVal]} numberOfLines={1}>
                  <Text style={styles.metricValPrefix}>Cob: </Text>
                  {formatCurrency(item.summary.collectedAmount ?? 0)}
                </Text>
              </View>
            </View>

            {/* Box 2: Deuda / Pagado */}
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel} numberOfLines={1}>
                Deuda / Pagado
              </Text>
              <View style={styles.metricBoxValues}>
                <Text style={[styles.metricValRow, styles.debtVal]} numberOfLines={1}>
                  <Text style={styles.metricValPrefix}>Deuda: </Text>
                  {formatCurrency(item.summary.totalDebt)}
                </Text>
                <Text style={[styles.metricValRow, styles.paidVal]} numberOfLines={1}>
                  <Text style={styles.metricValPrefix}>Pag: </Text>
                  {formatCurrency(item.summary.totalPaid)}
                  {item.summary.totalDebt > 0 ? ` (${pct}%)` : ''}
                </Text>
              </View>
            </View>

            {/* Box 3: Por Pagar */}
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel} numberOfLines={1}>
                Por Pagar
              </Text>
              <View style={styles.metricBoxValues}>
                <Text
                  style={[
                    styles.metricValRow,
                    item.summary.totalPending > 0 ? styles.pendingValAlert : styles.cobVal,
                  ]}
                  numberOfLines={1}>
                  {formatCurrency(item.summary.totalPending)}
                </Text>
                <Text
                  style={[
                    styles.pendingStatusSub,
                    item.summary.totalPending > 0 ? styles.pendingStatusRed : styles.pendingStatusGreen,
                  ]}>
                  {item.summary.totalPending > 0 ? 'Pendiente' : 'Al día'}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerNote}>
              {item.summary.openCount > 0
                ? `${item.summary.openCount} obligación(es) pendiente(s)`
                : 'Sin compromisos pendientes'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              onPress={() => router.push(`/pm/detalle/${item.id}/cuentas-por-pagar`)}>
              <Text style={styles.actionButtonText}>Gestión Financiera</Text>
              <ArrowUpRightIcon size={12} color={PmOpColors.orangeDeep} />
            </Pressable>
          </View>
        </View>
        </View>
      );
    },
    [router, isTablet]
  );

  const keyExtractor = useCallback(
    (item: ProjectPayablesOverview, index: number) => item.id || `fin-proj-${index}`,
    []
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeaderWrapper}>
        {/* Métricas Globales sobre fondo limpio */}
        <View style={styles.metricsWrapper}>
          <MetricStrip metrics={metrics} />
        </View>

        {/* Barra de Acciones y Búsqueda */}
        <View style={styles.topActionsRow}>
          <View style={styles.searchBar}>
            <SearchIcon size={14} color={PmOpColors.inkSoft} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por código, nombre o empresa..."
              placeholderTextColor={PmOpColors.placeholder}
            />
          </View>

          {canPrintFinancialReport ? (
            <Pressable
              style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]}
              onPress={() => setIsReportOpen(true)}>
              <PrinterIcon size={14} color={PmOpColors.ink} />
              <Text style={styles.reportBtnText}>Emitir Reporte</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    ),
    [metrics, search, canPrintFinancialReport]
  );

  return (
    <PmAppShell
      title="Finanzas"
      subtitle={`Panel Financiero \u2022 ${filteredProjects.length} proyectos`}
      scrollable={false}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={PmOpColors.orange} size="large" />
          <Text style={styles.loadingText}>Cargando métricas financieras...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Lista de Proyectos con cabecera integrada y scroll fluido completo */}
          <View style={styles.listContainer}>
            <FlashList
              key={isTablet ? 'fin-tablet-grid' : 'fin-phone-list'}
              {...({
                data: filteredProjects,
                renderItem: renderProjectItem,
                keyExtractor: keyExtractor,
                numColumns: isTablet ? 2 : 1,
                ListHeaderComponent: listHeader,
                contentContainerStyle: styles.listContent,
                estimatedItemSize: 190,
                refreshControl: (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={PmOpColors.orange}
                    colors={[PmOpColors.orange]}
                  />
                ),
                ListEmptyComponent: (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No se encontraron proyectos coincidentes.</Text>
                  </View>
                ),
              } as any)}
            />
          </View>
        </View>
      )}

      {/* Modal de Reporte Financiero Consolidado */}
      <FinancialReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        globalData={data}
      />
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PmOpColors.paper,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  errorBox: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#edb6a5',
    backgroundColor: '#fff0eb',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: '#a84730',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: PmOpColors.orangeDeep,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.white,
  },
  listHeaderWrapper: {
    paddingBottom: 6,
  },
  metricsWrapper: {
    backgroundColor: 'transparent',
    paddingTop: 4,
  },
  topActionsRow: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
  },
  reportBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.orangeDeep,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.ink,
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
  },
  cardCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardHeaderRight: {
    flexShrink: 0,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff0eb',
    borderWidth: 1,
    borderColor: '#edb6a5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#a84730',
  },
  projectNamePressable: {
    marginTop: 2,
  },
  projectName: {
    fontFamily: FontFamilies.display,
    fontSize: 18,
    lineHeight: 20,
    color: PmOpColors.ink,
  },
  companyName: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeNeutral: {
    backgroundColor: '#f5f0e8',
    borderColor: PmOpColors.rule,
  },
  badgeTextNeutral: {
    color: PmOpColors.inkSoft,
  },
  badgeGreen: {
    backgroundColor: '#edf3ec',
    borderColor: '#a7c9b4',
  },
  badgeTextGreen: {
    color: '#376850',
  },
  badgeRed: {
    backgroundColor: '#fff0eb',
    borderColor: '#edb6a5',
  },
  badgeTextRed: {
    color: '#a84730',
  },
  badgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  metricBox: {
    flex: 1,
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: `${PmOpColors.rule}99`,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  metricBoxLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: PmOpColors.inkSoft,
    marginBottom: 4,
  },
  metricBoxValues: {
    gap: 2,
  },
  metricValRow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
  },
  metricValPrefix: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    color: PmOpColors.inkSoft,
  },
  costVal: {
    color: PmOpColors.orangeDeep,
  },
  cobVal: {
    color: '#376850',
  },
  debtVal: {
    color: PmOpColors.ink,
  },
  paidVal: {
    color: '#376850',
  },
  pendingValAlert: {
    color: '#a84730',
  },
  pendingStatusSub: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
  },
  pendingStatusRed: {
    color: '#a84730',
  },
  pendingStatusGreen: {
    color: '#376850',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${PmOpColors.rule}66`,
  },
  footerNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
    flex: 1,
    marginRight: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  actionButtonText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.orangeDeep,
  },
  pressed: {
    opacity: 0.7,
  },
});
