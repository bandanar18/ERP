import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { useState, createElement } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { reportApi, QcPerformanceReport } from '@/features/qc/api/report';
import { exportApi, ExportFilters } from '@/features/qc/api/export';
import { qcProcessApi } from '@/features/qc/api/dashboard';
import { BuildingIcon, DownloadIcon, FileSpreadsheetIcon, ChevronDownIcon, ChevronUpIcon, XIcon, CheckCircleIcon } from '@/features/qc/components/icons';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { QcProcess } from '@/features/qc/types';

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

const DatePickerInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string; }) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => { const d = value ? new Date(`${value}T12:00:00`) : new Date(); return isNaN(d.getTime()) ? new Date() : d; });
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const firstOffset = (new Date(year, month, 1).getDay()+6)%7; const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = [...Array.from({length:firstOffset},()=>null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const display = value ? `${new Date(`${value}T12:00:00`).getDate()} ${MONTHS_ES[new Date(`${value}T12:00:00`).getMonth()]} ${new Date(`${value}T12:00:00`).getFullYear()}` : null;

  if (Platform.OS === 'web') {
    return createElement('input', { type: 'date', value: value || '', onChange: (e: any) => onChange(e.target.value), style: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#dce8e0', paddingHorizontal: 12, backgroundColor: 'white', fontFamily: FontFamilies.body, fontSize: 13, outline: 'none', color: QcOpColors.ink } }) as any;
  }
  return (<>
    <Pressable style={[styles.mockInput, { flex: 1 }]} onPress={() => setOpen(true)}><Text style={[styles.mockInputText, !display && { color: QcOpColors.inkSoft }]}>{display ?? placeholder}</Text><ChevronDownIcon size={16} color={QcOpColors.inkSoft} /></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:24 }} onPress={() => setOpen(false)}>
        <Pressable style={{ backgroundColor:'white', borderRadius:12, padding:16, maxHeight:'70%' }} onPress={() => {}}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <Pressable onPress={() => setViewDate(new Date(year, month-1,1))}><Text style={{ fontSize:20, color:QcOpColors.ink, padding:4 }}>{'<'}</Text></Pressable>
            <Text style={{ fontFamily:FontFamilies.display, fontSize:16, color:QcOpColors.ink }}>{MONTHS_ES[month]} {year}</Text>
            <Pressable onPress={() => setViewDate(new Date(year, month+1,1))}><Text style={{ fontSize:20, color:QcOpColors.ink, padding:4 }}>{'>'}</Text></Pressable>
          </View>
          <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
            {cells.map((day, i) => {
              if (day===null) return <View key={`p${i}`} style={{ width:'14.28%', height:36 }} />;
              const d = new Date(year, month, day);
              const isSel = selected && sameDay(d, selected);
              return (<Pressable key={day} onPress={() => { onChange(toISO(d)); setOpen(false); }} style={{ width:'14.28%', height:36, alignItems:'center', justifyContent:'center', borderRadius:18, backgroundColor: isSel ? QcOpColors.teal : 'transparent' }}><Text style={{ fontFamily:FontFamilies.body, fontSize:13, color: isSel ? 'white' : QcOpColors.ink }}>{day}</Text></Pressable>);
            })}
          </View>
          <Pressable onPress={() => { onChange(''); setOpen(false); }} style={{ marginTop:12, alignItems:'center', padding:8 }}><Text style={{ fontFamily:FontFamilies.bodyBold, fontSize:13, color:QcOpColors.red }}>Limpiar fecha</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </>);
};

export default function QcReportesScreen() {
  const { isTablet } = useBreakpoint();
  const [filters, setFilters] = useState<ExportFilters>({ chartVariant: 'LINE' });
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);
  
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);
  const hideAlert = () => setAlertMessage(null);

  const { data: report, loading } = useCachedQuery<QcPerformanceReport | null>(
    '/reports/performance',
    async () => {
      const res = await reportApi.performance();
      return (res as any).data || res;
    }
  );

  const { data: processes } = useCachedQuery<QcProcess[]>(
    '/processes',
    async () => {
      const res = await qcProcessApi.list();
      return (res as any).data || res;
    }
  );

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setExporting(format);
    try {
      if (format === 'pdf') {
        await exportApi.pdf(filters);
      } else {
        await exportApi.xlsx(filters);
      }
      setAlertMessage({ title: '¡Éxito!', message: `Informe ${format.toUpperCase()} generado correctamente.` });
      if (Platform.OS !== 'web') { setTimeout(() => setAlertMessage(null), 3000); }
    } catch (e: any) {
      setAlertMessage({ title: 'Error', message: e.message || `Error al generar el informe ${format.toUpperCase()}.` });
    } finally {
      setExporting(null);
    }
  };

  const toggleProcess = (name: string) => {
    setExpandedProcess(prev => prev === name ? null : name);
  };

  if (loading && !report) {
    return (
      <QcAppShell title="Reportes" subtitle="Cargando..." scrollable={false}>
        <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 40 }} />
      </QcAppShell>
    );
  }

  if (!report) {
    return (
      <QcAppShell title="Reportes" subtitle="Exportación y análisis" scrollable={false}>
        <Text style={styles.empty}>No se pudo cargar el reporte.</Text>
      </QcAppShell>
    );
  }

  const processNames = Object.keys(report.byProcess);
  const globalPct = report.totalIndicators > 0 ? Math.round((report.complying / report.totalIndicators) * 100) : 0;
  
  const selectedProcessName = filters.processId 
    ? processes?.find(p => p.id === filters.processId)?.name || 'Proceso Seleccionado' 
    : 'Todos los procesos';

  return (
    <QcAppShell title="Reporte de Gestión" subtitle="Cumplimiento consolidado de indicadores" scrollable={true}>
      
      <View style={styles.exportActions}>
        <Pressable 
          style={styles.exportBtnSecondary} 
          onPress={() => handleExport('xlsx')}
          disabled={exporting !== null}
        >
          {exporting === 'xlsx' ? <ActivityIndicator size="small" color={QcOpColors.inkSoft} /> : <FileSpreadsheetIcon size={16} color={QcOpColors.inkSoft} />}
          <Text style={styles.exportBtnSecondaryText}>Exportar XLSX</Text>
        </Pressable>
        <Pressable 
          style={styles.exportBtnPrimary} 
          onPress={() => handleExport('pdf')}
          disabled={exporting !== null}
        >
          {exporting === 'pdf' ? <ActivityIndicator size="small" color={QcOpColors.white} /> : <DownloadIcon size={16} color={QcOpColors.white} />}
          <Text style={styles.exportBtnPrimaryText}>Exportar PDF</Text>
        </Pressable>
      </View>

      <View style={styles.filtersBox}>
        <Text style={styles.filtersTitle}>Filtros del informe</Text>
        <Text style={styles.filtersSubtitle}>Proceso, rango de fechas y estilo de gráfica</Text>
        
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Proceso</Text>
            <Pressable style={styles.mockInput} onPress={() => setProcessModalVisible(true)}>
              <Text style={styles.mockInputText}>{selectedProcessName}</Text>
              <ChevronDownIcon size={16} color={QcOpColors.inkSoft} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.filterRow, { marginTop: 16 }]}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Rango de fechas</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DatePickerInput 
                placeholder="AAAA-MM-DD (Inicio)"
                value={filters.startsAt || ''}
                onChange={(v) => setFilters(f => ({ ...f, startsAt: v }))}
              />
              <DatePickerInput 
                placeholder="AAAA-MM-DD (Fin)"
                value={filters.endsAt || ''}
                onChange={(v) => setFilters(f => ({ ...f, endsAt: v }))}
              />
            </View>
            <Text style={{ fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft, marginTop: 6 }}>
              Las mediciones se filtran por el período que cubre el rango.
            </Text>
          </View>
        </View>

        <View style={[styles.filterRow, { marginTop: 16 }]}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Tipo de gráfica</Text>
            <View style={styles.chartToggle}>
              <Pressable 
                style={[styles.chartToggleBtn, filters.chartVariant === 'LINE' && styles.chartToggleBtnActive]}
                onPress={() => setFilters(f => ({ ...f, chartVariant: 'LINE' }))}
              >
                <Text style={[styles.chartToggleText, filters.chartVariant === 'LINE' && styles.chartToggleTextActive]}>Línea</Text>
              </Pressable>
              <Pressable 
                style={[styles.chartToggleBtn, filters.chartVariant === 'BAR' && styles.chartToggleBtnActive]}
                onPress={() => setFilters(f => ({ ...f, chartVariant: 'BAR' }))}
              >
                <Text style={[styles.chartToggleText, filters.chartVariant === 'BAR' && styles.chartToggleTextActive]}>Barras</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
          <Text style={styles.summaryValue}>{report.totalIndicators}</Text>
          <Text style={styles.summaryLabel}>Indicadores</Text>
        </View>
        <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet, { borderColor: QcOpColors.green, backgroundColor: '#ecfdf5' }]}>
          <Text style={[styles.summaryValue, { color: QcOpColors.green }]}>{report.complying}</Text>
          <Text style={styles.summaryLabel}>Cumplen</Text>
        </View>
        <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet, { borderColor: QcOpColors.red, backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.summaryValue, { color: QcOpColors.red }]}>{report.notComplying}</Text>
          <Text style={styles.summaryLabel}>No Cumplen</Text>
        </View>
        <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
          <Text style={[styles.summaryValue, { color: QcOpColors.teal }]}>{globalPct}%</Text>
          <Text style={styles.summaryLabel}>Cumplimiento global</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${globalPct}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <BuildingIcon size={18} color={QcOpColors.ink} />
        <Text style={styles.sectionTitle}>Detalle por Proceso</Text>
      </View>

      <View style={styles.processList}>
        {processNames.length > 0 ? (
          processNames.map(name => {
            const items = report.byProcess[name];
            const greenCount = items.filter(i => i.status === 'GREEN').length;
            const pct = items.length > 0 ? Math.round((greenCount / items.length) * 100) : 0;
            const isExpanded = expandedProcess === name;
            
            return (
              <View key={name} style={styles.processCard}>
                <Pressable style={styles.processHeader} onPress={() => toggleProcess(name)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.processName}>{name}</Text>
                    <View style={styles.processStats}>
                      <Text style={styles.processIndCount}>{items.length} indicadores</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 12 }}>
                    <Text style={styles.processPct}>{pct}%</Text>
                    {isExpanded ? <ChevronUpIcon size={20} color={QcOpColors.inkSoft} /> : <ChevronDownIcon size={20} color={QcOpColors.inkSoft} />}
                  </View>
                </Pressable>

                <View style={styles.processBarBg}>
                  <View style={[styles.processBarFill, { width: `${pct}%` }]} />
                </View>

                {isExpanded && (
                  <View style={styles.itemList}>
                    {items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.indicator}</Text>
                        <View style={styles.itemValueRow}>
                          <Text style={styles.itemValue}>{item.value ?? '--'}</Text>
                          <View style={[
                            styles.trafficLight, 
                            { backgroundColor: item.status === 'GREEN' ? QcOpColors.green : item.status === 'RED' ? QcOpColors.red : QcOpColors.yellow }
                          ]} />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>No hay procesos con datos para reportar.</Text>
        )}
      </View>

      {/* Modal Selección de Proceso */}
      <Modal 
        visible={processModalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setProcessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proceso</Text>
              <Pressable onPress={() => setProcessModalVisible(false)} style={styles.modalClose}>
                <XIcon size={20} color={QcOpColors.inkSoft} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <Pressable
                style={styles.modalOption}
                onPress={() => {
                  setFilters(f => ({ ...f, processId: undefined }));
                  setProcessModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>Todos los procesos</Text>
              </Pressable>
              {processes?.map(p => (
                <Pressable
                  key={p.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters(f => ({ ...f, processId: p.id }));
                    setProcessModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Alerta/Descarga */}
      <Modal 
        visible={alertMessage !== null} 
        transparent 
        animationType="fade"
        onRequestClose={() => setAlertMessage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 24, paddingVertical: 32 }]}>
            {alertMessage?.title === 'Error' ? (
              <XIcon size={48} color={QcOpColors.red} />
            ) : (
              <CheckCircleIcon size={48} color={QcOpColors.green} />
            )}
            <Text style={[styles.modalTitle, { marginTop: 16, textAlign: 'center' }]}>{alertMessage?.title}</Text>
            <Text style={{ fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.inkSoft, marginTop: 8, marginBottom: 24, textAlign: 'center' }}>
              {alertMessage?.message}
            </Text>
            <Pressable 
              style={[styles.exportBtnPrimary, { width: '100%' }]} 
              onPress={() => setAlertMessage(null)}
            >
              <Text style={styles.exportBtnPrimaryText}>Aceptar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 24, fontFamily: FontFamilies.body, color: QcOpColors.inkSoft },
  
  exportActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  exportBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, backgroundColor: QcOpColors.accent, borderRadius: 8 },
  exportBtnPrimaryText: { color: QcOpColors.white, fontFamily: FontFamilies.bodyBold, fontSize: 13 },
  exportBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, backgroundColor: QcOpColors.white, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8 },
  exportBtnSecondaryText: { color: QcOpColors.ink, fontFamily: FontFamilies.bodyBold, fontSize: 13 },
  
  filtersBox: { backgroundColor: QcOpColors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: QcOpColors.rule, marginBottom: 24 },
  filtersTitle: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink, marginBottom: 4 },
  filtersSubtitle: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.inkSoft, marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 16 },
  filterGroup: { flex: 1 },
  filterLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft, marginBottom: 8 },
  mockInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: QcOpColors.white, borderWidth: 1, borderColor: '#dce8e0', borderRadius: 8, paddingHorizontal: 12, height: 40 },
  mockInputText: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.ink },
  chartToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4 },
  chartToggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  chartToggleBtnActive: { backgroundColor: QcOpColors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  chartToggleText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft },
  chartToggleTextActive: { color: QcOpColors.ink },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: QcOpColors.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, alignItems: 'center' },
  summaryCardTablet: { minWidth: '22%' },
  summaryValue: { fontFamily: FontFamilies.display, fontSize: 28, color: QcOpColors.ink, marginBottom: 4 },
  summaryLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.inkSoft, textTransform: 'uppercase' },
  
  progressBarBg: { height: 6, backgroundColor: QcOpColors.rule, width: '100%', borderRadius: 3, marginTop: 8 },
  progressBarFill: { height: '100%', backgroundColor: QcOpColors.teal, borderRadius: 3 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink },
  
  processList: { gap: 16, paddingBottom: 24 },
  processCard: { backgroundColor: QcOpColors.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule },
  processHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  processName: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.ink, flex: 1 },
  processStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  processIndCount: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.teal, backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  processPct: { fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.teal },
  processBarBg: { height: 6, backgroundColor: QcOpColors.rule, width: '100%', borderRadius: 3, marginBottom: 12 },
  processBarFill: { height: '100%', backgroundColor: QcOpColors.green, borderRadius: 3 },
  
  itemList: { borderTopWidth: 1, borderTopColor: QcOpColors.rule, paddingTop: 12, gap: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.ink, flex: 1 },
  itemValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemValue: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.ink },
  trafficLight: { width: 10, height: 10, borderRadius: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: {
    backgroundColor: QcOpColors.white,
    borderRadius: 12,
    maxHeight: '80%',
    padding: 20,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: FontFamilies.display, fontSize: 18, color: QcOpColors.ink },
  modalClose: { padding: 4 },
  modalBody: { flexGrow: 0 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: QcOpColors.rule },
  modalOptionText: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
});
