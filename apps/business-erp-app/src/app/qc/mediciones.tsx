import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { qcApi } from '@/features/qc/api/client';
import { useQcPermission } from '@/features/qc/hooks/usePermission';
import { measurementApi, type SubmitMeasurementPayload } from '@/features/qc/api/measurement';
import { qcProcessApi, qcDashboardApi } from '@/features/qc/api/dashboard';
import { indicatorApi } from '@/features/qc/api/indicator';
import { LayoutGrid, LayoutList, Eye, EyeOff, RefreshCcw, ClipboardPlus, ChevronDown } from 'lucide-react-native';
import { useViewMode } from '@/features/qc/hooks/useViewMode';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Enviadas',
  APPROVED: 'Aprobadas',
  REJECTED: 'Rechazadas',
  DRAFT: 'Borrador',
  LOCKED: 'Bloqueadas',
};

const VARIABLE_LABELS: Record<string, string> = {
  proveedoresConfiables: 'Proveedores confiables',
  proveedoresRequierenMejoras: 'Proveedores que requieren mejoras',
  proveedoresSuspendidos: 'Proveedores suspendidos',
  montoFacturado: 'Monto facturado (USD)',
  montoActividadesEjecutadas: 'Monto de actividades ejecutadas (USD)',
  solicitudes_adjudicadas: 'Solicitudes adjudicadas',
  total_solicitudes: 'Total de solicitudes',
  calificacion_obtenida: 'Calificación obtenida',
  calificacion_maxima: 'Calificación máxima',
  costo_ejecutado: 'Costo ejecutado',
  costo_presupuestado: 'Costo presupuestado',
  ingreso_actual: 'Ingreso actual',
  ingreso_anterior: 'Ingreso anterior',
  personal_competente: 'Personal competente',
  total_evaluado: 'Total evaluado',
  plantilla_actual: 'Plantilla actual',
  plantilla_anterior: 'Plantilla anterior',
  nro_accidentes: 'Número de accidentes',
};

function extractFormulaVariables(formula?: string | null): string[] {
  if (!formula) return [];
  const raw = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  const MATH_KEYWORDS = new Set([
    'abs', 'ceil', 'floor', 'round', 'sqrt', 'pow', 'min', 'max', 'sum', 'avg', 'mean',
    'pi', 'e', 'log', 'exp', 'sin', 'cos', 'tan', 'mod',
  ]);
  return [...new Set(raw)].filter((t) => !MATH_KEYWORDS.has(t));
}

