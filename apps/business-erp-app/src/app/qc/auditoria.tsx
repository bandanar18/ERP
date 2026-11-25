import { Text, View, StyleSheet, ActivityIndicator, Pressable, Platform, ScrollView, Modal } from 'react-native';
import { useState, useCallback, useEffect, createElement } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { qcApi } from '@/features/qc/api/client';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react-native';
interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { email: string; organizationId: string };
  before?: any;
  after?: any;
}

interface AuditPage {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#16a34a',
  UPDATE: '#2563eb',
  DELETE: '#dc2626',
  APPROVE: '#16a34a',
  REJECT: '#dc2626',
  SUBMIT: '#7c3aed',
  REVIEW: '#0284c7',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'CREAR',
  UPDATE: 'ACTUALIZAR',
  DELETE: 'ELIMINAR',
  SUBMIT: 'ENVIAR',
  APPROVE: 'APROBADA',
  REJECT: 'RECHAZADA',
  REVIEW: 'REVISIÓN',
};

interface BadgeInfo {
  label: string;
  color: string;
  bgColor: string;
}

function getActionBadge(log: AuditLog): BadgeInfo {
  const action = (log.action || '').toUpperCase();

  if (action === 'REVIEW') {
    const status = (log.after?.status || log.before?.status || '').toUpperCase();
    if (status === 'APPROVED') {
      return { label: 'APROBADA', color: '#16a34a', bgColor: '#dcfce7' };
    }
    if (status === 'REJECTED') {
      return { label: 'RECHAZADA', color: '#dc2626', bgColor: '#fee2e2' };
    }
    return { label: 'REVISIÓN', color: '#0284c7', bgColor: '#e0f2fe' };
  }

  if (action === 'APPROVE') {
    return { label: 'APROBADA', color: '#16a34a', bgColor: '#dcfce7' };
  }
  if (action === 'REJECT') {
    return { label: 'RECHAZADA', color: '#dc2626', bgColor: '#fee2e2' };
  }
  if (action === 'CREATE') {
    return { label: 'CREAR', color: '#16a34a', bgColor: '#dcfce7' };
  }
  if (action === 'UPDATE') {
    return { label: 'ACTUALIZAR', color: '#2563eb', bgColor: '#dbeafe' };
  }
  if (action === 'DELETE') {
    return { label: 'ELIMINAR', color: '#dc2626', bgColor: '#fee2e2' };
  }
  if (action === 'SUBMIT') {
    return { label: 'ENVIAR', color: '#7c3aed', bgColor: '#ede9fe' };
  }

  return {
    label: ACTION_LABELS[action] || action,
    color: QcOpColors.inkSoft,
    bgColor: '#f1f5f9',
  };
}

function formatEntity(entityType: string): string {
  if (!entityType) return '';
  const normalized = entityType.toUpperCase();
  const map: Record<string, string> = {
    PROCESS: 'Proceso',
    INDICATOR: 'Indicador',
    MEASUREMENT: 'Medición',
    USER: 'Usuario',
    ROLE: 'Rol',
  };
  return map[normalized] ?? (map[entityType] ?? entityType);
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '(vacío)';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'string') {
    const statusMap: Record<string, string> = {
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
      SUBMITTED: 'Enviado',
      PENDING: 'Pendiente',
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
    };
    if (statusMap[val]) return statusMap[val];
  }
  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

const IGNORED_KEYS = ['id', 'processId', 'projectId', 'subprocessId', 'organizationId', 'password', 'userId'];
const KEY_LABELS: Record<string, string> = {
  code: 'Código', name: 'Nombre', description: 'Descripción', chartType: 'Tipo de gráfica',
  frequency: 'Frecuencia', direction: 'Dirección', formula: 'Fórmula', inputMode: 'Modo de entrada',
  targetValue: 'Meta', unit: 'Unidad', displayAsPercent: 'Porcentaje', aggregation: 'Agregación',
  email: 'Correo electrónico', qcRole: 'Rol', value: 'Valor', trafficLight: 'Semáforo',
  observation: 'Observación', analysisInternal: 'Análisis Interno', analysisExternal: 'Análisis Externo',
  status: 'Estado', role: 'Rol', roleCodes: 'Roles', roles: 'Roles',
};

function ObjectList({ data }: { data: any }) {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([k]) => !IGNORED_KEYS.includes(k));
  if (entries.length === 0) return <Text style={styles.diffEmpty}>Sin cambios relevantes</Text>;

  return (
    <View style={{ gap: 4 }}>
      {entries.map(([k, v]) => (
        <Text key={k} style={styles.diffItem}>
          <Text style={styles.diffKey}>{KEY_LABELS[k] || k}: </Text>
          <Text style={styles.diffValue}>{formatValue(v)}</Text>
        </Text>
      ))}
    </View>
  );
}

