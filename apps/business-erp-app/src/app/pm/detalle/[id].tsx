import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { projectService } from '@/features/pm/api/projects';
import { financialService } from '@/features/pm/api/financial';
import { costService } from '@/features/pm/api/cost';
import { physicalProgressService } from '@/features/pm/api/physical-progress';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { MetricStrip, type MetricItem } from '@/features/pm/components/metric-strip';
import { ProjectProgressChart } from '@/features/pm/components/project-progress-chart';
import { ProjectReportModal } from '@/features/pm/components/project-report-modal';
import { FinancialReportModal } from '@/features/pm/components/financial-report-modal';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { usePermission } from '@/features/pm/hooks/usePermission';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCurrency, formatDate, statusColor, statusLabel } from '@/features/pm/utils/format';
import {
  ArrowUpRightIcon,
  BuildingIcon,
  FolderOpenIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PrinterIcon,
} from '@/features/pm/components/icons';
import type { CostPlanning, FinancialValuation, PhysicalProgress, Project } from '@/features/pm/types';

/* ─── Pantalla de detalle ────────────────────────────────────────────── */

export default function PmDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { isTablet } = useBreakpoint();
  const {
    canCreate,
    isDireccion,
    canViewPayables,
    isFinancialAdmin,
    canViewGallery,
    canPrintReport,
    canPrintFinancialReport,
  } = usePermission();

  const [project, setProject] = useState<Project | null>(null);
  const [valuations, setValuations] = useState<FinancialValuation[]>([]);
  const [costs, setCosts] = useState<CostPlanning[]>([]);
  const [progressList, setProgressList] = useState<PhysicalProgress[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFinancialReportModalOpen, setIsFinancialReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      // No pedir datos hasta que la sesión esté restaurada (evita requests sin token).
      if (status !== 'authenticated') return;
      Promise.all([
        projectService.getById(id),
        financialService.getByProjectId(id).catch(() => [] as FinancialValuation[]),
        costService.getByProjectId(id).catch(() => [] as CostPlanning[]),
        physicalProgressService.getByProject(id).catch(() => ({ progress: [] })),
      ])
        .then(([proj, val, cos, progData]) => {
          const resolvedProgress =
            (progData?.progress && progData.progress.length > 0 ? progData.progress : null) ||
            ((proj as any)?.allProgress && (proj as any).allProgress.length > 0 ? (proj as any).allProgress : null) ||
            ((proj as any)?.pm_physical_progress && (proj as any).pm_physical_progress.length > 0 ? (proj as any).pm_physical_progress : null) ||
            ((proj as any)?.progress && (proj as any).progress.length > 0 ? (proj as any).progress : null) ||
            [];

          const latestFromList = resolvedProgress.length > 0 ? resolvedProgress[0] : null;
          const mergedLastProgress = proj?.lastProgress || latestFromList || null;

          const enrichedProject: Project = {
            ...proj,
            lastProgress: mergedLastProgress,
            actualPhysicalProgress:
              proj?.actualPhysicalProgress ||
              mergedLastProgress?.actualProgress ||
              null,
            plannedPhysicalProgress:
              proj?.plannedPhysicalProgress ||
              mergedLastProgress?.plannedProgress ||
              null,
          };

          setProject(enrichedProject);
          setValuations(val);
          setCosts(cos);
          setProgressList(resolvedProgress);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
        .finally(() => setLoading(false));
    }, [id, status])
  );

  // Totales por estado de valuación (para la métrica de monto ofertado).
  const totals = useMemo(() => {
    const sum = (s: FinancialValuation['status']) =>
      valuations.filter((v) => v.status === s).reduce((acc, v) => acc + Number(v.amountUsd), 0);
    const totalValuado = valuations.reduce((acc, v) => acc + Number(v.amountUsd), 0);
    const saldoPorValuar = Math.max(0, Number(project?.offeredAmount || 0) - totalValuado);
    return {
      porValuar: sum('POR_VALUAR'),
      porFacturar: sum('POR_FACTURAR'),
      facturado: sum('FACTURADO'),
      totalValuado,
      saldoPorValuar,
    };
  }, [valuations, project?.offeredAmount]);

  const totalCostos = useMemo(() => costs.reduce((acc, c) => acc + Number(c.amountUsd), 0), [costs]);
  const estimatedCost = Number(project?.estimatedCost ?? 0);
  const costDeviation = totalCostos - estimatedCost;

  const rawMgrName = (project?.manager as any)?.managerName || (project?.manager as any)?.firstName;
  const plannerName = useMemo(() => {
    const mgrName = (rawMgrName && String(rawMgrName).trim()) || '';
    if (mgrName && !/^(null|undefined)\s*(null|undefined)?$/i.test(mgrName)) {
      const full = [project?.manager?.firstName, project?.manager?.lastName].filter(Boolean).join(' ').trim();
      return full || mgrName;
    }
    if ((project as any)?.pm_users) {
      const pmName = `${(project as any).pm_users.firstName || ''} ${(project as any).pm_users.lastName || ''}`.trim();
      if (pmName) return pmName;
    }
    if (project?.manager?.managerEmail || project?.manager?.email) {
      return project.manager.managerEmail || project.manager.email;
    }
    return 'No asignado';
  }, [project, rawMgrName]);

  const plannerPhone = useMemo(() => {
    if (plannerName === 'No asignado') return '';
    return (
      project?.manager?.phone ||
      project?.manager?.managerPhone ||
      (project as any)?.pm_users?.phone ||
      (project as any)?.plannerPhone ||
      (project as any)?.managerPhone ||
      ''
    );
  }, [project, plannerName]);

  const plannerPhoneDisplay = useMemo(() => {
    if (plannerName === 'No asignado') {
      return 'Sin asignar';
    }
    if (plannerPhone) {
      return `Tel: ${plannerPhone}`;
    }
    return (
      project?.manager?.managerEmail ||
      project?.manager?.email ||
      (project as any)?.pm_users?.email ||
      'Sin teléfono'
    );
  }, [plannerName, plannerPhone, project]);

  const actualPhysicalProgress = useMemo(() => {
    const actual =
      project?.lastProgress?.actualProgress ||
      project?.actualPhysicalProgress ||
      (project as any)?.actualProgress;
    if (actual === null || actual === undefined || String(actual).trim() === '') {
      return '0%';
    }
    const str = String(actual).trim();
    return str.endsWith('%') ? str : `${str}%`;
  }, [project]);

  const plannedPhysicalProgress = useMemo(() => {
    const planned =
      project?.lastProgress?.plannedProgress ||
      project?.plannedPhysicalProgress ||
      (project as any)?.plannedProgress;
    if (planned === null || planned === undefined || String(planned).trim() === '') {
      return 'Sin registros';
    }
    const str = String(planned).trim();
    const formatted = str.endsWith('%') ? str : `${str}%`;
    return `Programado: ${formatted}`;
  }, [project]);

  if (loading) {
    return (
      <PmAppShell title="Proyecto">
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      </PmAppShell>
    );
  }

  if (!project) {
    return (
      <PmAppShell title="Proyecto">
        <Text style={styles.empty}>No se encontró el proyecto</Text>
      </PmAppShell>
    );
  }

  const metrics: MetricItem[] = isDireccion
    ? [
        {
          title: 'Monto Ofertado',
          value: formatCurrency(project.offeredAmount || 0),
          change: 'Monto contractual convenido',
          rail: PmOpColors.orange,
        },
        {
          title: 'Monto Valuado',
          value: formatCurrency(totals.totalValuado),
          change: `Facturado: ${formatCurrency(totals.facturado)}`,
          rail: PmOpColors.blue,
        },
        {
          title: 'Avance Físico Actual',
          value: actualPhysicalProgress,
          change: plannedPhysicalProgress,
          rail: PmOpColors.green,
        },
        {
          title: 'Monto por Valuar',
          value: formatCurrency(totals.saldoPorValuar),
          change: 'Saldo contractual pendiente',
          rail: PmOpColors.pink,
        },
        {
          title: 'Fecha Fin',
          value: project.endDate ? formatDate(project.endDate) : 'N/A',
          change: `Inicio: ${project.startDate ? formatDate(project.startDate) : 'N/A'}`,
          rail: PmOpColors.lime,
        },
        {
          title: 'Planificador',
          value: plannerName,
          change: plannerPhoneDisplay,
          rail: PmOpColors.orangeDeep,
        },
      ]
    : [
        {
          title: 'Monto Ofertado',
          value: formatCurrency(project.offeredAmount),
          change: `P/Valuar ${formatCurrency(totals.porValuar)} · P/Facturar ${formatCurrency(totals.porFacturar)} · Facturado ${formatCurrency(totals.facturado)}`,
          rail: PmOpColors.orange,
        },
        ...(!isDireccion
          ? [
              {
                title: 'Formulación Presupuestaria',
                value: formatCurrency(estimatedCost),
                change: 'Presupuesto formulado',
                rail: costDeviation > 0 ? PmOpColors.red : PmOpColors.inkSoft,
              },
            ]
          : []),
        ...(canViewPayables
          ? [
              {
                title: 'Costo Real Acumulado',
                value: formatCurrency(project.actualCost ?? 0),
                change: 'Costo incurrido y gastos directos',
                rail: PmOpColors.orangeDeep,
              },
              {
                title: 'Cuentas por Pagar',
                value: formatCurrency(project.cuentasPorPagar ?? 0),
                change: (project.cuentasPorPagar ?? 0) > 0 ? 'Obligaciones pendientes' : 'Al día',
                rail: (project.cuentasPorPagar ?? 0) > 0 ? PmOpColors.red : PmOpColors.green,
              },
            ]
          : []),
        ...(!isFinancialAdmin
          ? [
              {
                title: 'Avance Físico Actual',
                value: actualPhysicalProgress,
                change: plannedPhysicalProgress,
                rail: PmOpColors.green,
              },
            ]
          : []),
        {
          title: 'Planificador',
          value: plannerName,
          change: plannerPhoneDisplay,
          rail: PmOpColors.pink,
        },
        {
          title: 'Fecha Estimada Fin',
          value: project.endDate ? formatDate(project.endDate) : 'N/A',
          change: `Inicio: ${project.startDate ? formatDate(project.startDate) : 'N/A'}`,
          rail: PmOpColors.blue,
        },
      ];

  const quickActions: { label: string; onPress: () => void }[] = [
    ...(!isFinancialAdmin
      ? [{ label: 'Ver financiero', onPress: () => router.push(`/pm/detalle/${id}/financiero`) }]
      : []),
    ...(!isDireccion && !isFinancialAdmin
      ? [{ label: 'Ver costos', onPress: () => router.push(`/pm/detalle/${id}/costos`) }]
      : []),
    ...(canViewPayables
      ? [
          { label: 'Cuentas por Pagar', onPress: () => router.push(`/pm/detalle/${id}/cuentas-por-pagar`) },
          { label: 'Costo Real', onPress: () => router.push(`/pm/detalle/${id}/costo-real`) },
          { label: 'Cobros', onPress: () => router.push(`/pm/detalle/${id}/cobros`) },
        ]
      : []),
    ...(!isFinancialAdmin
      ? [{ label: 'Ver avances', onPress: () => router.push(`/pm/detalle/${id}/avances`) }]
      : []),
    ...(canCreate && !isFinancialAdmin
      ? [
          { label: 'Editar proyecto', onPress: () => router.push(`/pm/editar-proyecto/${id}`) },
        ]
      : []),
    { label: 'Volver', onPress: () => router.back() },
  ];

  const progressValue = Number.parseInt((project.lastProgress?.actualProgress ?? '0').replace('%', ''), 10) || 0;

  return (
    <PmAppShell title="Proyecto" hideTitle>
      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{project.code}</Text>
          </View>
          <View style={styles.headerActionsRight}>
            {canPrintReport ? (
              <Pressable
                onPress={() => setIsReportModalOpen(true)}
                style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]}>
                <PrinterIcon size={13} color="#b9561d" />
                <Text style={styles.reportBtnText}>Imprimir Reporte</Text>
              </Pressable>
            ) : canPrintFinancialReport ? (
              <Pressable
                onPress={() => setIsFinancialReportModalOpen(true)}
                style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]}>
                <PrinterIcon size={13} color="#b9561d" />
                <Text style={styles.reportBtnText}>Imprimir Reporte</Text>
              </Pressable>
            ) : null}
            <View style={[styles.statusBadge, { backgroundColor: statusColor(project.status) }]}>
              <Text style={styles.statusText}>{statusLabel(project.status)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.name}>{project.fullName}</Text>

        {/* Bloque empresa / ubicación / contacto */}
        <View style={[styles.infoCard, isTablet && styles.infoCardTablet]}>
          <View style={[styles.infoRow, isTablet && styles.infoItemTablet]}>
            <View style={[styles.infoIcon, { backgroundColor: `${PmOpColors.orange}1a` }]}>
              <BuildingIcon size={18} color={PmOpColors.orange} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Empresa</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {project.company?.legalName || project.company?.name || 'Sin empresa'}
              </Text>
              {project.company ? (
                <Pressable onPress={() => router.push(`/pm/empresa/${project.company!.id}`)} hitSlop={6}>
                  <Text style={styles.infoLink}>Ver perfil ↗</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={isTablet ? styles.infoDividerTablet : styles.infoDivider} />

          <View style={[styles.infoRow, isTablet && styles.infoItemTablet]}>
            <View style={[styles.infoIcon, { backgroundColor: `${PmOpColors.blue}1a` }]}>
              <MapPinIcon size={18} color={PmOpColors.blue} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {project.company?.address || 'No especificada'}
              </Text>
            </View>
          </View>

          <View style={isTablet ? styles.infoDividerTablet : styles.infoDivider} />

          <View style={[styles.infoRow, isTablet && styles.infoItemTablet]}>
            <View style={[styles.infoIcon, { backgroundColor: `${PmOpColors.green}1a` }]}>
              <PhoneIcon size={18} color={PmOpColors.green} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Contacto</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {project.company?.phone || 'Sin teléfono'}
                {project.company?.email ? ` (${project.company.email})` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Tira de métricas ─────────────────────────────────────── */}
      <MetricStrip metrics={metrics} />

      {/* ── Accesos rápidos ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Accesos rápidos</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((action, i) => (
            <Pressable
              key={`${action.label}-${i}`}
              onPress={action.onPress}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <ArrowUpRightIcon size={13} color={PmOpColors.orangeDeep} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Gráfico: evolución de avance físico ────────────────────── */}
      <ProjectProgressChart
        projectId={id}
        progress={progressList}
        lastProgress={project.lastProgress}
        plannedProgress={
          project.lastProgress?.plannedProgress ??
          project.plannedPhysicalProgress
        }
        actualProgress={
          project.lastProgress?.actualProgress ??
          project.actualPhysicalProgress
        }
        projectStartDate={project.startDate}
        projectEndDate={project.endDate}
      />

      {/* ── Descripción y Planificador ──────────────────────────── */}
      {project.description || project.manager ? (
        <View style={isTablet ? styles.sideBySideRow : undefined}>
          {project.description ? (
            <View style={[styles.card, isTablet && styles.sideBySideCard]}>
              <Text style={styles.cardTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>{project.description}</Text>
            </View>
          ) : null}

          {project.manager ? (
            <View style={[styles.card, isTablet && styles.sideBySideCard]}>
              <Text style={styles.cardTitle}>Planificador</Text>
              <View style={styles.infoRow}>
                <MailIcon size={14} color={PmOpColors.inkSoft} />
                <Text style={styles.metaText}>{project.manager.email || managerName}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Card de galería ──────────────────────────────────────── */}
      {canViewGallery ? (
        <View style={[styles.card, styles.galleryCard]}>
          <View style={styles.galleryIconWrap}>
            <FolderOpenIcon size={22} color={PmOpColors.blue} />
          </View>
          <View style={styles.galleryBody}>
            <Text style={styles.galleryTitle}>Documentos y Archivos</Text>
            <Text style={styles.galleryCopy}>
              Gestioná planos, contratos, fotos y demás archivos del proyecto en su galería dedicada.
            </Text>
            <Pressable
              onPress={() => router.push(`/pm/detalle/${id}/galeria`)}
              style={({ pressed }) => [styles.galleryBtn, pressed && styles.pressed]}>
              <Text style={styles.galleryBtnText}>Abrir Galería Completa</Text>
              <ArrowUpRightIcon size={13} color={PmOpColors.blue} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* ── Nota inferior: barra de ejecución ────────────────────── */}
      <View style={styles.execution}>
        <Text style={styles.executionNote}>Business ERP · Datos actualizados automáticamente</Text>
        <View style={styles.executionBarRow}>
          <Text style={styles.executionLabel}>Ejecución del proyecto</Text>
          <View style={styles.executionTrack}>
            <View
              style={[styles.executionFill, { width: `${Math.min(100, Math.max(0, progressValue))}%` }]}
            />
          </View>
          <Text style={styles.executionValue}>{project.lastProgress?.actualProgress ?? '0%'}</Text>
        </View>
      </View>

      {/* ── Modal de Reporte Oficial de Avance Físico ── */}
      <ProjectReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        project={project}
        progressList={progressList}
      />

      {/* ── Modal de Reporte Oficial Financiero (Pagos y Deudas) ── */}
      <FinancialReportModal
        isOpen={isFinancialReportModalOpen}
        onClose={() => setIsFinancialReportModalOpen(false)}
        project={project}
      />
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
    marginTop: 30,
  },
  /* ── Cabecera ── */
  header: {
    gap: 12,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  reportBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#b9561d',
  },
  codeBadge: {
    borderWidth: 1,
    borderColor: '#edb6a5',
    backgroundColor: '#fff0eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#a84730',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PmOpColors.white,
  },
  name: {
    fontFamily: FontFamilies.display,
    fontSize: 38,
    lineHeight: 38,
    letterSpacing: 0.2,
    color: PmOpColors.ink,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    paddingVertical: 4,
    overflow: 'hidden',
  },
  infoCardTablet: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  infoItemTablet: {
    flex: 1,
    paddingVertical: 4,
  },
  infoDividerTablet: {
    width: 1,
    height: 'auto',
    backgroundColor: PmOpColors.divider,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoDivider: {
    height: 1,
    backgroundColor: PmOpColors.divider,
    marginHorizontal: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  infoValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
    marginTop: 1,
  },
  infoLink: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.orangeDeep,
    marginTop: 2,
  },
  /* ── Secciones ── */
  section: {
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  actionLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  pressed: {
    opacity: 0.7,
  },
  sideBySideRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 0,
  },
  sideBySideCard: {
    flex: 1,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmOpColors.ink,
  },
  cardSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    lineHeight: 16,
    color: PmOpColors.inkSoft,
    marginTop: 2,
    marginBottom: 14,
  },
  /* ── Gráfico Financiero ── */
  chartEmpty: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
    paddingVertical: 30,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  financialLegend: {
    gap: 7,
  },
  finLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /* ── Descripción ── */
  descriptionText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
    color: PmOpColors.inkSoft,
    marginTop: 8,
  },
  /* ── Galería ── */
  galleryCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    overflow: 'hidden',
    gap: 14,
  },
  galleryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${PmOpColors.blue}1a`,
    alignSelf: 'flex-start',
  },
  galleryBody: {
    flex: 1,
    gap: 6,
  },
  galleryTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmOpColors.ink,
  },
  galleryCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    lineHeight: 16,
    color: PmOpColors.inkSoft,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: `${PmOpColors.blue}1a`,
    paddingVertical: 11,
    marginTop: 6,
  },
  galleryBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: PmOpColors.blue,
  },
  /* ── Planificador ── */
  metaText: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  /* ── Nota de ejecución ── */
  execution: {
    marginBottom: 16,
    gap: 8,
  },
  executionNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  executionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  executionLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  executionTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: PmOpColors.rule,
  },
  executionFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: PmOpColors.ink,
  },
  executionValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.ink,
  },
});
