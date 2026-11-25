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
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from '@/features/pm/components/icons';
import { formatCurrency, formatDate, statusColor, statusLabel } from '@/features/pm/utils/format';
import type { PayablesSnapshot, Project, ProjectExpense } from '@/features/pm/types';

export default function PmCostoRealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { canManagePayables } = usePermission();

  const [project, setProject] = useState<Project | null>(null);
  const [payablesData, setPayablesData] = useState<PayablesSnapshot | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal para crear / editar gasto directo
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshAll = useCallback(async () => {
    if (!id || status !== 'authenticated') return;
    try {
      const [exp, snap, proj] = await Promise.all([
        projectService.getExpenses(id),
        payablesService.getByProject(id).catch(() => null),
        projectService.getById(id).catch(() => null),
      ]);
      setExpenses(exp);
      if (snap) setPayablesData(snap);
      if (proj) setProject(proj);
    } catch (err) {
      console.error('Error refreshing expenses data:', err);
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

  const openCreateModal = () => {
    setEditingExpense(null);
    setDesc('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (exp: ProjectExpense) => {
    setEditingExpense(exp);
    setDesc(exp.description);
    setAmount(String(exp.amountUsd));
    setDate(new Date(exp.expenseDate).toISOString().split('T')[0]);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!id) return;
    const amt = Number(amount.replace(',', '.'));
    if (!desc.trim()) {
      setFormError('La descripción es requerida');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError('El monto debe ser mayor a 0');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      if (editingExpense) {
        await projectService.updateExpense(editingExpense.id, {
          description: desc.trim(),
          amountUsd: amt,
          expenseDate: date,
        });
      } else {
        await projectService.addExpense(id, {
          description: desc.trim(),
          amountUsd: amt,
          expenseDate: date,
        });
      }
      setModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (exp: ProjectExpense) => {
    if (!canManagePayables) return;
    Alert.alert(
      'Eliminar Gasto Directo',
      `¿Deseas eliminar el gasto "${exp.description}" de ${formatCurrency(exp.amountUsd)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.removeExpense(exp.id);
              await refreshAll();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar el gasto');
            }
          },
        },
      ]
    );
  };

  const directExpenses = useMemo(() => expenses.filter((x) => !x.obligationPaymentId), [expenses]);
  const directExpensesTotal = useMemo(
    () => directExpenses.reduce((sum, x) => sum + Number(x.amountUsd || 0), 0),
    [directExpenses]
  );
  const incurredTotal = payablesData?.summary?.totalIncurred ?? payablesData?.summary?.totalDebt ?? 0;
  const actualCost = payablesData?.summary?.actualCost ?? (incurredTotal + directExpensesTotal);
  const totalPending = payablesData?.summary?.totalPending ?? 0;

  const metrics: MetricItem[] = [
    {
      title: 'Costo Real Acumulado',
      value: formatCurrency(actualCost),
      change: `${formatCurrency(incurredTotal)} dev. + ${formatCurrency(directExpensesTotal)} dir.`,
      rail: PmOpColors.ink,
    },
    {
      title: 'Gastos Directos',
      value: formatCurrency(directExpensesTotal),
      change: `${directExpenses.length} sin oblig. previa`,
      rail: PmOpColors.blue,
    },
    {
      title: 'Obligaciones Incurridas',
      value: formatCurrency(incurredTotal),
      change: `${payablesData?.items?.filter((i) => i.isIncurred !== false).length ?? 0} pasivos devengados`,
      rail: PmOpColors.orange,
    },
    {
      title: 'Saldo Por Pagar',
      value: formatCurrency(totalPending),
      change: `${payablesData?.summary?.openCount ?? 0} oblig. pendientes`,
      rail: PmOpColors.red,
    },
  ];

  return (
    <PmAppShell title="Costo Real" hideTitle>
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
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <ChevronLeftIcon size={16} color={PmOpColors.inkSoft} />
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>

          {canManagePayables ? (
            <Pressable
              style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
              onPress={openCreateModal}>
              <PlusIcon size={14} color={PmOpColors.white} />
              <Text style={styles.newBtnText}>Nuevo Gasto Directo</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Tarjeta de Contexto */}
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

        {/* Navegación rápida */}
        <View style={styles.quickNavRow}>
          <Pressable
            style={({ pressed }) => [styles.quickNavTab, pressed && styles.pressed]}
            onPress={() => router.replace(`/pm/detalle/${id}/cuentas-por-pagar`)}>
            <Text style={styles.quickNavText}>Cuentas por Pagar</Text>
            <ArrowUpRightIcon size={12} color={PmOpColors.orangeDeep} />
          </Pressable>
          <View style={[styles.quickNavTab, styles.quickNavTabActive]}>
            <Text style={[styles.quickNavText, styles.quickNavTextActive]}>Costo Real</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.quickNavTab, pressed && styles.pressed]}
            onPress={() => router.replace(`/pm/detalle/${id}/cobros`)}>
            <Text style={styles.quickNavText}>Cobros</Text>
            <ArrowUpRightIcon size={12} color={PmOpColors.orangeDeep} />
          </Pressable>
        </View>

        {/* Métricas */}
        <MetricStrip metrics={metrics} />

        {/* Gastos Directos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos Directos Ejecutados</Text>
          <Text style={styles.sectionSubtitle}>
            Desembolsos directos sin orden de pago previa ({directExpenses.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={PmOpColors.orange} style={{ marginVertical: 20 }} />
        ) : directExpenses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay gastos directos registrados.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {directExpenses.map((exp) => (
              <View key={exp.id} style={styles.expenseCard}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDesc}>{exp.description}</Text>
                  <Text style={styles.expenseDate}>{formatDate(exp.expenseDate)}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>{formatCurrency(exp.amountUsd)}</Text>
                  {canManagePayables ? (
                    <View style={styles.expenseActions}>
                      <Pressable
                        style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                        onPress={() => openEditModal(exp)}>
                        <PencilIcon size={13} color={PmOpColors.inkSoft} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                        onPress={() => handleDeleteExpense(exp)}>
                        <Trash2Icon size={13} color={PmOpColors.red} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Crear / Editar Gasto Directo */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExpense ? 'Editar Gasto Directo' : 'Nuevo Gasto Directo'}
              </Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <XIcon size={18} color={PmOpColors.inkSoft} />
              </Pressable>
            </View>

            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}

            <Text style={styles.inputLabel}>Descripción del gasto *</Text>
            <TextInput
              style={styles.modalInput}
              value={desc}
              onChangeText={setDesc}
              placeholder="Ej. Material ferretero urgente"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <Text style={styles.inputLabel}>Monto en USD *</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <DateInput
              label="Fecha del Gasto"
              required
              value={date}
              onChange={setDate}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalOpen(false)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                disabled={submitting}
                onPress={handleSaveExpense}>
                {submitting ? (
                  <ActivityIndicator color={PmOpColors.white} />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>
                    {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#b9561d',
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
    borderColor: '#b9561d',
    backgroundColor: '#fff0eb',
  },
  quickNavText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.orangeDeep,
  },
  quickNavTextActive: {
    color: '#a84730',
  },
  sectionHeader: {
    marginVertical: 10,
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
  list: {
    gap: 8,
  },
  expenseCard: {
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
  },
  expenseDesc: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  expenseDate: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.orangeDeep,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconAction: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: PmOpColors.paper,
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
    backgroundColor: '#b9561d',
  },
  modalBtnSubmitText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
