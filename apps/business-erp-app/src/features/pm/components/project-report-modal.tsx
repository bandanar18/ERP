import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { downloadProjectProgressReportPdf } from '../api/reports';
import { formatDate, statusColor, statusLabel } from '../utils/format';
import {
  CalendarIcon,
  DownloadIcon,
  PrinterIcon,
  TrendingUpIcon,
  XIcon,
} from './icons';
import type { PhysicalProgress, Project } from '../types';

export interface ProjectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  progressList?: PhysicalProgress[];
}

function parsePercent(val: any): number {
  if (val === null || val === undefined) return 0;
  const str = String(val).replace('%', '').trim().replace(',', '.');
  const num = Number.parseFloat(str);
  return Number.isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
}

export function ProjectReportModal({
  isOpen,
  onClose,
  project,
  progressList = [],
}: ProjectReportModalProps) {
  const [downloading, setDownloading] = useState(false);

  const normalizedReports = useMemo(() => {
    return (progressList || [])
      .map((p) => {
        const rawDate = p.date || p.endDate || p.startDate || (p as any).createdAt;
        const date = rawDate ? new Date(rawDate) : null;
        if (!date || Number.isNaN(date.getTime())) return null;
        return {
          id: p.id,
          date,
          actual: parsePercent(p.actualProgress),
          planned: parsePercent(p.plannedProgress),
          attentionPoints: p.attentionPoints || 'Sin observaciones',
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [progressList]);

  const latestReport =
    normalizedReports.length > 0 ? normalizedReports[normalizedReports.length - 1] : null;

  const actualPercent =
    latestReport?.actual ??
    parsePercent(project?.lastProgress?.actualProgress ?? project?.actualPhysicalProgress);

  const plannedPercent =
    latestReport?.planned ??
    parsePercent(project?.lastProgress?.plannedProgress ?? project?.plannedPhysicalProgress);

  const handleDownload = async () => {
    if (!project?.id) return;
    try {
      setDownloading(true);
      await downloadProjectProgressReportPdf(project.id, project, progressList);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo generar el reporte PDF';
      Alert.alert('Error al generar PDF', msg);
    } finally {
      setDownloading(false);
    }
  };

  if (!project) return null;

  const rawMgrName = (project.manager as any)?.managerName;
  const managerName = (rawMgrName && String(rawMgrName).trim())
    ? String(rawMgrName).trim()
    : [project.manager?.firstName, project.manager?.lastName].filter(Boolean).join(' ').trim() ||
      project.manager?.email ||
      'No asignado';

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* ── Header del Modal ── */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <PrinterIcon size={16} color="#b9561d" />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.modalTitle}>Reporte Oficial de Avance Físico</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {project.code} · {project.fullName}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <XIcon size={18} color="#4e5558" />
            </Pressable>
          </View>

          {/* ── Contenido Scrollable ── */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Metadatos del Proyecto */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Empresa:</Text>
                <Text style={styles.summaryVal} numberOfLines={1}>
                  {project.company?.legalName || project.company?.name || 'No especificada'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Planificador:</Text>
                <Text style={styles.summaryVal} numberOfLines={1}>
                  {managerName}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Período de Obra:</Text>
                <Text style={styles.summaryVal}>
                  {project.startDate ? formatDate(project.startDate) : 'N/A'} -{' '}
                  {project.endDate ? formatDate(project.endDate) : 'N/A'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(project.status) }]}>
                  <Text style={styles.statusText}>{statusLabel(project.status)}</Text>
                </View>
              </View>
            </View>

            {/* Métricas clave de avance (2 tarjetas simétricas) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>AVANCE REAL</Text>
                <Text style={[styles.metricVal, { color: '#376850' }]}>{actualPercent}%</Text>
                <Text style={styles.metricSub}>Certificado acumulado</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>PROGRAMADO</Text>
                <Text style={[styles.metricVal, { color: '#b9561d' }]}>{plannedPercent}%</Text>
                <Text style={styles.metricSub}>Cronograma previsto</Text>
              </View>
            </View>

            {/* Barra comparativa de cumplimiento */}
            <View style={styles.progressBarCard}>
              <View style={styles.progressBarHeader}>
                <Text style={styles.progressBarTitle}>Comparativa de Cumplimiento</Text>
                <View style={styles.progressBarLegend}>
                  <View style={styles.legendDotItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#376850' }]} />
                    <Text style={styles.legendDotText}>Real ({actualPercent}%)</Text>
                  </View>
                  <View style={styles.legendDotItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#b9561d' }]} />
                    <Text style={styles.legendDotText}>Plan ({plannedPercent}%)</Text>
                  </View>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFillReal,
                    { width: `${Math.min(100, Math.max(0, actualPercent))}%` },
                  ]}
                />
                <View
                  style={[
                    styles.progressMarkerPlan,
                    { left: `${Math.min(100, Math.max(0, plannedPercent))}%` },
                  ]}
                />
              </View>
            </View>

            {/* Historial de certificaciones */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historial de Certificaciones</Text>
              <Text style={styles.sectionCount}>{normalizedReports.length} registros</Text>
            </View>

            {normalizedReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <TrendingUpIcon size={20} color="#8d918f" />
                <Text style={styles.emptyText}>Sin certificaciones físicas registradas.</Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                {normalizedReports.map((item, idx) => {
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        idx < normalizedReports.length - 1 && styles.tableRowBorder,
                      ]}>
                      <View style={styles.tableRowHeader}>
                        <View style={styles.corteBadge}>
                          <Text style={styles.corteBadgeText}>Corte {idx + 1}</Text>
                        </View>
                        <View style={styles.dateWrap}>
                          <CalendarIcon size={12} color="#8d918f" />
                          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                        </View>
                      </View>

                      <View style={styles.tableRowMetrics}>
                        <View style={styles.col}>
                          <Text style={styles.colLabel}>Real:</Text>
                          <Text style={[styles.colVal, { color: '#376850' }]}>
                            {item.actual}%
                          </Text>
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.colLabel}>Plan:</Text>
                          <Text style={[styles.colVal, { color: '#b9561d' }]}>
                            {item.planned}%
                          </Text>
                        </View>
                      </View>

                      {item.attentionPoints ? (
                        <Text style={styles.notesText} numberOfLines={2}>
                          Obs: {item.attentionPoints}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* ── Footer de Acciones ── */}
          <View style={styles.modalFooter}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.downloadBtn,
                downloading && styles.btnDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleDownload}
              disabled={downloading}>
              {downloading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <DownloadIcon size={14} color="#ffffff" />
                  <Text style={styles.downloadBtnText}>Descargar / Compartir PDF</Text>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 22, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fbf9f5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff0eb',
    borderWidth: 1,
    borderColor: '#edb6a5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: '#111416',
  },
  modalSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#4e5558',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0eae0',
    marginVertical: 4,
  },
  summaryLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#4e5558',
  },
  summaryVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#111416',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#8d918f',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontFamily: FontFamilies.display,
    fontSize: 20,
  },
  metricSub: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: '#4e5558',
    textAlign: 'center',
  },
  progressBarCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 10,
    gap: 8,
  },
  progressBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#4e5558',
  },
  progressBarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendDotText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#4e5558',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ece6dc',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFillReal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#376850',
    borderRadius: 4,
  },
  progressMarkerPlan: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#b9561d',
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#111416',
  },
  sectionCount: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#8d918f',
  },
  emptyCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#8d918f',
  },
  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    overflow: 'hidden',
  },
  tableRow: {
    padding: 12,
    gap: 6,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0eae0',
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  corteBadge: {
    backgroundColor: '#f5f0e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  corteBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#111416',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
  },
  tableRowMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#8d918f',
  },
  colVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
  },
  notesText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
  },
  cancelBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#4e5558',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#b9561d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
});
