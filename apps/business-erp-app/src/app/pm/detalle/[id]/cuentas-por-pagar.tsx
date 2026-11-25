import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { payablesService } from '@/features/pm/api/payables';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { usePermission } from '@/features/pm/hooks/usePermission';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { MetricStrip, type MetricItem } from '@/features/pm/components/metric-strip';
import { DateInput } from '@/features/pm/components/date-input';
import { FinancialReportModal } from '@/features/pm/components/financial-report-modal';
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  PlusIcon,
  PrinterIcon,
  RotateCcwIcon,
  Trash2Icon,
  XIcon,
} from '@/features/pm/components/icons';
import { formatCurrency, formatDate, statusColor, statusLabel } from '@/features/pm/utils/format';
import type {
  Obligation,
  ObligationPayment,
  PayablesSnapshot,
  Project,
  ProjectCollection,
  ProjectExpense,
} from '@/features/pm/types';

export default function PmCuentasPorPagarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { canManagePayables, canPrintFinancialReport } = usePermission();

  const [project, setProject] = useState<Project | null>(null);
  const [data, setData] = useState<PayablesSnapshot | null>(null);
  const [isFinancialReportOpen, setIsFinancialReportOpen] = useState(false);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [collections, setCollections] = useState<ProjectCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modales
  const [partialModal, setPartialModal] = useState<Obligation | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialNote, setPartialNote] = useState('');
  const [partialError, setPartialError] = useState<string | null>(null);

  const [recognizeModal, setRecognizeModal] = useState<Obligation | null>(null);
  const [recognizeDate, setRecognizeDate] = useState(new Date().toISOString().split('T')[0]);
  const [recognizeDoc, setRecognizeDoc] = useState('');
  const [recognizeNote, setRecognizeNote] = useState('');
  const [recognizeError, setRecognizeError] = useState<string | null>(null);

  const [historyModal, setHistoryModal] = useState<Obligation | null>(null);

  const refreshAll = useCallback(async () => {
    if (!id || status !== 'authenticated') return;
    try {
      const [snap, exp, col, proj] = await Promise.all([
        payablesService.getByProject(id),
        projectService.getExpenses(id).catch(() => []),
        projectService.getCollections(id).catch(() => []),
        projectService.getById(id).catch(() => null),
      ]);
      setData(snap);
      setExpenses(exp);
      setCollections(col);
      if (proj) setProject(proj);
    } catch (err) {
      console.error('Error refreshing payables data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, status]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    refreshAll();
  };

  const runMutation = async (key: string, fn: () => Promise<any>) => {
    try {
      setBusyId(key);
      await fn();
      await refreshAll();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Error al procesar la operación');
    } finally {
      setBusyId(null);
    }
  };

  // Toggle checklist de pago completo
  const handleTogglePaid = (o: Obligation) => {
    if (!canManagePayables || busyId === o.id) return;
    const isPaid = o.status === 'PAGADO';
    if (isPaid && o.payments && o.payments.length > 1) {
      Alert.alert(
        'Múltiples pagos registrados',
        'Esta obligación tiene múltiples abonos. Desmarcarla eliminará el último pago registrado. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desmarcar',
            style: 'destructive',
            onPress: () => runMutation(o.id, () => payablesService.setPaid(o.id, false)),
          },
        ]
      );
      return;
    }
    runMutation(o.id, () => payablesService.setPaid(o.id, !isPaid));
  };

  // Guardar abono parcial
  const handleSavePartial = async () => {
    if (!partialModal) return;
    const amt = Number(partialAmount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      setPartialError('El monto debe ser mayor a 0');
      return;
    }
    if (amt > partialModal.pendingUsd) {
      setPartialError(`El pago no puede superar el saldo pendiente (${formatCurrency(partialModal.pendingUsd)})`);
      return;
    }
    setPartialError(null);
    await runMutation(partialModal.id, () =>
      payablesService.pay(partialModal.id, amt, partialNote.trim() || undefined)
    );
    setPartialModal(null);
  };

  // Reconocer costo incurrido
  const handleSaveRecognize = async () => {
    if (!recognizeModal) return;
    setRecognizeError(null);
    await runMutation(recognizeModal.id, () =>
      payablesService.recognize(recognizeModal.id, {
        isIncurred: true,
        incurredAt: recognizeDate,
        supportDocument: recognizeDoc.trim() || undefined,
        note: recognizeNote.trim() || undefined,
      })
    );
    setRecognizeModal(null);
  };

  // Revertir pago específico
  const handleRevertPayment = (obligationId: string, payment: ObligationPayment) => {
    if (!canManagePayables) return;
    Alert.alert(
      'Revertir Abono',
      `¿Deseas revertir y anular el abono de ${formatCurrency(payment.amountUsd)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revertir',
          style: 'destructive',
          onPress: async () => {
            await runMutation(obligationId, () => payablesService.revertPayment(payment.id));
            setHistoryModal(null);
          },
        },
      ]
    );
  };

  // Eliminar obligación
  const handleDeleteObligation = (o: Obligation) => {
    if (!canManagePayables) return;
    Alert.alert(
      'Eliminar Obligación',
      `¿Estás seguro de que deseas eliminar la obligación "${o.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => runMutation(o.id, () => payablesService.remove(o.id)),
        },
      ]
    );
  };

  // Cálculos de métricas
  const s = data?.summary;
  const directExpensesTotal = expenses
    .filter((x) => !x.obligationPaymentId)
    .reduce((sum, x) => sum + Number(x.amountUsd || 0), 0);
  const totalCollections = collections.reduce((sum, x) => sum + Number(x.amountUsd || 0), 0);
  const actualCost = s?.actualCost ?? ((s?.totalIncurred ?? s?.totalDebt ?? 0) + directExpensesTotal);

  const metrics: MetricItem[] = [
    {
      title: 'Costo Real Acumulado',
      value: formatCurrency(actualCost),
      change: `${formatCurrency(s?.totalIncurred ?? 0)} dev. + ${formatCurrency(directExpensesTotal)} dir.`,
      rail: PmOpColors.orangeDeep,
    },
    {
      title: 'Total Cobrado (Neto)',
      value: formatCurrency(totalCollections),
      change: `${collections.length} cobros netos`,
      rail: PmOpColors.green,
    },
    {
      title: 'Deuda Comprometida',
      value: formatCurrency(s?.totalDebt ?? 0),
      change: `${s?.totalCount ?? 0} obligaciones`,
      rail: PmOpColors.ink,
    },
    {
      title: 'Total Por Pagar',
      value: formatCurrency(s?.totalPending ?? 0),
      change: `${s?.openCount ?? 0} pendientes`,
      rail: PmOpColors.red,
    },
  ];

  return (
    <PmAppShell title="Cuentas por Pagar" hideTitle>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PmOpColors.orange}
            colors={[PmOpColors.orange]}
          />
        }>
        {/* Header con botón Volver */}
        <View style={styles.topHeader}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <ChevronLeftIcon size={16} color={PmOpColors.inkSoft} />
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>

          <View style={styles.headerRightActions}>
            {canPrintFinancialReport ? (
              <Pressable
                style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]}
                onPress={() => setIsFinancialReportOpen(true)}>
                <PrinterIcon size={14} color={PmOpColors.ink} />
                <Text style={styles.reportBtnText}>Imprimir Reporte</Text>
              </Pressable>
            ) : null}

            {canManagePayables ? (
              <Pressable
                style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
                onPress={() => router.push(`/pm/detalle/${id}/crear-obligacion`)}>
                <PlusIcon size={14} color={PmOpColors.white} />
                <Text style={styles.newBtnText}>Nueva obligación</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Tarjeta de Contexto del Proyecto */}
        {project ? (
          <View style={styles.projectContextCard}>
            <View style={styles.projectContextRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{project.code}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(project.status) }]}>
                <Text style={styles.statusText}>{statusLabel(project.status)}</Text>
              </View>
            </View>
            <Text style={styles.projectContextName} numberOfLines={2}>
              {project.fullName}
            </Text>
            <Text style={styles.projectContextCompany} numberOfLines={1}>
              {project.company?.legalName || project.company?.name || 'Sin empresa'}
            </Text>
          </View>
        ) : null}

        {/* Navegación rápida entre submódulos financieros */}
        <View style={styles.quickNavRow}>
          <View style={[styles.quickNavTab, styles.quickNavTabActive]}>
            <Text style={[styles.quickNavText, styles.quickNavTextActive]}>Cuentas por Pagar</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.quickNavTab, pressed && styles.pressed]}
            onPress={() => router.replace(`/pm/detalle/${id}/costo-real`)}>
            <Text style={styles.quickNavText}>Costo Real</Text>
            <ArrowUpRightIcon size={12} color={PmOpColors.orangeDeep} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickNavTab, pressed && styles.pressed]}
            onPress={() => router.replace(`/pm/detalle/${id}/cobros`)}>
            <Text style={styles.quickNavText}>Cobros</Text>
            <ArrowUpRightIcon size={12} color={PmOpColors.orangeDeep} />
          </Pressable>
        </View>

        {/* Métricas del Proyecto */}
        <MetricStrip metrics={metrics} />

        {/* Sección de Obligaciones */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Cuentas por Pagar (Obligaciones)</Text>
            <Text style={styles.sectionSubtitle}>
              Checklist de obligaciones. Toca el check para saldar.
            </Text>
          </View>
          <View style={styles.pendingSummaryBadge}>
            <Text style={styles.pendingSummaryLabel}>Por pagar:</Text>
            <Text style={styles.pendingSummaryValue}>{formatCurrency(s?.totalPending ?? 0)}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={PmOpColors.orange} />
            <Text style={styles.loadingText}>Cargando obligaciones...</Text>
          </View>
        ) : !data || data.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay obligaciones registradas para este proyecto.</Text>
          </View>
        ) : (
          <View style={styles.obligationsList}>
            {data.items.map((o) => {
              const isPaid = o.status === 'PAGADO';
              const isParcial = o.status === 'PARCIAL';
              const isPending = o.status === 'PENDIENTE';

              return (
                <View key={o.id} style={[styles.obligationCard, isPaid && styles.obligationCardPaid]}>
                  {/* Top Row: Checkbox + Descripción + Badge de estado */}
                  <View style={styles.oblTopRow}>
                    <Pressable
                      style={[styles.checkbox, isPaid && styles.checkboxChecked]}
                      disabled={!canManagePayables || busyId === o.id}
                      onPress={() => handleTogglePaid(o)}>
                      {busyId === o.id ? (
                        <ActivityIndicator size="small" color={PmOpColors.white} />
                      ) : isPaid ? (
                        <CheckIcon size={12} color={PmOpColors.white} />
                      ) : null}
                    </Pressable>

                    <View style={styles.oblDescWrap}>
                      <View style={styles.oblMetaTags}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{o.category}</Text>
                        </View>
                        {o.isIncurred === false ? (
                          <View style={styles.futureBadge}>
                            <Text style={styles.futureBadgeText}>Compromiso Futuro</Text>
                          </View>
                        ) : (
                          <View style={styles.incurredBadge}>
                            <Text style={styles.incurredBadgeText}>Costo Incurrido</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.oblDescription, isPaid && styles.oblTextDone]}>
                        {o.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusChip,
                        isPaid ? styles.chipPaid : isParcial ? styles.chipPartial : styles.chipPending,
                      ]}>
                      <Text
                        style={[
                          styles.statusChipText,
                          isPaid ? styles.chipTextPaid : isParcial ? styles.chipTextPartial : styles.chipTextPending,
                        ]}>
                        {o.status}
                      </Text>
                    </View>
                  </View>

                  {/* Info Proveedor y Factura */}
                  <View style={styles.oblInfoRow}>
                    {o.supplier ? (
                      <Text style={styles.oblInfoText}>
                        <Text style={styles.oblInfoBold}>Prov: </Text>
                        {o.supplier}
                      </Text>
                    ) : null}
                    {o.invoiceNumber ? (
                      <Text style={styles.oblInfoText}>
                        <Text style={styles.oblInfoBold}>Fact: </Text>
                        {o.invoiceNumber}
                      </Text>
                    ) : null}
                    {o.dueDate ? (
                      <Text style={styles.oblInfoText}>
                        <Text style={styles.oblInfoBold}>Vence: </Text>
                        {formatDate(o.dueDate)}
                      </Text>
                    ) : null}
                  </View>

                  {/* Financial Amounts Grid */}
                  <View style={styles.oblAmountsGrid}>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountColLabel}>Total</Text>
                      <Text style={styles.amountColValue}>{formatCurrency(o.amountUsd)}</Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountColLabel}>Pagado</Text>
                      <Text style={[styles.amountColValue, styles.paidColor]}>
                        {formatCurrency(o.paidUsd)}
                      </Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountColLabel}>Por Pagar</Text>
                      <Text
                        style={[
                          styles.amountColValue,
                          o.pendingUsd > 0 ? styles.pendingColor : styles.paidColor,
                        ]}>
                        {formatCurrency(o.pendingUsd)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.oblActionsRow}>
                    {canManagePayables && o.pendingUsd > 0 ? (
                      <Pressable
                        style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
                        onPress={() => {
                          setPartialModal(o);
                          setPartialAmount(String(o.pendingUsd));
                          setPartialNote('');
                          setPartialError(null);
                        }}>
                        <Text style={styles.btnSecondaryText}>Abonar</Text>
                      </Pressable>
                    ) : null}

                    {canManagePayables && o.isIncurred === false ? (
                      <Pressable
                        style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
                        onPress={() => {
                          setRecognizeModal(o);
                          setRecognizeDate(new Date().toISOString().split('T')[0]);
                          setRecognizeDoc(o.supportDocument || '');
                          setRecognizeNote('');
                          setRecognizeError(null);
                        }}>
                        <Text style={styles.btnSecondaryText}>Reconocer Costo</Text>
                      </Pressable>
                    ) : null}

                    {o.payments && o.payments.length > 0 ? (
                      <Pressable
                        style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
                        onPress={() => setHistoryModal(o)}>
                        <RotateCcwIcon size={12} color={PmOpColors.inkSoft} />
                        <Text style={styles.btnGhostText}>
                          Historial ({o.payments.length})
                        </Text>
                      </Pressable>
                    ) : null}

                    {canManagePayables ? (
                      <Pressable
                        style={({ pressed }) => [styles.btnDanger, pressed && styles.pressed]}
                        onPress={() => handleDeleteObligation(o)}>
                        <Trash2Icon size={12} color={PmOpColors.red} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de Abono / Pago Parcial */}
      <Modal visible={!!partialModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Pago / Abono</Text>
              <Pressable onPress={() => setPartialModal(null)}>
                <XIcon size={18} color={PmOpColors.inkSoft} />
              </Pressable>
            </View>

            <Text style={styles.modalCopy}>{partialModal?.description}</Text>
            <Text style={styles.modalPendingNotice}>
              Saldo por pagar: {formatCurrency(partialModal?.pendingUsd ?? 0)}
            </Text>

            {partialError ? <Text style={styles.modalError}>{partialError}</Text> : null}

            <Text style={styles.inputLabel}>Monto a pagar (USD)</Text>
            <TextInput
              style={styles.modalInput}
              value={partialAmount}
              onChangeText={setPartialAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <Text style={styles.inputLabel}>Nota o referencia (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              value={partialNote}
              onChangeText={setPartialNote}
              placeholder="Ej. Transferencia Banesco N° 1234"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setPartialModal(null)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleSavePartial}>
                <Text style={styles.modalBtnSubmitText}>Confirmar Pago</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Reconocer Costo Incurrido */}
      <Modal visible={!!recognizeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reconocer como Costo Incurrido</Text>
              <Pressable onPress={() => setRecognizeModal(null)}>
                <XIcon size={18} color={PmOpColors.inkSoft} />
              </Pressable>
            </View>

            <Text style={styles.modalCopy}>
              Pasa esta obligación a pasivo devengado para sumarla al Costo Real acumulado.
            </Text>

            {recognizeError ? <Text style={styles.modalError}>{recognizeError}</Text> : null}

            <DateInput
              label="Fecha de devengado"
              required
              value={recognizeDate}
              onChange={setRecognizeDate}
            />

            <Text style={styles.inputLabel}>Comprobante o factura de soporte</Text>
            <TextInput
              style={styles.modalInput}
              value={recognizeDoc}
              onChangeText={setRecognizeDoc}
              placeholder="Ej. Factura N° 84920"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <Text style={styles.inputLabel}>Observación</Text>
            <TextInput
              style={styles.modalInput}
              value={recognizeNote}
              onChangeText={setRecognizeNote}
              placeholder="Nota adicional..."
              placeholderTextColor={PmOpColors.placeholder}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setRecognizeModal(null)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleSaveRecognize}>
                <Text style={styles.modalBtnSubmitText}>Reconocer Costo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Informativo: Historial de Abonos */}
      <Modal visible={!!historyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleCol}>
                <Text style={styles.modalEyebrow}>Finanzas / Trazabilidad de Pagos</Text>
                <Text style={styles.modalTitle}>Historial de Abonos</Text>
              </View>
              <Pressable onPress={() => setHistoryModal(null)}>
                <XIcon size={18} color={PmOpColors.inkSoft} />
              </Pressable>
            </View>

            {historyModal ? (
              <ScrollView style={styles.historyScrollView}>
                {/* Tarjeta de Resumen de la Obligación */}
                <View style={styles.historySummaryCard}>
                  <View style={styles.historySummaryTop}>
                    <Text style={styles.historySummaryDesc} numberOfLines={2}>
                      {historyModal.description}
                    </Text>
                    <View
                      style={[
                        styles.historyStatusChip,
                        historyModal.status === 'PAGADO'
                          ? styles.chipPaid
                          : historyModal.status === 'PARCIAL'
                          ? styles.chipPartial
                          : styles.chipPending,
                      ]}>
                      <Text
                        style={[
                          styles.historyStatusChipText,
                          historyModal.status === 'PAGADO'
                            ? styles.chipTextPaid
                            : historyModal.status === 'PARCIAL'
                            ? styles.chipTextPartial
                            : styles.chipTextPending,
                        ]}>
                        {historyModal.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyMetaRow}>
                    <Text style={styles.historyMetaText}>
                      Categoría: <Text style={styles.historyMetaBold}>{historyModal.category}</Text>
                    </Text>
                    {historyModal.supplier ? (
                      <Text style={styles.historyMetaText}>
                        · Prov: <Text style={styles.historyMetaBold}>{historyModal.supplier}</Text>
                      </Text>
                    ) : null}
                    {historyModal.invoiceNumber ? (
                      <Text style={styles.historyMetaText}>
                        · Fact: <Text style={styles.historyMetaBold}>{historyModal.invoiceNumber}</Text>
                      </Text>
                    ) : null}
                  </View>

                  {/* Strip de valores financieros */}
                  <View style={styles.historyAmountsStrip}>
                    <View style={styles.historyAmountBox}>
                      <Text style={styles.historyAmountLabel}>Total</Text>
                      <Text style={styles.historyAmountVal}>
                        {formatCurrency(historyModal.amountUsd)}
                      </Text>
                    </View>
                    <View style={styles.historyAmountBox}>
                      <Text style={[styles.historyAmountLabel, { color: '#376850' }]}>Pagado</Text>
                      <Text style={[styles.historyAmountVal, { color: '#376850' }]}>
                        {formatCurrency(historyModal.paidUsd)}
                      </Text>
                    </View>
                    <View style={styles.historyAmountBox}>
                      <Text style={[styles.historyAmountLabel, { color: '#c85454' }]}>Por Pagar</Text>
                      <Text style={[styles.historyAmountVal, { color: '#c85454' }]}>
                        {formatCurrency(historyModal.pendingUsd)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Sección de Movimientos */}
                <View style={styles.historyListHeader}>
                  <Text style={styles.historyListTitle}>Abonos y Pagos Realizados</Text>
                  <Text style={styles.historyListCount}>
                    {historyModal.payments?.length || 0} movimientos
                  </Text>
                </View>

                {(!historyModal.payments || historyModal.payments.length === 0) ? (
                  <View style={styles.historyEmptyBox}>
                    <Text style={styles.historyEmptyText}>
                      No hay abonos registrados para esta obligación.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.historyItemsContainer}>
                    {historyModal.payments.map((p, idx) => (
                      <View key={p.id || idx} style={styles.historyPaymentRow}>
                        <View style={styles.historyPaymentLeft}>
                          <View style={styles.historyPaymentAmountRow}>
                            <Text style={styles.historyPaymentAmount}>
                              {formatCurrency(p.amountUsd)}
                            </Text>
                            <Text style={styles.historyPaymentDate}>
                              ({formatDate(p.paidAt)})
                            </Text>
                          </View>
                          {p.note && p.note.trim() ? (
                            <Text style={styles.historyPaymentNote}>
                              Nota / Ref: {p.note.trim()}
                            </Text>
                          ) : null}
                        </View>

                        {canManagePayables ? (
                          <Pressable
                            style={({ pressed }) => [styles.revertBtn, pressed && styles.pressed]}
                            onPress={() => handleRevertPayment(historyModal.id, p)}>
                            <RotateCcwIcon size={12} color={PmOpColors.red} />
                            <Text style={styles.revertBtnText}>Revertir</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : null}

            <Pressable
              style={[styles.modalBtn, styles.modalBtnCancel, { marginTop: 12 }]}
              onPress={() => setHistoryModal(null)}>
              <Text style={styles.modalBtnCancelText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de Reporte Financiero Imprimible */}
      <FinancialReportModal
        isOpen={isFinancialReportOpen}
        onClose={() => setIsFinancialReportOpen(false)}
        project={project}
        projectSnapshot={data}
      />
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  backBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#4c9b7a',
  },
  newBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.white,
  },
  projectContextCard: {
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  projectContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBadge: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: PmOpColors.white,
    textTransform: 'uppercase',
  },
  projectContextName: {
    fontFamily: FontFamilies.display,
    fontSize: 20,
    lineHeight: 22,
    color: PmOpColors.ink,
  },
  projectContextCompany: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  quickNavTabActive: {
    borderColor: '#4c9b7a',
    backgroundColor: '#edf3ec',
  },
  quickNavText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.orangeDeep,
  },
  quickNavTextActive: {
    color: '#376850',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  sectionTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 16,
    color: PmOpColors.ink,
  },
  sectionSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  pendingSummaryBadge: {
    alignItems: 'flex-end',
  },
  pendingSummaryLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  pendingSummaryValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: '#c85454',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  emptyBox: {
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
  },
  obligationsList: {
    gap: 10,
  },
  obligationCard: {
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  obligationCardPaid: {
    backgroundColor: '#faf8f5',
    borderColor: `${PmOpColors.rule}80`,
  },
  oblTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#4c9b7a',
    borderColor: '#4c9b7a',
  },
  oblDescWrap: {
    flex: 1,
    gap: 4,
  },
  oblMetaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: PmOpColors.inkSoft,
  },
  futureBadge: {
    backgroundColor: '#fdf4dc',
    borderWidth: 1,
    borderColor: '#e6d28f',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  futureBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#8a6a12',
  },
  incurredBadge: {
    backgroundColor: '#edf3ec',
    borderWidth: 1,
    borderColor: '#a7c9b4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  incurredBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#376850',
  },
  oblDescription: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  oblTextDone: {
    color: PmOpColors.inkSoft,
    textDecorationLine: 'line-through',
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipPaid: {
    backgroundColor: '#edf3ec',
    borderColor: '#a7c9b4',
  },
  chipTextPaid: {
    color: '#376850',
  },
  chipPartial: {
    backgroundColor: '#fdf4dc',
    borderColor: '#e6d28f',
  },
  chipTextPartial: {
    color: '#8a6a12',
  },
  chipPending: {
    backgroundColor: '#fff0eb',
    borderColor: '#edb6a5',
  },
  chipTextPending: {
    color: '#a84730',
  },
  statusChipText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
  },
  oblInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  oblInfoText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  oblInfoBold: {
    fontFamily: FontFamilies.bodyBold,
    color: PmOpColors.ink,
  },
  oblAmountsGrid: {
    flexDirection: 'row',
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: `${PmOpColors.rule}80`,
    borderRadius: 8,
    padding: 8,
  },
  amountCol: {
    flex: 1,
    alignItems: 'center',
  },
  amountColLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
    marginBottom: 2,
  },
  amountColValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.ink,
  },
  paidColor: {
    color: '#376850',
  },
  pendingColor: {
    color: '#a84730',
  },
  oblActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  btnSecondary: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnSecondaryText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.orangeDeep,
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnGhostText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  btnDanger: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#fff0eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: PmOpColors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    gap: 10,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 18,
    color: PmOpColors.ink,
  },
  modalCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  modalPendingNotice: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#c85454',
  },
  modalError: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#a84730',
    backgroundColor: '#fff0eb',
    padding: 8,
    borderRadius: 6,
  },
  inputLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.inkSoft,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
  },
  modalBtnCancelText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  modalBtnSubmit: {
    backgroundColor: '#4c9b7a',
  },
  modalBtnSubmitText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.white,
  },
  modalHeaderTitleCol: {
    flex: 1,
  },
  modalEyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: PmOpColors.orangeDeep,
    marginBottom: 2,
  },
  historyScrollView: {
    maxHeight: 400,
  },
  historySummaryCard: {
    backgroundColor: '#faf7f2',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  historySummaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  historySummaryDesc: {
    flex: 1,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  historyStatusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  historyStatusChipText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
  },
  historyMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyMetaText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  historyMetaBold: {
    fontFamily: FontFamilies.bodyBold,
    color: PmOpColors.ink,
  },
  historyAmountsStrip: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5ded3',
    paddingTop: 8,
  },
  historyAmountBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0d8cc',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  historyAmountLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
    marginBottom: 2,
  },
  historyAmountVal: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.ink,
  },
  historyListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyListTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: PmOpColors.inkSoft,
  },
  historyListCount: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  historyEmptyBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  historyEmptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
  },
  historyItemsContainer: {
    gap: 6,
  },
  historyPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 8,
    padding: 10,
  },
  historyPaymentLeft: {
    flex: 1,
    paddingRight: 8,
  },
  historyPaymentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyPaymentAmount: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  historyPaymentDate: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  historyPaymentNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
    marginTop: 2,
  },
  revertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff0eb',
  },
  revertBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.red,
  },
  pressed: {
    opacity: 0.7,
  },
});
