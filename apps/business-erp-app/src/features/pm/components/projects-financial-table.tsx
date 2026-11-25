import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '../theme';
import type { Project } from '../types';
import { formatCurrency, statusColor, statusLabel } from '../utils/format';
import {
  AlertCircleIcon,
  BuildingIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  XIcon,
} from './icons';

interface ProjectsFinancialTableProps {
  projects: Project[];
}

export function ProjectsFinancialTable({ projects }: ProjectsFinancialTableProps) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const processedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects
      .filter((p): p is Project => Boolean(p && typeof p === 'object'))
      .map((p) => {
        const planPresupuesto = Number(p.estimatedCost || p.offeredAmount || 0);
        const costoReal = Number(p.actualCost ?? 0);

        const rawActual =
          p.lastProgress?.actualProgress ??
          p.actualPhysicalProgress;
        const rawPlanned =
          p.lastProgress?.plannedProgress ??
          p.plannedPhysicalProgress;

        const formatProgressPercent = (val: any, fallback = '0%') => {
          if (val === null || val === undefined || String(val).trim() === '') return fallback;
          const str = String(val).trim();
          return str.endsWith('%') ? str : `${str}%`;
        };

        const planificadoAvance = formatProgressPercent(rawPlanned, '0%');
        const realAvance = formatProgressPercent(rawActual, '0%');

        const facturadoValuado = Number(p.billedAmount ?? 0);
        const montoCobrado = Number(p.collectedAmount ?? 0);
        const cuentasPorPagar = Number(p.cuentasPorPagar ?? p.accountsPayable ?? 0);

        const fechaReal = p.actualEndDate || p.closedAt;
        const fechaEstimada = p.endDate;
        const fechaCulminacion = fechaReal
          ? {
              label: new Date(fechaReal).toLocaleDateString('es-ES'),
              isReal: true,
            }
          : fechaEstimada
          ? {
              label: new Date(fechaEstimada).toLocaleDateString('es-ES'),
              isReal: false,
            }
          : {
              label: 'Sin fecha',
              isReal: false,
            };

        return {
          ...p,
          planPresupuesto,
          costoReal,
          planificadoAvance,
          realAvance,
          facturadoValuado,
          montoCobrado,
          cuentasPorPagar,
          fechaCulminacion,
        };
      });
  }, [projects]);

  const { isTablet } = useBreakpoint();

  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  return (
    <View style={styles.card}>
      {/* Cabecera de la tarjeta */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.eyebrow}>Vista Financiera y Operativa</Text>
          <Text style={styles.cardTitle}>Seguimiento de Proyectos</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
          </Text>
        </View>
      </View>

      {/* Lista de proyectos */}
      <View style={[styles.cardBody, isTablet && styles.cardBodyTablet]}>
        {processedProjects.map((p) => {
          const projectCode = p?.code || '';
          const projectName = p?.fullName || (p as any)?.name || p?.shortName || projectCode || 'Proyecto';
          const badgeColor = statusColor(p?.status);
          const badgeText = statusLabel(p?.status);

          return (
            <View key={p.id} style={[styles.projectCard, isTablet && styles.projectCardTablet]}>

              {/* Encabezado del proyecto */}
              <View style={styles.projectHeader}>
                <View style={styles.projectHeaderLeft}>
                  <Pressable
                    onPress={() => router.push(`/pm/detalle/${p.id}`)}
                    style={({ pressed }) => [
                      styles.projectNamePressable,
                      pressed && { opacity: 0.7 },
                    ]}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {projectName}
                    </Text>
                    <ExternalLinkIcon size={12} color="#b9561d" />
                  </Pressable>
                  {projectCode ? (
                    <Text style={styles.projectCode} numberOfLines={1}>
                      {projectCode}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      borderColor: badgeColor,
                      backgroundColor: `${badgeColor}15`,
                    },
                  ]}>
                  <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                    {badgeText}
                  </Text>
                </View>
              </View>

              {/* Grid 2x2 de métricas financieras y operativas */}
              <View style={styles.metricsGrid}>
                {/* 1. Presupuesto / Real */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Presupuesto / Real</Text>
                  <View style={styles.metricValues}>
                    <Text style={styles.metricValuePrimary} numberOfLines={1}>
                      <Text style={styles.metricPrefix}>FP: </Text>
                      {formatCurrency(p.planPresupuesto)}
                    </Text>
                    <Text style={[styles.metricValuePrimary, { color: '#5e8fc2' }]} numberOfLines={1}>
                      <Text style={styles.metricPrefix}>Real: </Text>
                      {formatCurrency(p.costoReal)}
                    </Text>
                  </View>
                </View>

                {/* 2. Avance Físico */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Avance Físico</Text>
                  <View style={styles.metricValues}>
                    <Text style={styles.metricValuePrimary} numberOfLines={1}>
                      <Text style={styles.metricPrefix}>Plan: </Text>
                      {p.planificadoAvance}
                    </Text>
                    <Text style={[styles.metricValuePrimary, { color: '#4c9b7a' }]} numberOfLines={1}>
                      <Text style={[styles.metricPrefix, { color: '#4c9b7a' }]}>Real: </Text>
                      {p.realAvance}
                    </Text>
                  </View>
                </View>

                {/* 3. Facturado / Cobrado */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Facturado / Cobrado</Text>
                  <View style={styles.metricValues}>
                    <Text style={styles.metricValuePrimary} numberOfLines={1}>
                      <Text style={styles.metricPrefix}>Fact: </Text>
                      {formatCurrency(p.facturadoValuado)}
                    </Text>
                    <Text style={[styles.metricValuePrimary, { color: '#4c9b7a' }]} numberOfLines={1}>
                      <Text style={styles.metricPrefix}>Cob: </Text>
                      {formatCurrency(p.montoCobrado)}
                    </Text>
                  </View>
                </View>

                {/* 4. Cuentas por Pagar */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Cuentas por Pagar</Text>
                  <View style={styles.metricValues}>
                    <Text
                      style={[
                        styles.metricValuePrimary,
                        { color: p.cuentasPorPagar > 0 ? '#c85454' : '#111416' },
                      ]}
                      numberOfLines={1}>
                      <Text style={styles.metricPrefix}>Por Pagar: </Text>
                      {formatCurrency(p.cuentasPorPagar)}
                    </Text>
                    <Text
                      style={[
                        styles.metricSubText,
                        { color: p.cuentasPorPagar > 0 ? '#c85454' : '#376850' },
                      ]}
                      numberOfLines={1}>
                      {p.cuentasPorPagar > 0 ? 'Saldo pendiente' : 'Sin deuda'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Pie de tarjeta del proyecto */}
              <View style={styles.projectFooter}>
                <View style={styles.culminationRow}>
                  <Text style={styles.culminationLabel}>Culminación:</Text>
                  <Text style={styles.culminationValue}>{p.fechaCulminacion.label}</Text>
                  <View
                    style={[
                      styles.culminationBadge,
                      p.fechaCulminacion.isReal
                        ? { backgroundColor: '#edf3ec' }
                        : { backgroundColor: '#ece6dc' },
                    ]}>
                    <Text
                      style={[
                        styles.culminationBadgeText,
                        p.fechaCulminacion.isReal ? { color: '#4c9b7a' } : { color: '#8d918f' },
                      ]}>
                      {p.fechaCulminacion.isReal ? 'Real' : 'Est.'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleOpenDetails(p)}
                  style={({ pressed }) => [
                    styles.quickButton,
                    pressed && { backgroundColor: '#ece6dc' },
                  ]}>
                  <Text style={styles.quickButtonText}>Ficha rápida</Text>
                  <ChevronRightIcon size={12} color="#4e5558" />
                </Pressable>
              </View>
            </View>
          );
        })}

        {processedProjects.length === 0 && (
          <View style={styles.emptyContainer}>
            <AlertCircleIcon size={28} color="#d8d0c4" />
            <Text style={styles.emptyText}>No hay proyectos registrados en el workspace</Text>
          </View>
        )}
      </View>

      {/* Modal Ficha Rápida */}
      {isDetailsOpen && selectedProject ? (
        <Modal
          visible={isDetailsOpen}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setIsDetailsOpen(false);
            setSelectedProject(null);
          }}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleBox}>
                  <BuildingIcon size={18} color="#b9561d" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedProject.fullName || selectedProject.shortName || selectedProject.code || 'Proyecto'}
                    </Text>
                    {selectedProject.code ? (
                      <Text style={styles.modalSubtitle} numberOfLines={1}>
                        {selectedProject.code} · {statusLabel(selectedProject.status)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    setIsDetailsOpen(false);
                    setSelectedProject(null);
                  }}
                  style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}>
                  <XIcon size={18} color="#4e5558" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Indicadores principales */}
                <View style={styles.modalTopMetrics}>
                  <View style={styles.modalTopMetricCard}>
                    <Text style={styles.modalTopMetricLabel}>FP (Presupuesto)</Text>
                    <Text style={styles.modalTopMetricValue}>
                      {formatCurrency(selectedProject.planPresupuesto)}
                    </Text>
                  </View>

                  <View style={styles.modalTopMetricCard}>
                    <Text style={styles.modalTopMetricLabel}>Avance Físico</Text>
                    <Text style={styles.modalTopMetricValue}>
                      {selectedProject.realAvance}{' '}
                      <Text style={{ fontSize: 11, color: '#4e5558', fontFamily: FontFamilies.body }}>
                        (plan: {selectedProject.planificadoAvance})
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Desglose completo */}
                <View style={styles.modalDetailsGrid}>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Avance Planificado</Text>
                    <Text style={styles.modalDetailValue}>{selectedProject.planificadoAvance}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Avance Real</Text>
                    <Text style={[styles.modalDetailValue, { color: '#4c9b7a' }]}>
                      {selectedProject.realAvance}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Costo Real Gastado</Text>
                    <Text style={[styles.modalDetailValue, { color: '#5e8fc2' }]}>
                      {formatCurrency(selectedProject.costoReal)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Facturado / Valuado</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatCurrency(selectedProject.facturadoValuado)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Monto Pagado / Cobrado</Text>
                    <Text style={[styles.modalDetailValue, { color: '#4c9b7a' }]}>
                      {formatCurrency(selectedProject.montoCobrado)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Cuentas por Pagar</Text>
                    <Text
                      style={[
                        styles.modalDetailValue,
                        { color: (selectedProject.cuentasPorPagar ?? 0) > 0 ? '#c85454' : '#111416' },
                      ]}>
                      {formatCurrency(selectedProject.cuentasPorPagar)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Fecha de Culminación</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedProject.fechaCulminacion?.label ?? 'Sin fecha'}{' '}
                      <Text style={{ fontSize: 9, color: '#8d918f' }}>
                        ({selectedProject.fechaCulminacion?.isReal ? 'Real' : 'Est.'})
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Estado Operativo</Text>
                    <Text style={[styles.modalDetailValue, { color: statusColor(selectedProject.status) }]}>
                      {statusLabel(selectedProject.status)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => {
                    setIsDetailsOpen(false);
                    setSelectedProject(null);
                  }}
                  style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.modalBtnCancelText}>Cerrar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const targetId = selectedProject.id;
                    setIsDetailsOpen(false);
                    setSelectedProject(null);
                    router.push(`/pm/detalle/${targetId}`);
                  }}
                  style={({ pressed }) => [styles.modalBtnAction, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.modalBtnActionText}>Ir a la ficha</Text>
                  <ExternalLinkIcon size={13} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#1c0f08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d8d0c4',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#b9561d',
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 15,
    letterSpacing: -0.3,
    color: '#111416',
  },
  countBadge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#f5f0e8',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#4e5558',
  },
  cardBody: {
    padding: 14,
    gap: 12,
  },
  cardBodyTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  projectCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 13,
    shadowColor: '#1c0f08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  projectCardTablet: {
    width: '49%',
    flexGrow: 1,
  },

  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  projectHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  projectNamePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  projectName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13.5,
    color: '#111416',
    textDecorationLine: 'underline',
    textDecorationColor: '#d8d0c4',
    flexShrink: 1,
  },
  projectCode: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#b9561d',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    width: '48.5%',
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(216, 208, 196, 0.7)',
    backgroundColor: '#fffdf9',
    padding: 8,
  },
  metricLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8d918f',
    marginBottom: 4,
  },
  metricValues: {
    gap: 2,
  },
  metricValuePrimary: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11.5,
    color: '#111416',
  },
  metricPrefix: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#4e5558',
    textTransform: 'uppercase',
  },
  metricSubText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9.5,
    marginTop: 1,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(216, 208, 196, 0.5)',
    paddingTop: 10,
    marginTop: 11,
    gap: 8,
  },
  culminationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  culminationLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#4e5558',
  },
  culminationValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#111416',
  },
  culminationBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  culminationBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  quickButtonText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#111416',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#4e5558',
  },
  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 22, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#fffdf9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    gap: 12,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 15,
    color: '#111416',
  },
  modalSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#4e5558',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalTopMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modalTopMetricCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(216, 208, 196, 0.8)',
    backgroundColor: '#f5f0e8',
    padding: 10,
  },
  modalTopMetricLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#4e5558',
    marginBottom: 4,
  },
  modalTopMetricValue: {
    fontFamily: FontFamilies.display,
    fontSize: 19,
    color: '#111416',
  },
  modalDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalDetailItem: {
    width: '48.5%',
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(216, 208, 196, 0.6)',
    backgroundColor: '#fffdf9',
    padding: 9,
  },
  modalDetailLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#8d918f',
    marginBottom: 3,
  },
  modalDetailValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#111416',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#d8d0c4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  modalBtnCancel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalBtnCancelText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#4e5558',
  },
  modalBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#d9772f',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalBtnActionText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#ffffff',
  },
});