function AuditDiff({ before, after }: { before: any; after: any }) {
  const [open, setOpen] = useState(false);
  const hasData = (before && Object.keys(before).length > 0) || (after && Object.keys(after).length > 0);

  if (!hasData) return null;

  return (
    <View style={styles.diffContainer}>
      <Pressable onPress={() => setOpen(!open)}>
        <Text style={styles.diffToggleText}>{open ? 'Ocultar detalle' : 'Ver cambios'}</Text>
      </Pressable>
      {open && (
        <View style={styles.diffBox}>
          {before && Object.keys(before).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.diffTitle}>Antes</Text>
              <ObjectList data={before} />
            </View>
          )}
          {after && Object.keys(after).length > 0 && (
            <View>
              <Text style={styles.diffTitle}>Después</Text>
              <ObjectList data={after} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}


function CalendarDatePicker({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => { const d = value ? new Date(`${value}T12:00:00`) : new Date(); return isNaN(d.getTime()) ? new Date() : d; });
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const firstOffset = (new Date(year, month, 1).getDay()+6)%7; const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = [...Array.from({length:firstOffset},()=>null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const display = value ? `${new Date(`${value}T12:00:00`).getDate()} ${MONTHS[new Date(`${value}T12:00:00`).getMonth()]} ${new Date(`${value}T12:00:00`).getFullYear()}` : null;

  if (Platform.OS === 'web') {
    return createElement('input', { type: 'date', value: value || '', onChange: (e: any) => onChange(e.target.value), style: { flex: 1, height: 36, borderRadius: 6, borderWidth: 1, borderColor: '#dce8e0', paddingHorizontal: 10, backgroundColor: 'white', fontFamily: FontFamilies.body, fontSize: 12, outline: 'none', color: QcOpColors.ink } }) as any;
  }
  return (<>
    <Pressable style={styles.dateBtn} onPress={() => setOpen(true)}><Text style={[styles.dateBtnText, !display && { color: QcOpColors.inkSoft }]}>{display ?? placeholder}</Text></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:24 }} onPress={() => setOpen(false)}>
        <Pressable style={{ backgroundColor:'white', borderRadius:12, padding:16 }} onPress={() => {}}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <Pressable onPress={() => setViewDate(new Date(year, month-1,1))}><Text style={{ fontSize:18, color:QcOpColors.ink, padding:4 }}>{'<'}</Text></Pressable>
            <Text style={{ fontFamily:FontFamilies.display, fontSize:15, color:QcOpColors.ink }}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={() => setViewDate(new Date(year, month+1,1))}><Text style={{ fontSize:18, color:QcOpColors.ink, padding:4 }}>{'>'}</Text></Pressable>
          </View>
          <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
            {cells.map((day, i) => {
              if (day===null) return <View key={`p${i}`} style={{ width:'14.28%', height:32 }} />;
              const d = new Date(year, month, day);
              const isSel = selected && sameDay(d, selected);
              return (<Pressable key={day} onPress={() => { onChange(toISO(d)); setOpen(false); }} style={{ width:'14.28%', height:32, alignItems:'center', justifyContent:'center', borderRadius:16, backgroundColor: isSel ? QcOpColors.teal : 'transparent' }}><Text style={{ fontFamily:FontFamilies.body, fontSize:12, color: isSel ? 'white' : QcOpColors.ink }}>{day}</Text></Pressable>);
            })}
          </View>
          <Pressable onPress={() => { onChange(''); setOpen(false); }} style={{ marginTop:8, alignItems:'center', padding:6 }}><Text style={{ fontFamily:FontFamilies.bodyBold, fontSize:12, color:QcOpColors.red }}>Limpiar</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </>);
}

export default function QcAuditoriaScreen() {
  const [pageData, setPageData] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (startsAt) params.startsAt = startsAt;
      if (endsAt) params.endsAt = endsAt;
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      const qs = new URLSearchParams(params).toString();
      const res = await qcApi.get<any>(`/audit-logs?${qs}`);
      setPageData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, startsAt, endsAt, actionFilter, entityTypeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const hasFilters = !!(startsAt || endsAt || actionFilter || entityTypeFilter);

  return (
    <QcAppShell title="Auditoría" subtitle="Registro de actividad" scrollable={false}>
      <View style={styles.filterBar}>
        <Pressable style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters(!showFilters)}>
          <Filter size={14} color={showFilters ? QcOpColors.white : QcOpColors.inkSoft} />
          <Text style={[styles.filterToggleText, showFilters && { color: QcOpColors.white }]}>Filtros</Text>
          {hasFilters && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>!</Text></View>}
        </Pressable>
        {hasFilters && (
          <Pressable onPress={() => { setStartsAt(''); setEndsAt(''); setActionFilter(''); setEntityTypeFilter(''); setPage(1); }}>
            <Text style={styles.clearText}>Limpiar</Text>
          </Pressable>
        )}
      </View>

      {showFilters && (
        <View style={styles.filtersBox}>
          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.filterLabel}>Desde</Text>
              <CalendarDatePicker value={startsAt} onChange={(v) => { setStartsAt(v); setPage(1); }} placeholder="Fecha inicio" />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.filterLabel}>Hasta</Text>
              <CalendarDatePicker value={endsAt} onChange={(v) => { setEndsAt(v); setPage(1); }} placeholder="Fecha fin" />
            </View>
          </View>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Acción</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { val: '', label: 'Todas' },
              { val: 'CREATE', label: 'Crear' },
              { val: 'UPDATE', label: 'Actualizar' },
              { val: 'DELETE', label: 'Eliminar' },
              { val: 'SUBMIT', label: 'Enviar' },
              { val: 'REVIEW', label: 'Revisión' },
              { val: 'APPROVE', label: 'Aprobar' },
              { val: 'REJECT', label: 'Rechazar' },
            ].map(f => (
              <Pressable
                key={f.val}
                style={[styles.filterPill, actionFilter === f.val && styles.filterPillActive]}
                onPress={() => { setActionFilter(f.val); setPage(1); }}
              >
                <Text style={[styles.filterPillText, actionFilter === f.val && styles.filterPillTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Entidad</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { val: '', label: 'Todas' },
              { val: 'Process', label: 'Proceso' },
              { val: 'Indicator', label: 'Indicador' },
              { val: 'Measurement', label: 'Medición' },
              { val: 'User', label: 'Usuario' },
              { val: 'Role', label: 'Rol' },
            ].map(f => (
              <Pressable
                key={f.val}
                style={[styles.filterPill, entityTypeFilter === f.val && styles.filterPillActive]}
                onPress={() => { setEntityTypeFilter(f.val); setPage(1); }}
              >
                <Text style={[styles.filterPillText, entityTypeFilter === f.val && styles.filterPillTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContainer}>
          {(pageData?.data ?? []).map((log: AuditLog) => {
            const badge = getActionBadge(log);
            return (
              <View key={log.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.actionBadge, { backgroundColor: badge.bgColor }]}>
                    <Text style={[styles.actionText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  <Text style={styles.date}>{new Date(log.createdAt).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</Text>
                </View>
                <Text style={styles.userText}>Por {log.actor?.email || 'Sistema'}</Text>
                <Text style={styles.entityText}>{formatEntity(log.entityType)}</Text>
                <AuditDiff before={log.before} after={log.after} />
              </View>
            );
          })}
          {(!pageData || pageData.data.length === 0) && (
            <Text style={styles.empty}>No hay registros de auditoría.</Text>
          )}

          {pageData && pageData.totalPages > 1 && (
            <View style={styles.pagination}>
              <Pressable style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={16} color={page <= 1 ? QcOpColors.rule : QcOpColors.ink} />
              </Pressable>
              <Text style={styles.pageInfo}>{pageData.page} / {pageData.totalPages}</Text>
              <Pressable style={[styles.pageBtn, page >= pageData.totalPages && styles.pageBtnDisabled]} onPress={() => setPage(p => p + 1)} disabled={page >= pageData.totalPages}>
                <ChevronRight size={16} color={page >= pageData.totalPages ? QcOpColors.rule : QcOpColors.ink} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.surface },
  filterToggleActive: { backgroundColor: QcOpColors.teal, borderColor: QcOpColors.teal },
  filterToggleText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft },
  filterBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: QcOpColors.red, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: 'white', fontSize: 10, fontFamily: FontFamilies.bodyBold },
  clearText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.red },

  filtersBox: { backgroundColor: QcOpColors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateCol: { flex: 1 },
  filterLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.inkSoft, marginBottom: 4, textTransform: 'uppercase' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', height: 36, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 6, paddingHorizontal: 10, backgroundColor: QcOpColors.white },
  dateBtnText: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.ink },

  listScroll: { flex: 1 },
  listContainer: { gap: 10, paddingBottom: 20 },
  card: { backgroundColor: QcOpColors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  actionText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, textTransform: 'uppercase' },
  date: { fontFamily: FontFamilies.body, fontSize: 10, color: QcOpColors.inkSoft },
  userText: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.ink },
  entityText: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontFamily: FontFamilies.body, color: QcOpColors.inkSoft },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, paddingBottom: 8 },
  pageBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.surface, alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.ink },

  filterPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.white },
  filterPillActive: { borderColor: QcOpColors.teal, backgroundColor: '#e6f2ed' },
  filterPillText: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft },
  filterPillTextActive: { fontFamily: FontFamilies.bodyBold, color: QcOpColors.teal },

  diffContainer: { marginTop: 12 },
  diffToggleText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.teal, textDecorationLine: 'underline' },
  diffBox: { marginTop: 8, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule },
  diffTitle: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.inkSoft, textTransform: 'uppercase', marginBottom: 6 },
  diffEmpty: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft, fontStyle: 'italic' },
  diffItem: { marginBottom: 4 },
  diffKey: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.ink },
  diffValue: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft },
});