/* ─── Submit Modal ─────────────────────────────────────────────── */
function SubmitModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [processId, setProcessId] = useState('');
  const [processOpen, setProcessOpen] = useState(false);
  const [indicatorId, setIndicatorId] = useState('');
  const [indicatorOpen, setIndicatorOpen] = useState(false);
  const [directValue, setDirectValue] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [indicatorDetail, setIndicatorDetail] = useState<any>(null);
  const [loadingIndicator, setLoadingIndicator] = useState(false);
  const [activePeriod, setActivePeriod] = useState<any>(null);

  const { data: myProcesses = [], loading: loadingProcesses } = useCachedQuery(
    '/processes/mine',
    () => qcProcessApi.mine(),
  );

  const { data: activePeriodData } = useCachedQuery(
    '/dashboard/active-period',
    () => qcDashboardApi.activePeriod(),
  );

  // Sync active period into local state
  useEffect(() => {
    setActivePeriod(activePeriodData ?? null);
  }, [activePeriodData]);

  const selectedProcess = useMemo(
    () => (myProcesses as any[]).find((p: any) => p.id === processId) ?? null,
    [myProcesses, processId],
  );

  const processIndicators: any[] = useMemo(
    () => selectedProcess?.qc_indicators ?? [],
    [selectedProcess],
  );

  const selectedIndicator = useMemo(
    () => processIndicators.find((i: any) => i.id === indicatorId) ?? null,
    [processIndicators, indicatorId],
  );

  const activeVersion = useMemo(() => {
    if (!indicatorDetail) return null;
    return indicatorDetail.versions?.find((v: any) => v.effectiveTo === null) ?? indicatorDetail.versions?.[0] ?? null;
  }, [indicatorDetail]);

  const isProcurement = useMemo(
    () => (activeVersion?.formula ?? '').includes('proveedoresConfiables'),
    [activeVersion],
  );

  const formulaVariables = useMemo(() => {
    if (!activeVersion || activeVersion.inputMode === 'DIRECT_VALUE') return [];
    const vars = extractFormulaVariables(activeVersion.formula);
    if (vars.length === 0 && isProcurement) {
      return ['proveedoresConfiables', 'proveedoresRequierenMejoras', 'proveedoresSuspendidos'];
    }
    return vars;
  }, [activeVersion, isProcurement]);

  const divisionWarning = useMemo(() => {
    if (!activeVersion?.formula) return null;
    if (isProcurement) {
      const c = Number(inputs.proveedoresConfiables);
      const m = Number(inputs.proveedoresRequierenMejoras);
      const s = Number(inputs.proveedoresSuspendidos);
      const allFilled =
        inputs.proveedoresConfiables !== undefined &&
        inputs.proveedoresRequierenMejoras !== undefined &&
        inputs.proveedoresSuspendidos !== undefined &&
        inputs.proveedoresConfiables.trim() !== '' &&
        inputs.proveedoresRequierenMejoras.trim() !== '' &&
        inputs.proveedoresSuspendidos.trim() !== '';
      if (allFilled && c + m + s === 0) {
        return 'El total de proveedores no puede ser 0.';
      }
      return null;
    }
    const cleanFormula = activeVersion.formula.replace(/\s+/g, '');
    const divMatch = cleanFormula.match(/\/([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (divMatch && divMatch[1]) {
      const denomVar = divMatch[1];
      const val = inputs[denomVar];
      if (val !== undefined && val.trim() !== '' && Number(val) === 0) {
        return `"${VARIABLE_LABELS[denomVar] ?? denomVar}" no puede ser 0 (produce división entre cero).`;
      }
    }
    return null;
  }, [activeVersion, inputs, isProcurement]);

  const handleSelectIndicator = async (id: string) => {
    setIndicatorId(id);
    setIndicatorOpen(false);
    setDirectValue('');
    setInputs({});
    if (!id) { setIndicatorDetail(null); return; }
    setLoadingIndicator(true);
    try {
      const detail = await indicatorApi.detail(id);
      setIndicatorDetail(detail);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el indicador.');
      setIndicatorDetail(null);
    } finally {
      setLoadingIndicator(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (!activePeriod || !activeVersion || !indicatorId) return false;
    if (divisionWarning) return false;
    if (activeVersion.inputMode === 'DIRECT_VALUE') {
      return directValue.trim() !== '' && Number.isFinite(Number(directValue));
    }
    if (formulaVariables.length === 0) return !isProcurement;
    return formulaVariables.every((v) => {
      const val = inputs[v];
      return val !== undefined && val.trim() !== '' && Number.isFinite(Number(val));
    });
  }, [activePeriod, activeVersion, indicatorId, divisionWarning, directValue, formulaVariables, inputs, isProcurement]);

  const handleSubmit = async () => {
    if (!activePeriod || !activeVersion) return;

    const payload: SubmitMeasurementPayload = {
      indicatorVersionId: activeVersion.id,
      periodId: activePeriod.id,
      observation: observation.trim() || undefined,
    };

    if (activeVersion.inputMode === 'DIRECT_VALUE') {
      if (!directValue || directValue.trim() === '') {
        Alert.alert('Campo requerido', 'Ingresa un valor numérico para la medición.');
        return;
      }
      const value = Number(directValue);
      if (!Number.isFinite(value)) {
        Alert.alert('Valor inválido', 'Ingresa un valor numérico válido.');
        return;
      }
      payload.directValue = value;
    } else {
      const parsedInputs: Record<string, number> = {};
      for (const variable of formulaVariables) {
        const raw = inputs[variable];
        if (raw === undefined || raw === null || raw.trim() === '') {
          Alert.alert('Campo requerido', `Ingresa un valor para "${VARIABLE_LABELS[variable] ?? variable}".`);
          return;
        }
        const value = Number(raw);
        if (!Number.isFinite(value)) {
          Alert.alert('Valor inválido', `El valor para "${VARIABLE_LABELS[variable] ?? variable}" debe ser un número válido.`);
          return;
        }
        parsedInputs[variable] = value;
      }

      if (divisionWarning) {
        Alert.alert('Error en fórmula', divisionWarning);
        return;
      }

      payload.inputs = parsedInputs;
    }

    setLoading(true);
    try {
      await measurementApi.submit(payload);
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('Error al cargar medición', e?.message ?? 'Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.overlay}><View style={modalStyles.sheet}><View style={modalStyles.header}><View><Text style={modalStyles.title}>Cargar medición</Text>{activePeriod ? (<Text style={modalStyles.subtitle}>Período: {formatDate(activePeriod.startsAt)} – {formatDate(activePeriod.endsAt)}</Text>) : (<Text style={[modalStyles.subtitle, { color: QcOpColors.red }]}>Sin período activo</Text>)}</View><Pressable onPress={onClose} style={modalStyles.closeBtn} hitSlop={10}><Text style={modalStyles.closeBtnText}>✕</Text></Pressable></View><ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled"><Text style={modalStyles.label}>Proceso</Text>
            <Pressable
              style={modalStyles.selectBtn}
              onPress={() => { setProcessOpen(!processOpen); setIndicatorOpen(false); }}
            >
              <Text style={[modalStyles.selectText, !selectedProcess && { color: QcOpColors.placeholder }]}>
                {selectedProcess ? `${selectedProcess.code} · ${selectedProcess.name}` : 'Selecciona un proceso'}
              </Text>
              <ChevronDown size={16} color={QcOpColors.inkSoft} />
            </Pressable>
            {processOpen && (
              <View style={modalStyles.dropdown}>{loadingProcesses ? (<ActivityIndicator color={QcOpColors.teal} style={{ padding: 12 }} />) : (myProcesses as any[]).length === 0 ? (<Text style={modalStyles.dropdownEmpty}>No tienes procesos asignados.</Text>) : ((myProcesses as any[]).map((p: any) => (<Pressable key={p.id} style={[modalStyles.dropdownItem, p.id === processId && modalStyles.dropdownItemActive]} onPress={() => { setProcessId(p.id); setProcessOpen(false); setIndicatorId(''); setIndicatorDetail(null); setInputs({}); setDirectValue(''); }}><Text style={[modalStyles.dropdownItemText, p.id === processId && { color: QcOpColors.green }]}>{p.code} · {p.name}</Text></Pressable>)))}</View>
            )}
            <Text style={[modalStyles.label, { marginTop: 16 }]}>Indicador</Text>
            <Pressable
              style={[modalStyles.selectBtn, !processId && modalStyles.selectBtnDisabled]}
              onPress={() => { if (processId) { setIndicatorOpen(!indicatorOpen); setProcessOpen(false); } }}
            >
              <Text style={[modalStyles.selectText, !selectedIndicator && { color: QcOpColors.placeholder }]}>
                {selectedIndicator ? `${selectedIndicator.code} · ${selectedIndicator.name}` : 'Selecciona un indicador'}
              </Text>
              <ChevronDown size={16} color={QcOpColors.inkSoft} />
            </Pressable>
            {indicatorOpen && processId && (
              <View style={modalStyles.dropdown}>{processIndicators.length === 0 ? (<Text style={modalStyles.dropdownEmpty}>Este proceso no tiene indicadores asignados.</Text>) : (processIndicators.map((ind: any) => (<Pressable key={ind.id} style={[modalStyles.dropdownItem, ind.id === indicatorId && modalStyles.dropdownItemActive]} onPress={() => handleSelectIndicator(ind.id)}><Text style={[modalStyles.dropdownItemText, ind.id === indicatorId && { color: QcOpColors.green }]}>{ind.code} · {ind.name}</Text></Pressable>)))}</View>
            )}
            {loadingIndicator && (
              <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 20 }} />
            )}
            {indicatorId && !loadingIndicator && activeVersion && (
              <View style={modalStyles.valueBox}><Text style={modalStyles.valueBoxLabel}>{activeVersion.inputMode === 'DIRECT_VALUE' ? 'Valor directo' : 'Entradas de la fórmula'}</Text>{activeVersion.inputMode === 'DIRECT_VALUE' ? (<><Text style={modalStyles.label}>Valor medido</Text><TextInput style={modalStyles.input} value={directValue} onChangeText={setDirectValue} keyboardType="numeric" placeholder="Ej: 10" placeholderTextColor={QcOpColors.placeholder} /></>) : (<>{formulaVariables.map((variable) => (<View key={variable} style={{ marginBottom: 12 }}><Text style={modalStyles.label}>{VARIABLE_LABELS[variable] ?? variable}</Text><TextInput style={modalStyles.input} value={inputs[variable] ?? ''} onChangeText={(v) => setInputs((prev) => ({ ...prev, [variable]: v }))} keyboardType="numeric" placeholder="Ej: 10" placeholderTextColor={QcOpColors.placeholder} /></View>))}{activeVersion.formula ? (<View style={modalStyles.formulaBox}><Text style={modalStyles.formulaText}>{activeVersion.formula}</Text></View>) : null}{divisionWarning ? (<Text style={{ color: QcOpColors.red, fontSize: 12, marginTop: 6, fontWeight: '600' }}>{divisionWarning}</Text>) : null}</>)}</View>
            )}
            <Text style={[modalStyles.label, { marginTop: 16 }]}>Observación <Text style={{ fontWeight: '400', color: QcOpColors.inkSoft }}>(opcional)</Text></Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 72, textAlignVertical: 'top' }]}
              value={observation}
              onChangeText={setObservation}
              placeholder="Detalle o comentario de la medición…"
              placeholderTextColor={QcOpColors.placeholder}
              multiline
            />
            <View style={modalStyles.actions}><Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelText}>Cancelar</Text></Pressable><Pressable style={[modalStyles.submitBtn, (!canSubmit || loading) && { opacity: 0.5 }]} onPress={handleSubmit} disabled={!canSubmit || loading}>{loading ? (<ActivityIndicator color={QcOpColors.white} size="small" />) : (<Text style={modalStyles.submitText}>Cargar medición</Text>)}</Pressable></View>
</ScrollView></View></KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Main Screen ──────────────────────────────────────────────── */
export default function QcMedicionesScreen() {
  const { canSubmitMeasurement, canReviewMeasurements } = useQcPermission();
  const { isTablet } = useBreakpoint();
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any | null>(null);
  const [observation, setObservation] = useState('');
  const { viewMode, setViewMode } = useViewMode();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [showValues, setShowValues] = useState(true);

  const { data: measurements = [], loading, refetch: loadData } = useCachedQuery(
    '/measurements',
    async () => {
      const res = await qcApi.get<any>('/measurements');
      return res.data || res;
    },
  );

  const filteredMeasurements = useMemo(() => {
    if (statusFilter === 'ALL') return measurements as any[];
    return (measurements as any[]).filter((m) => m.status === statusFilter);
  }, [measurements, statusFilter]);

  const getTrafficColor = (trafficLight: string) => {
    switch (trafficLight) {
      case 'GREEN': return QcOpColors.green;
      case 'YELLOW': return QcOpColors.orange;
      case 'RED': return QcOpColors.red;
      default: return QcOpColors.inkSoft;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: '#ecfdf5', text: QcOpColors.green };
      case 'REJECTED': return { bg: '#fef2f2', text: QcOpColors.red };
      case 'SUBMITTED': return { bg: '#eff6ff', text: QcOpColors.blue };
      default: return { bg: QcOpColors.rule, text: QcOpColors.inkSoft };
    }
  };

  const handleReviewSubmit = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedMeasurement) return;
    if (action === 'REJECTED' && !observation.trim()) {
      Alert.alert('Requerido', 'La observación es obligatoria para rechazar.');
      return;
    }
    try {
      await measurementApi.review(selectedMeasurement.id, {
        status: action,
        observation: observation.trim() || undefined,
      });
      setReviewModalVisible(false);
      setObservation('');
      setSelectedMeasurement(null);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Error al revisar la medición.');
    }
  };

  const renderItem = useCallback(({ item: m }: { item: any }) => {
    const isPending = m.status === 'SUBMITTED' || m.status === 'PENDING';
    const trafficColor = getTrafficColor(m.trafficLight);
    const badgeStyle = getStatusBadgeStyle(m.status);
    const displayValue = showValues ? (m.value ?? 'N/A') : '***';

    if (viewMode === 'list') {
      return (
        <View style={styles.listItem}>
          <View style={[styles.listTrafficLight, { backgroundColor: trafficColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.listIndName} numberOfLines={1}>
              {m.indicator?.name || m.version?.indicator?.name}
            </Text>
            <Text style={styles.listDate}>
              {new Date(m.measuredAt || m.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.listValue, { color: trafficColor }]}>{displayValue}</Text>
          {canReviewMeasurements && isPending ? (
            <Pressable
              style={styles.reviewBtn}
              onPress={() => { setSelectedMeasurement(m); setObservation(''); setReviewModalVisible(true); }}
            >
              <RefreshCcw size={14} color={QcOpColors.teal} />
              <Text style={styles.reviewBtnText}>Revisar</Text>
            </Pressable>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg, marginLeft: 12 }]}>
              <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                {STATUS_LABELS[m.status] || m.status}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={viewMode === 'cards' && isTablet ? styles.cardCell : undefined}>
        <View style={[styles.card, { borderLeftColor: trafficColor, borderLeftWidth: 4 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.date}>{new Date(m.measuredAt || m.createdAt).toLocaleDateString()}</Text>
            <Text style={[styles.valueText, { color: trafficColor }]}>{displayValue}</Text>
          </View>
          <Text style={styles.indName}>{m.indicator?.name || m.version?.indicator?.name || 'Indicador Desconocido'}</Text>
          <Text style={styles.procName}>{m.process?.name || m.version?.indicator?.process?.name || 'Proceso'}</Text>
          {(m.analysis || m.observation) ? (
            <View style={styles.analysisBox}>
              <Text style={styles.analysisLabel}>Observación:</Text>
              <Text style={styles.analysisText}>{m.observation || m.analysis}</Text>
            </View>
          ) : null}
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                {STATUS_LABELS[m.status] || m.status}
              </Text>
            </View>
            {canReviewMeasurements && isPending && (
              <Pressable
                style={styles.reviewBtn}
                onPress={() => { setSelectedMeasurement(m); setObservation(''); setReviewModalVisible(true); }}
              >
                <RefreshCcw size={14} color={QcOpColors.teal} />
                <Text style={styles.reviewBtnText}>Revisar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }, [viewMode, showValues, canReviewMeasurements, isTablet]);

  return (
    <QcAppShell title="Mediciones" subtitle="Revisión y estado" scrollable={false}>
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'Todas' : STATUS_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.toolsRight}>
          <Pressable style={styles.iconBtn} onPress={() => setShowValues(!showValues)}>
            {showValues ? <EyeOff size={18} color={QcOpColors.inkSoft} /> : <Eye size={18} color={QcOpColors.teal} />}
          </Pressable>
          <View style={styles.toggleGroup}>
            <Pressable
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <LayoutList size={16} color={viewMode === 'list' ? QcOpColors.white : QcOpColors.inkSoft} />
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]}
              onPress={() => setViewMode('cards')}
            >
              <LayoutGrid size={16} color={viewMode === 'cards' ? QcOpColors.white : QcOpColors.inkSoft} />
            </Pressable>
          </View>
        </View>
      </View>

      {canSubmitMeasurement ? (
        <Pressable style={styles.submitFab} onPress={() => setSubmitModalVisible(true)}>
          <ClipboardPlus size={18} color={QcOpColors.white} />
          <Text style={styles.submitFabText}>Cargar medición</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          key={`${viewMode}-${isTablet ? 'tablet' : 'phone'}`}
          data={filteredMeasurements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={viewMode === 'cards' && isTablet ? 2 : 1}
          columnWrapperStyle={viewMode === 'cards' && isTablet ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.empty}>No hay mediciones en esta categoría.</Text>}
        />
      )}

      {submitModalVisible ? (
        <SubmitModal onClose={() => setSubmitModalVisible(false)} onSuccess={() => loadData()} />
      ) : null}

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Revisar medición</Text>
            {selectedMeasurement && (
              <View style={styles.reviewTargetBox}>
                <Text style={styles.indName}>
                  {selectedMeasurement.indicator?.name || selectedMeasurement.version?.indicator?.name}
                </Text>
                <Text style={styles.procName}>
                  {selectedMeasurement.process?.name || selectedMeasurement.version?.indicator?.process?.name} •{' '}
                  {new Date(selectedMeasurement.measuredAt || selectedMeasurement.createdAt).toLocaleDateString()}
                </Text>
                <Text style={[styles.valueText, { marginTop: 8, fontSize: 22 }]}>
                  {showValues ? (selectedMeasurement.value ?? 'N/A') : '***'}
                </Text>
              </View>
            )}
            <Text style={styles.modalLabel}>Observaciones (obligatoria para rechazar)</Text>
            <TextInput
              style={styles.modalInput}
              value={observation}
              onChangeText={setObservation}
              placeholder="Ingresa una observación detallada..."
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setReviewModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, styles.rejectBtn]}
                onPress={() => handleReviewSubmit('REJECTED')}
              >
                <Text style={styles.modalSubmitText}>Rechazar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, styles.approveBtn]}
                onPress={() => handleReviewSubmit('APPROVED')}
              >
                <Text style={styles.modalSubmitText}>Aprobar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </QcAppShell>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  filterScroll: { gap: 8, alignItems: 'center', paddingRight: 16 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: QcOpColors.surface, borderWidth: 1, borderColor: QcOpColors.rule },
  filterPillActive: { backgroundColor: '#e0f2fe', borderColor: QcOpColors.blue },
  filterText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft },
  filterTextActive: { color: QcOpColors.blue },

  toolsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  toggleGroup: { flexDirection: 'row', backgroundColor: QcOpColors.surface, borderRadius: 6, borderWidth: 1, borderColor: QcOpColors.rule, overflow: 'hidden' },
  toggleBtn: { padding: 6, paddingHorizontal: 10 },
  toggleBtnActive: { backgroundColor: QcOpColors.ink },

  submitFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: QcOpColors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  submitFabText: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.white },

  listContainer: { gap: 12, paddingBottom: 20 },
  columnWrapper: { gap: 12 },
  cardCell: { flex: 1 },

  card: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft },
  valueText: { fontFamily: FontFamilies.display, fontSize: 24 },
  indName: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.ink },
  procName: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginTop: 4 },
  analysisBox: { marginTop: 12, backgroundColor: '#f8fafc', padding: 10, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 4 },
  analysisLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.inkSoft, textTransform: 'uppercase', marginBottom: 2 },
  analysisText: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.ink },
  empty: { textAlign: 'center', marginTop: 24, fontFamily: FontFamilies.body, color: QcOpColors.inkSoft },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#d8e6de', backgroundColor: QcOpColors.white },
  reviewBtnText: { color: QcOpColors.teal, fontFamily: FontFamilies.bodyBold, fontSize: 12 },

  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  statusBadgeText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, textTransform: 'uppercase' },

  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: QcOpColors.surface, padding: 12, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8 },
  listTrafficLight: { width: 4, height: 24, borderRadius: 2, marginRight: 12 },
  listIndName: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.ink },
  listDate: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft, marginTop: 2 },
  listValue: { fontFamily: FontFamilies.display, fontSize: 16, marginHorizontal: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: {
    backgroundColor: QcOpColors.surface,
    padding: 20,
    borderRadius: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: { fontFamily: FontFamilies.display, fontSize: 18, color: QcOpColors.ink, marginBottom: 16 },
  reviewTargetBox: { backgroundColor: '#fbfdfc', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, marginBottom: 16 },
  modalLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 4, padding: 12, minHeight: 80, textAlignVertical: 'top', fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingHorizontal: 12, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.inkSoft },
  modalSubmitBtn: { paddingHorizontal: 16, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  approveBtn: { backgroundColor: QcOpColors.accent },
  rejectBtn: { backgroundColor: '#ef4444' },
  modalSubmitText: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.white },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: QcOpColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: QcOpColors.rule },
  title: { fontFamily: FontFamilies.display, fontSize: 18, color: QcOpColors.ink },
  subtitle: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginTop: 4 },
  closeBtn: { padding: 4 },
  closeBtnText: { fontFamily: FontFamilies.bodyBold, fontSize: 18, color: QcOpColors.inkSoft },
  body: { padding: 20 },

  label: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.ink, marginBottom: 6 },

  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: QcOpColors.rule,
    borderRadius: 8,
    backgroundColor: QcOpColors.white,
  },
  selectBtnDisabled: { opacity: 0.45 },
  selectText: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink, flex: 1 },

  dropdown: {
    borderWidth: 1,
    borderColor: QcOpColors.rule,
    borderRadius: 8,
    backgroundColor: QcOpColors.white,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#f0fdf4' },
  dropdownItemText: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.ink },
  dropdownEmpty: { padding: 14, fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.inkSoft, textAlign: 'center' },

  valueBox: {
    backgroundColor: '#fbfdfc',
    borderWidth: 1,
    borderColor: QcOpColors.rule,
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    gap: 4,
  },
  valueBoxLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: QcOpColors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: QcOpColors.rule,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: QcOpColors.ink,
    backgroundColor: QcOpColors.white,
  },

  formulaBox: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  formulaText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: '#047857' },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    marginBottom: 32,
  },
  cancelBtn: { paddingHorizontal: 14, height: 44, justifyContent: 'center' },
  cancelText: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.inkSoft },
  submitBtn: {
    backgroundColor: QcOpColors.accent,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.white },
});
