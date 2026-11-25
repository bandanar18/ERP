import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import {
  BanknoteIcon,
  BuildingIcon,
  CheckCircle2Icon,
  DownloadIcon,
  PrinterIcon,
  XIcon,
} from './icons';
import { formatCurrency, formatDate } from '../utils/format';
import { downloadFinancialReportPdf } from '../api/reports';
import type { PayablesOverview, PayablesSnapshot, Project } from '../types';

export interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modo global: resumen de todos los proyectos (desde finanzas.tsx) */
  globalData?: PayablesOverview | null;
  /** Modo específico: proyecto individual (desde cuentas-por-pagar.tsx o [id].tsx) */
  project?: Project | null;
  projectSnapshot?: PayablesSnapshot | null;
}

export function FinancialReportModal({
  isOpen,
  onClose,
  globalData,
  project,
  projectSnapshot,
}: FinancialReportModalProps) {
  const isProjectMode = Boolean(projectSnapshot || project);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const emissionDateStr = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const summary = useMemo(() => {
    if (isProjectMode && projectSnapshot) {
      const snap = projectSnapshot.summary;
      const totalDebt = snap.totalDebt || 0;
      const totalPaid = snap.totalPaid || 0;
      const totalPending = snap.totalPending || 0;
      const paidPct = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;
      const pendingPct = totalDebt > 0 ? Math.round((totalPending / totalDebt) * 100) : 0;

      return {
        totalDebt,
        totalPaid,
        totalPending,
        paidPct,
        pendingPct,
        totalActualCost: Number((project as any)?.actualCost || 0),
        totalCollected: Number((project as any)?.totalCollected || 0),
        advancePayment: Number(projectSnapshot.advance?.advanceAmount || 0),
        amortizedAdvance: Number(projectSnapshot.advance?.amortizedAmount || 0),
        pendingAdvance: Number(projectSnapshot.advance?.pendingAmortization || 0),
        totalItems: projectSnapshot.items.length,
      };
    }

    if (globalData) {
      const g = globalData.globalSummary;
      const totalDebt = g.totalDebt || 0;
      const totalPaid = g.totalPaid || 0;
      const totalPending = g.totalPending || 0;
      const paidPct = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;
      const pendingPct = totalDebt > 0 ? Math.round((totalPending / totalDebt) * 100) : 0;

      return {
        totalDebt,
        totalPaid,
        totalPending,
        paidPct,
        pendingPct,
        totalActualCost: Number(g.totalActualCost || 0),
        totalCollected: Number(g.totalCollected || 0),
        advancePayment: 0,
        amortizedAdvance: 0,
        pendingAdvance: 0,
        totalItems: globalData.projects.length,
      };
    }

    return {
      totalDebt: 0,
      totalPaid: 0,
      totalPending: 0,
      paidPct: 0,
      pendingPct: 0,
      totalActualCost: 0,
      totalCollected: 0,
      advancePayment: 0,
      amortizedAdvance: 0,
      pendingAdvance: 0,
      totalItems: 0,
    };
  }, [isProjectMode, projectSnapshot, project, globalData]);

  const reportCode = isProjectMode
    ? project?.code || (project as any)?.projectCode || 'PROYECTO'
    : 'CONSOLIDADO-GLOBAL';

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);
      await downloadFinancialReportPdf({
        isProjectMode,
        project,
        projectSnapshot,
        globalData,
        summary,
      });
    } catch (err: any) {
      console.error('Error al generar PDF financiero:', err);
      setDownloadError(err?.message || 'Error al descargar el PDF financiero');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.eyebrow}>
                {isProjectMode ? 'Finanzas / Proyecto' : 'Finanzas / Consolidado'}
              </Text>
              <Text style={styles.title}>Reporte Oficial de Pagos y Deudas</Text>
              <Text style={styles.subtitle}>
                Código: <Text style={styles.codeHighlight}>{reportCode}</Text> · Emisión: {emissionDateStr}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <XIcon size={18} color={PmOpColors.inkSoft} />
            </Pressable>
          </View>

          {downloadError ? (
            <View style={styles.errorNotice}>
              <Text style={styles.errorText}>{downloadError}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Contexto del Reporte */}
            {isProjectMode && project ? (
              <View style={styles.contextBox}>
                <View style={styles.contextRow}>
                  <BuildingIcon size={14} color={PmOpColors.orange} />
                  <Text style={styles.contextProjectName} numberOfLines={1}>
                    {project.fullName || (project as any)?.shortName || (project as any)?.name || project.code}
                  </Text>
                </View>
                <Text style={styles.contextCompany} numberOfLines={1}>
                  {project.company?.legalName || project.company?.name || 'Empresa asignada'}
                </Text>
              </View>
            ) : null}

            {/* Strip de Métricas Principales */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>DEUDA TOTAL</Text>
                <Text style={[styles.metricVal, { color: PmOpColors.orangeDeep }]}>
                  {formatCurrency(summary.totalDebt)}
                </Text>
                <Text style={styles.metricSub}>Compromisos totales</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TOTAL PAGADO</Text>
                <Text style={[styles.metricVal, { color: '#376850' }]}>
                  {formatCurrency(summary.totalPaid)}
                </Text>
                <Text style={styles.metricSub}>{summary.paidPct}% saldado</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>POR PAGAR</Text>
                <Text style={[styles.metricVal, { color: summary.totalPending > 0 ? '#c85454' : '#376850' }]}>
                  {formatCurrency(summary.totalPending)}
                </Text>
                <Text style={styles.metricSub}>
                  {summary.totalPending > 0 ? `${summary.pendingPct}% pendiente` : 'Sin deuda pendiente'}
                </Text>
              </View>
            </View>

            {/* Fila Secundaria: Costo Real vs Total Cobrado */}
            <View style={styles.secondaryRow}>
              <View style={styles.secondaryCard}>
                <Text style={styles.secLabel}>Costo Incurrido en Obra</Text>
                <Text style={styles.secVal}>{formatCurrency(summary.totalActualCost)}</Text>
              </View>
              <View style={styles.secondaryCard}>
                <Text style={styles.secLabel}>Total Cobrado a Clientes</Text>
                <Text style={[styles.secVal, { color: '#376850' }]}>{formatCurrency(summary.totalCollected)}</Text>
              </View>
            </View>

            {/* Si tiene anticipo en modo proyecto */}
            {isProjectMode && summary.advancePayment > 0 ? (
              <View style={styles.advanceCard}>
                <View style={styles.advanceHeader}>
                  <BanknoteIcon size={14} color="#8a6a12" />
                  <Text style={styles.advanceTitle}>Estado del Anticipo de Obra</Text>
                </View>
                <View style={styles.advanceGrid}>
                  <View style={styles.advanceCol}>
                    <Text style={styles.advanceColLabel}>Anticipo Otorgado</Text>
                    <Text style={styles.advanceColVal}>{formatCurrency(summary.advancePayment)}</Text>
                  </View>
                  <View style={styles.advanceCol}>
                    <Text style={styles.advanceColLabel}>Amortizado</Text>
                    <Text style={[styles.advanceColVal, { color: '#376850' }]}>
                      {formatCurrency(summary.amortizedAdvance)}
                    </Text>
                  </View>
                  <View style={styles.advanceCol}>
                    <Text style={styles.advanceColLabel}>Por Amortizar</Text>
                    <Text style={[styles.advanceColVal, { color: '#8a6a12' }]}>
                      {formatCurrency(summary.pendingAdvance)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Detalle de Partidas o Proyectos */}
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>
                {isProjectMode
                  ? `Obligaciones y Cuentas por Pagar (${summary.totalItems})`
                  : `Proyectos en Resumen (${summary.totalItems})`}
              </Text>
            </View>

            {isProjectMode && projectSnapshot?.items ? (
              <View style={styles.itemsList}>
                {projectSnapshot.items.length === 0 ? (
                  <Text style={styles.emptyItemsText}>Sin obligaciones registradas.</Text>
                ) : (
                  projectSnapshot.items.map((item, idx) => (
                    <View key={item.id || idx} style={styles.itemRow}>
                      <View style={styles.itemMain}>
                        <Text style={styles.itemDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.category} {item.supplier ? `· Prov: ${item.supplier}` : ''}
                          {item.dueDate ? ` · Vence: ${formatDate(item.dueDate)}` : ''}
                        </Text>
                      </View>
                      <View style={styles.itemAmounts}>
                        <Text style={styles.itemAmountVal}>{formatCurrency(item.amountUsd)}</Text>
                        <Text
                          style={[
                            styles.itemStatusText,
                            item.status === 'PAGADO'
                              ? styles.statusPaid
                              : item.status === 'PARCIAL'
                              ? styles.statusPartial
                              : styles.statusPending,
                          ]}>
                          {item.status} ({formatCurrency(item.pendingUsd)} pend.)
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : globalData?.projects ? (
              <View style={styles.itemsList}>
                {globalData.projects.length === 0 ? (
                  <Text style={styles.emptyItemsText}>Sin proyectos financieros.</Text>
                ) : (
                  globalData.projects.map((p, idx) => (
                    <View key={p.id || idx} style={styles.itemRow}>
                      <View style={styles.itemMain}>
                        <Text style={styles.itemDesc} numberOfLines={1}>
                          {p.code} — {p.fullName || p.shortName}
                        </Text>
                        <Text style={styles.itemMeta}>{p.company?.name || 'Sin empresa'}</Text>
                      </View>
                      <View style={styles.itemAmounts}>
                        <Text style={styles.itemAmountVal}>
                          {formatCurrency(p.summary.totalDebt)}
                        </Text>
                        <Text
                          style={[
                            styles.itemStatusText,
                            p.summary.openCount === 0 ? styles.statusPaid : styles.statusPending,
                          ]}>
                          {formatCurrency(p.summary.totalPending)} pend.
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </ScrollView>

          {/* Footer de Acciones */}
          <View style={styles.modalFooter}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </Pressable>

            <Pressable
              disabled={downloading}
              style={({ pressed }) => [
                styles.downloadBtn,
                downloading && styles.disabled,
                pressed && !downloading && styles.pressed,
              ]}
              onPress={handleDownload}>
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <PrinterIcon size={14} color="#fff" />
                  <Text style={styles.downloadBtnText}>Descargar Reporte PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 22, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#fffdf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ede8df',
    backgroundColor: '#faf7f2',
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: PmOpColors.orangeDeep,
  },
  title: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 16,
    color: PmOpColors.ink,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    marginTop: 2,
  },
  codeHighlight: {
    fontFamily: FontFamilies.bodyBold,
    color: PmOpColors.ink,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0ece2',
  },
  errorNotice: {
    margin: 12,
    marginBottom: 0,
    backgroundColor: '#fff0eb',
    borderWidth: 1,
    borderColor: '#edb6a5',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#a84730',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  contextBox: {
    backgroundColor: '#faf7f2',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextProjectName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
    flex: 1,
  },
  contextCompany: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: PmOpColors.inkSoft,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    marginVertical: 4,
  },
  metricSub: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: '#faf7f2',
    borderWidth: 1,
    borderColor: '#e5ded3',
    borderRadius: 8,
    padding: 10,
  },
  secLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  secVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
    marginTop: 2,
  },
  advanceCard: {
    backgroundColor: '#fdfbf2',
    borderWidth: 1,
    borderColor: '#e8dcba',
    borderRadius: 10,
    padding: 12,
  },
  advanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  advanceTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#8a6a12',
    textTransform: 'uppercase',
  },
  advanceGrid: {
    flexDirection: 'row',
    gap: 6,
    textAlign: 'center',
  },
  advanceCol: {
    flex: 1,
    backgroundColor: '#fffdf9',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ece4cf',
  },
  advanceColLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: PmOpColors.inkSoft,
  },
  advanceColVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
    marginTop: 2,
  },
  itemsHeader: {
    paddingTop: 4,
  },
  itemsTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: PmOpColors.inkSoft,
  },
  itemsList: {
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  emptyItemsText: {
    padding: 16,
    textAlign: 'center',
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece2',
  },
  itemMain: {
    flex: 1,
    paddingRight: 10,
  },
  itemDesc: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  itemMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
    marginTop: 2,
  },
  itemAmounts: {
    alignItems: 'flex-end',
  },
  itemAmountVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  itemStatusText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    marginTop: 2,
  },
  statusPaid: {
    color: '#376850',
  },
  statusPartial: {
    color: '#8a6a12',
  },
  statusPending: {
    color: '#c85454',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#ede8df',
    backgroundColor: '#faf7f2',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
  },
  cancelBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: PmOpColors.orangeDeep,
  },
  downloadBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#fff',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
