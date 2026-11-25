import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { QcColors, QcOpColors } from '@/features/qc/theme';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { adminApi, type QcAdminIndicator, type QcAdminProcess } from '@/features/qc/api/admin';
import { PlusIcon, PencilIcon, XIcon, SearchIcon } from '@/features/qc/components/icons';

function IndicatorRow({ indicator, onEdit }: { indicator: QcAdminIndicator, onEdit: (indicator: QcAdminIndicator) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <View style={styles.codeRow}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{indicator.code}</Text>
          </View>
          <Text style={styles.chartType}>{indicator.chartType}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{indicator.name}</Text>
        <Text style={styles.process}>Proceso: {indicator.process?.name || 'N/A'}</Text>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(indicator)}>
        <PencilIcon size={18} color={QcColors.accent} />
      </TouchableOpacity>
    </View>
  );
}

const SelectGroup = ({ value, options, onChange }: { value: string, options: {label: string, value: string}[], onChange: (val: string) => void }) => (
  <View style={styles.selectGroup}>
    {options.map(opt => (
      <TouchableOpacity 
        key={opt.value}
        style={[styles.selectBtn, value === opt.value && styles.selectBtnActive]}
        onPress={() => onChange(opt.value)}
      >
        <Text style={[styles.selectBtnText, value === opt.value && styles.selectBtnTextActive]}>{opt.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function QcAdminIndicadoresScreen() {
  const [indicators, setIndicators] = useState<QcAdminIndicator[]>([]);
  const [processes, setProcesses] = useState<QcAdminProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Form states
  const [processId, setProcessId] = useState('');
  const [subprocessId, setSubprocessId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [chartType, setChartType] = useState('LINE');
  
  const [frequency, setFrequency] = useState('MONTHLY');
  const [direction, setDirection] = useState('AT_LEAST');
  const [inputMode, setInputMode] = useState('DIRECT_VALUE');
  const [formula, setFormula] = useState('');
  
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [thresholdGreen, setThresholdGreen] = useState('');
  const [thresholdRed, setThresholdRed] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [processSelectorOpen, setProcessSelectorOpen] = useState(false);
  const [subprocessSelectorOpen, setSubprocessSelectorOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminApi.listIndicators(),
      adminApi.listProcesses()
    ])
    .then(([inds, procs]) => {
      setIndicators(inds);
      setProcesses(procs);
      setPage(1);
    })
    .catch(() => {
      setIndicators([]);
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIndicators = useMemo(() => {
    return indicators.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [indicators, searchQuery]);

  const paginatedIndicators = useMemo(() => {
    return filteredIndicators.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredIndicators, page]);

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setProcessId('');
    setSubprocessId('');
    setCode('');
    setName('');
    setChartType('LINE');
    setFrequency('MONTHLY');
    setDirection('AT_LEAST');
    setInputMode('DIRECT_VALUE');
    setFormula('');
    setTargetValue('');
    setUnit('');
    setThresholdGreen('');
    setThresholdRed('');
    setProcessSelectorOpen(false);
    setSubprocessSelectorOpen(false);
    setModalVisible(true);
  };

  const openEditModal = (indicator: QcAdminIndicator) => {
    setIsEditing(true);
    setCurrentId(indicator.id);
    setProcessId(indicator.processId);
    setSubprocessId(indicator.subprocessId || '');
    setCode(indicator.code);
    setName(indicator.name);
    setChartType(indicator.chartType || 'LINE');

    const version = indicator.versions?.[0];
    const target = version?.targets?.[0];

    setFrequency(version?.frequency || 'MONTHLY');
    setDirection(version?.direction || 'AT_LEAST');
    setInputMode(version?.inputMode || 'DIRECT_VALUE');
    setFormula(version?.formula || '');
    
    setTargetValue(target?.targetValue !== undefined ? String(target.targetValue) : '');
    setUnit(target?.unit || '');
    setThresholdGreen(target?.thresholds?.green !== undefined ? String(target.thresholds.green) : '');
    setThresholdRed(target?.thresholds?.red !== undefined ? String(target.thresholds.red) : '');

    setProcessSelectorOpen(false);
    setSubprocessSelectorOpen(false);
    setModalVisible(true);
  };

  const saveIndicator = async () => {
    if (!processId || !code || !name || !chartType || !targetValue || !unit || !thresholdGreen || !frequency || !direction || !inputMode) {
      setErrorMessage('Faltan campos obligatorios');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        code,
        name,
        chartType,
        frequency,
        direction,
        inputMode,
        formula: inputMode === 'FORMULA_INPUTS' ? formula : undefined,
        targetValue: Number(targetValue),
        unit,
        thresholds: {
          green: Number(thresholdGreen),
          ...(thresholdRed ? { red: Number(thresholdRed) } : {})
        }
      };

      if (isEditing && currentId) {
        await adminApi.updateIndicator(currentId, payload);
      } else {
        await adminApi.createIndicator({
          ...payload,
          processId,
          subprocessId: subprocessId || null,
        });
      }
      setModalVisible(false);
      loadData();
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al guardar el indicador');
    } finally {
      setSubmitting(false);
    }
  };
  
  const rootProcesses = processes.filter(p => !p.parentId);
  const childProcesses = processes.filter(p => p.parentId === processId);

  return (
    <QcAppShell title="Indicadores" subtitle={`${indicators.length} indicadores configurados`} scrollable={false}>
      
      <View style={styles.headerRow}>
        <View style={styles.searchWrapper}>
          <SearchIcon size={18} color={QcOpColors.inkSoft} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar indicador..."
            placeholderTextColor={QcOpColors.inkSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.newButton} onPress={openCreateModal}>
          <PlusIcon size={16} color={QcColors.paper} />
          <Text style={styles.newButtonText}>Nuevo Indicador</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={QcColors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={paginatedIndicators}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <IndicatorRow indicator={item} onEdit={openEditModal} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron indicadores.</Text>}
          onEndReached={() => setPage(p => p + 1)}
          onEndReachedThreshold={0.5}
        />
      )}

      {errorMessage && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setErrorMessage(null)} style={styles.alertBtn}>
                <Text style={styles.alertBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Indicador' : 'Nuevo Indicador'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <XIcon size={24} color={QcColors.inkSoft} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.label}>Código</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="Ej: KPI-COM-01"
                placeholderTextColor={QcColors.placeholder}
              />

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Cumplimiento de entregas"
                placeholderTextColor={QcColors.placeholder}
              />

              <View style={{ zIndex: 10 }}>
                <Text style={styles.label}>Proceso</Text>
                <Pressable 
                  style={[styles.input, { justifyContent: 'center' }]} 
                  onPress={() => { setProcessSelectorOpen(!processSelectorOpen); setSubprocessSelectorOpen(false); }}
                  disabled={isEditing}
                >
                  <Text style={processId ? { color: QcColors.ink, fontFamily: FontFamilies.body } : { color: QcColors.placeholder, fontFamily: FontFamilies.body }}>
                    {processId ? rootProcesses.find(p => p.id === processId)?.name || processes.find(p => p.id === processId)?.name || 'Proceso seleccionado' : 'Selecciona un proceso'}
                  </Text>
                </Pressable>
                
                {processSelectorOpen && !isEditing && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                      {rootProcesses.map((p: any) => (
                        <Pressable 
                          key={p.id} 
                          style={styles.dropdownItem} 
                          onPress={() => { setProcessId(p.id); setSubprocessId(''); setProcessSelectorOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{p.code} - {p.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ zIndex: 9 }}>
                <Text style={styles.label}>Subproceso (opcional)</Text>
                <Pressable 
                  style={[styles.input, { justifyContent: 'center' }]} 
                  onPress={() => { setSubprocessSelectorOpen(!subprocessSelectorOpen); setProcessSelectorOpen(false); }}
                  disabled={isEditing || !processId}
                >
                  <Text style={subprocessId ? { color: QcColors.ink, fontFamily: FontFamilies.body } : { color: QcColors.placeholder, fontFamily: FontFamilies.body }}>
                    {subprocessId ? childProcesses.find(p => p.id === subprocessId)?.name || processes.find(p => p.id === subprocessId)?.name || 'Subproceso seleccionado' : 'Sin subproceso'}
                  </Text>
                </Pressable>
                
                {subprocessSelectorOpen && !isEditing && processId && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                      <Pressable 
                        style={styles.dropdownItem} 
                        onPress={() => { setSubprocessId(''); setSubprocessSelectorOpen(false); }}>
                        <Text style={styles.dropdownItemText}>Sin subproceso</Text>
                      </Pressable>
                      {childProcesses.map((p: any) => (
                        <Pressable 
                          key={p.id} 
                          style={styles.dropdownItem} 
                          onPress={() => { setSubprocessId(p.id); setSubprocessSelectorOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{p.code} - {p.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.label}>Frecuencia</Text>
              <SelectGroup 
                value={frequency} 
                onChange={setFrequency} 
                options={[
                  { label: 'Mensual', value: 'MONTHLY' },
                  { label: 'Trimestral', value: 'QUARTERLY' },
                  { label: 'Semestral', value: 'SEMIANNUAL' },
                  { label: 'Por Proyecto', value: 'PROJECT_BASED' }
                ]} 
              />

              <Text style={styles.label}>Dirección</Text>
              <SelectGroup 
                value={direction} 
                onChange={setDirection} 
                options={[
                  { label: 'Mínimo (>=)', value: 'AT_LEAST' },
                  { label: 'Máximo (<=)', value: 'AT_MOST' },
                  { label: 'Rango', value: 'RANGE' }
                ]} 
              />

              <Text style={styles.label}>Tipo de gráfica</Text>
              <SelectGroup 
                value={chartType} 
                onChange={setChartType} 
                options={[
                  { label: 'Línea / tendencia', value: 'LINE' },
                  { label: 'Pastel / distribución', value: 'PIE' }
                ]} 
              />

              <Text style={styles.label}>Modo de entrada</Text>
              <SelectGroup 
                value={inputMode} 
                onChange={setInputMode} 
                options={[
                  { label: 'Valor directo', value: 'DIRECT_VALUE' },
                  { label: 'Fórmula', value: 'FORMULA_INPUTS' }
                ]} 
              />

              {inputMode === 'FORMULA_INPUTS' && (
                <>
                  <Text style={styles.label}>Fórmula</Text>
                  <TextInput
                    style={[styles.input, { fontFamily: 'monospace' }]}
                    value={formula}
                    onChangeText={setFormula}
                    placeholder="Ej: (entregas / total) * 100"
                    placeholderTextColor={QcColors.placeholder}
                  />
                </>
              )}

              <Text style={styles.label}>Meta</Text>
              <TextInput
                style={styles.input}
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder="Ej: 90"
                placeholderTextColor={QcColors.placeholder}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Unidad</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="Ej: %"
                placeholderTextColor={QcColors.placeholder}
              />

              <Text style={styles.label}>Verde (desde)</Text>
              <TextInput
                style={styles.input}
                value={thresholdGreen}
                onChangeText={setThresholdGreen}
                placeholder="Ej: 80"
                placeholderTextColor={QcColors.placeholder}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Rojo (hasta)</Text>
              <TextInput
                style={styles.input}
                value={thresholdRed}
                onChangeText={setThresholdRed}
                placeholder="Ej: 60"
                placeholderTextColor={QcColors.placeholder}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.saveBtn, submitting && styles.saveBtnDisabled]} 
                onPress={saveIndicator} 
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={QcColors.paper} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: QcColors.rule, borderRadius: 8, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: { flex: 1, fontFamily: FontFamilies.body, fontSize: 13, color: QcColors.ink },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: QcColors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6, height: 40 },
  newButtonText: { color: QcColors.paper, fontFamily: FontFamilies.bodyBold, fontSize: 13 },
  loader: { marginTop: 40 },
  row: { paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: QcColors.rule, backgroundColor: QcColors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBody: { flex: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeBadge: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: QcColors.surface2, borderRadius: 4 },
  codeText: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcColors.accentDeep },
  chartType: { fontFamily: FontFamilies.body, fontSize: 9, color: QcColors.inkSoft },
  name: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcColors.ink, marginTop: 6 },
  process: { fontFamily: FontFamilies.body, fontSize: 10, color: QcColors.inkSoft, marginTop: 2 },
  editBtn: { padding: 8 },
  separator: { height: 6 },
  listContent: { paddingBottom: 20 },
  empty: { fontFamily: FontFamilies.body, fontSize: 13, color: QcColors.inkSoft, textAlign: 'center', padding: 40 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: QcColors.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: QcColors.rule },
  modalTitle: { fontFamily: FontFamilies.bodyBold, fontSize: 16, color: QcColors.ink },
  modalBody: { padding: 16 },
  label: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcColors.inkSoft, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: QcColors.rule, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FontFamilies.body, fontSize: 14, color: QcColors.ink, marginBottom: 16, height: 42 },
  
  dropdownMenu: { backgroundColor: QcColors.paper, borderWidth: 1, borderColor: QcColors.rule, borderRadius: 6, marginTop: 4, marginBottom: 16 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: QcColors.rule },
  dropdownItemText: { fontFamily: FontFamilies.body, fontSize: 13, color: QcColors.ink },

  selectGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectBtn: { borderWidth: 1, borderColor: QcColors.rule, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: QcColors.surface },
  selectBtnActive: { backgroundColor: QcColors.surface2, borderColor: QcColors.accent },
  selectBtnText: { fontFamily: FontFamilies.body, fontSize: 12, color: QcColors.inkSoft },
  selectBtnTextActive: { color: QcColors.accentDeep, fontFamily: FontFamilies.bodyBold },
  
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: QcColors.rule },
  saveBtn: { backgroundColor: QcColors.accent, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: QcColors.paper, fontFamily: FontFamilies.bodyBold, fontSize: 14 },

  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: QcColors.paper, padding: 20, borderRadius: 12, minWidth: 250, alignItems: 'center' },
  alertText: { fontFamily: FontFamilies.body, fontSize: 14, color: QcColors.ink, marginBottom: 20, textAlign: 'center' },
  alertBtn: { backgroundColor: QcColors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  alertBtnText: { fontFamily: FontFamilies.bodyBold, color: QcColors.paper, fontSize: 14 }
});

