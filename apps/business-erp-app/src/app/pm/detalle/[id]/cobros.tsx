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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { financialService } from '@/features/pm/api/financial';
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
import type { FinancialValuation, Project, ProjectCollection } from '@/features/pm/types';

export default function PmCobrosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { canManagePayables } = usePermission();

  const [project, setProject] = useState<Project | null>(null);
  const [collections, setCollections] = useState<ProjectCollection[]>([]);
  const [valuations, setValuations] = useState<FinancialValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de Cobro
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ProjectCollection | null>(null);
  const [selectedValuationId, setSelectedValuationId] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [appliesAdvance, setAppliesAdvance] = useState(false);
  const [grossAmount, setGrossAmount] = useState('');
  const [amortizedAmount, setAmortizedAmount] = useState('0');
  const [netAmount, setNetAmount] = useState('');
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshAll = useCallback(async () => {
    if (!id || status !== 'authenticated') return;
    try {
      const [col, proj, vals] = await Promise.all([
        projectService.getCollections(id),
        projectService.getById(id).catch(() => null),
        financialService.getByProjectId(id).catch(() => []),
      ]);
      setCollections(col);
      if (proj) setProject(proj);
      setValuations(vals);
    } catch (err) {
      console.error('Error refreshing collections data:', err);
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
    setEditingCollection(null);
    setSelectedValuationId('');
    setDescription('');
    setReference('');
    setAppliesAdvance(false);
    setGrossAmount('');
    setAmortizedAmount('0');
    setNetAmount('');
    setCollectedAt(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (col: ProjectCollection) => {
    setEditingCollection(col);
    setSelectedValuationId(col.valuationId || '');
    setDescription(col.reference || '');
    setReference('');
    const hasAmort = col.amortizedAmountUsd != null && col.amortizedAmountUsd > 0;
    setAppliesAdvance(hasAmort);
    setGrossAmount(col.grossAmountUsd != null ? String(col.grossAmountUsd) : String(col.amountUsd));
    setAmortizedAmount(col.amortizedAmountUsd != null ? String(col.amortizedAmountUsd) : '0');
    setNetAmount(String(col.amountUsd));
    setCollectedAt(new Date(col.collectedAt).toISOString().split('T')[0]);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSelectValuation = (valId: string) => {
    setSelectedValuationId(valId);
    const val = valuations.find((v) => v.id === valId);
    if (val) {
      const gross = Number(val.amountUsd || 0);
      setGrossAmount(String(gross));
      const amort = appliesAdvance ? Number(amortizedAmount.replace(',', '.')) || 0 : 0;
      setNetAmount(String(Math.max(0, gross - amort)));
      if (!description) {
        setDescription(`Valuación N° ${val.valuationNumber}${val.invoiceNumber ? ` (Fact. ${val.invoiceNumber})` : ''}`);
      }
    }
  };

  const handleGrossChange = (val: string) => {
    setGrossAmount(val);
    const g = Number(val.replace(',', '.')) || 0;
    const a = appliesAdvance ? Number(amortizedAmount.replace(',', '.')) || 0 : 0;
    setNetAmount(String(Math.max(0, g - a)));
  };

  const handleAmortChange = (val: string) => {
    setAmortizedAmount(val);
    const g = Number(grossAmount.replace(',', '.')) || 0;
    const a = Number(val.replace(',', '.')) || 0;
    setNetAmount(String(Math.max(0, g - a)));
  };

  const handleSaveCollection = async () => {
    if (!id) return;
    const net = Number(netAmount.replace(',', '.'));
    if (isNaN(net) || net <= 0) {
      setFormError('El monto neto cobrado debe ser mayor a 0');
      return;
    }

    const gross = grossAmount ? Number(grossAmount.replace(',', '.')) : undefined;
    const amort = appliesAdvance ? Number(amortizedAmount.replace(',', '.')) || 0 : 0;

    let finalRef = description.trim();
    if (reference.trim()) {
      finalRef = finalRef ? `${finalRef} · Ref: ${reference.trim()}` : reference.trim();
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingCollection) {
        await projectService.updateCollection(editingCollection.id, {
          amountUsd: net,
          reference: finalRef || undefined,
          collectedAt,
          valuationId: selectedValuationId || null,
          grossAmountUsd: gross !== undefined ? gross : null,
          amortizedAmountUsd: amort,
        });
      } else {
        await projectService.addCollection(id, {
          amountUsd: net,
          reference: finalRef || undefined,
          collectedAt,
          valuationId: selectedValuationId || undefined,
          grossAmountUsd: gross,
          amortizedAmountUsd: amort,
        });
      }

      setModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el cobro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCollection = (col: ProjectCollection) => {
    if (!canManagePayables) return;
    Alert.alert(
      'Eliminar Cobro',
      `¿Deseas eliminar el registro de cobro de ${formatCurrency(col.amountUsd)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.removeCollection(col.id);
              await refreshAll();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar el cobro');
            }
          },
        },
      ]
    );
  };

  const totalCollected = useMemo(
    () => collections.reduce((sum, c) => sum + Number(c.amountUsd || 0), 0),
    [collections]
  );

  const metrics: MetricItem[] = [
    {
      title: 'Total Cobrado (Neto)',
      value: formatCurrency(totalCollected),
      change: `${collections.length} cobros registrados en banco`,
      rail: PmOpColors.green,
    },
  ];

  return (
    <PmAppShell title="Cobros" hideTitle>
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
              <Text style={styles.newBtnText}>Registrar Cobro</Text>
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
          <Pressable
            style={({ pressed }) => [styles.quickNavTab, pressed && styles.pressed]}
            onPress={() => router.replace(`/pm/detalle/${id}/costo-real`)}>
            <Text style={styles.quickNavText}>Costo Real</Text>
            <ArrowUpRightIcon size={12} color={PmOpColors.orangeDeep} />
          </Pressable>
          <View style={[styles.quickNavTab, styles.quickNavTabActive]}>
            <Text style={[styles.quickNavText, styles.quickNavTextActive]}>Cobros</Text>
          </View>
        </View>

        {/* Métricas */}
        <MetricStrip metrics={metrics} />

        {/* Sección de Cobros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cobros y Liquidaciones</Text>
          <Text style={styles.sectionSubtitle}>
            Historial de pagos recibidos de clientes ({collections.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={PmOpColors.orange} style={{ marginVertical: 20 }} />
        ) : collections.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay cobros registrados para este proyecto.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {collections.map((c) => (
              <View key={c.id} style={styles.collectionCard}>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionRef}>{c.reference || 'Cobro registrado'}</Text>
                  <Text style={styles.collectionDate}>{formatDate(c.collectedAt)}</Text>
                  {c.grossAmountUsd != null && c.amortizedAmountUsd ? (
                    <Text style={styles.amortNote}>
                      Bruto: {formatCurrency(c.grossAmountUsd)} · Amort: {formatCurrency(c.amortizedAmountUsd)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.collectionRight}>
                  <Text style={styles.collectionAmount}>{formatCurrency(c.amountUsd)}</Text>
                  {canManagePayables ? (
                    <View style={styles.collectionActions}>
                      <Pressable
                        style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                        onPress={() => openEditModal(c)}>
                        <PencilIcon size={13} color={PmOpColors.inkSoft} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                        onPress={() => handleDeleteCollection(c)}>
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

      {/* Modal Registrar / Editar Cobro */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCollection ? 'Editar Cobro' : 'Registrar Cobro'}
              </Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <XIcon size={18} color={PmOpColors.inkSoft} />
              </Pressable>
            </View>

            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}

            {/* Selector de valuación si existen */}
            {valuations.length > 0 ? (
              <>
                <Text style={styles.inputLabel}>Asociar a Valuación (opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.valChips}>
                  {valuations.map((v) => (
                    <Pressable
                      key={v.id}
                      style={[styles.valChip, selectedValuationId === v.id && styles.valChipActive]}
                      onPress={() => handleSelectValuation(v.id)}>
                      <Text
                        style={[
                          styles.valChipText,
                          selectedValuationId === v.id && styles.valChipTextActive,
                        ]}>
                        N° {v.valuationNumber} ({formatCurrency(v.amountUsd)})
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Text style={styles.inputLabel}>Descripción o Referencia</Text>
            <TextInput
              style={styles.modalInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej. Cobro Valuación N° 1 / Transferencia"
              placeholderTextColor={PmOpColors.placeholder}
            />

            {/* Toggle Amortización */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>¿Aplica amortización de anticipo?</Text>
              <Switch
                value={appliesAdvance}
                onValueChange={(val) => {
                  setAppliesAdvance(val);
                  if (!val) {
                    setAmortizedAmount('0');
                    if (grossAmount) setNetAmount(grossAmount);
                  }
                }}
                trackColor={{ false: PmOpColors.divider, true: '#4c9b7a' }}
                thumbColor={PmOpColors.white}
              />
            </View>

            {appliesAdvance ? (
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Monto Bruto USD</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={grossAmount}
                    onChangeText={handleGrossChange}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={PmOpColors.placeholder}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Amortización USD</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={amortizedAmount}
                    onChangeText={handleAmortChange}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={PmOpColors.placeholder}
                  />
                </View>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Monto Neto Recibido en Banco (USD) *</Text>
            <TextInput
              style={styles.modalInput}
              value={netAmount}
              onChangeText={setNetAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <DateInput
              label="Fecha de Cobro"
              required
              value={collectedAt}
              onChange={setCollectedAt}
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
                onPress={handleSaveCollection}>
                {submitting ? (
                  <ActivityIndicator color={PmOpColors.white} />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>
                    {editingCollection ? 'Guardar Cambios' : 'Confirmar Cobro'}
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
    backgroundColor: '#376850',
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
    borderColor: '#376850',
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
  collectionCard: {
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
  collectionInfo: {
    flex: 1,
    gap: 2,
  },
  collectionRef: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  collectionDate: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  amortNote: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#8a6a12',
  },
  collectionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  collectionAmount: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: '#376850',
  },
  collectionActions: {
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
    maxHeight: '90%',
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
  valChips: {
    maxHeight: 36,
  },
  valChip: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  valChipActive: {
    backgroundColor: '#edf3ec',
    borderColor: '#4c9b7a',
  },
  valChipText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  valChipTextActive: {
    color: '#376850',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.ink,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
    gap: 4,
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
    backgroundColor: '#376850',
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
