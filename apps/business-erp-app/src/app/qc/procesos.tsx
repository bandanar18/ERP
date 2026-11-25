import { Text, View, StyleSheet, FlatList, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { qcApi } from '@/features/qc/api/client';
import { BuildingIcon, FolderIcon, PlusIcon, EditIcon, XIcon, SearchIcon } from '@/features/qc/components/icons';
import { LayoutGrid as LayoutGridIcon, List as ListIcon } from 'lucide-react-native';
import { Modal, TextInput } from 'react-native';
import { adminApi } from '@/features/qc/api/admin';
import { useViewMode } from '@/features/qc/hooks/useViewMode';
import { useCachedQuery } from '@/hooks/useCachedQuery';

export default function QcProcesosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProcess, setEditingProcess] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', name: '', parentId: null as string | null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, setViewMode } = useViewMode();
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: processes = [], loading, refetch: loadProcesses } = useCachedQuery(
    '/admin/processes',
    async () => {
      const res = await qcApi.get<any>('/admin/processes');
      return res.data || res;
    }
  );

  const [parentSelectorOpen, setParentSelectorOpen] = useState(false);

  const handleOpenModal = (process: any = null, parentId: string | null = null) => {
    if (process) {
      setEditingProcess(process);
      setFormData({ code: process.code, name: process.name, parentId: process.parentId ?? parentId });
    } else {
      setEditingProcess(null);
      setFormData({ code: '', name: '', parentId });
    }
    setParentSelectorOpen(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) return;
    try {
      setIsSubmitting(true);
      if (editingProcess) {
        await adminApi.updateProcess(editingProcess.id, formData);
      } else {
        await adminApi.createProcess(formData);
      }
      setModalVisible(false);
      loadProcesses();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProcesses = useMemo(() => {
    if (!searchQuery.trim()) return processes;
    const lowerQuery = searchQuery.toLowerCase();
    
    return processes.map(p => {
      const processMatch = (p.name || '').toLowerCase().includes(lowerQuery) || (p.code || '').toLowerCase().includes(lowerQuery);
      
      const matchedChildren = (p.children || []).filter((sub: any) => 
        (sub.name || '').toLowerCase().includes(lowerQuery) || (sub.code || '').toLowerCase().includes(lowerQuery)
      );

      if (processMatch || matchedChildren.length > 0) {
        return {
          ...p,
          children: processMatch ? p.children : matchedChildren
        };
      }
      return null;
    }).filter(Boolean);
  }, [processes, searchQuery]);

  const paginatedData = useMemo(() => {
    return filteredProcesses.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredProcesses, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  return (
    <QcAppShell title="Procesos" hideTitle={true} scrollable={false}>
      {loading ? (
        <ActivityIndicator color={QcOpColors.accent} style={{ marginTop: 40 }} />
      ) : (
        
      <>
        <View style={styles.customPageHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Estructura de procesos</Text>
            <Text style={styles.pageSubtitle}>Jerarquía de procesos y subprocesos del sistema de gestión de calidad</Text>
          </View>
          <Pressable style={styles.addButtonHeader} onPress={() => handleOpenModal()}>
            <PlusIcon size={16} color="#fff" />
            <Text style={styles.addButtonText}>Nuevo proceso</Text>
          </Pressable>
        </View>

        <View style={styles.actionHeader}>
          <View style={styles.searchWrapper}>
            <SearchIcon size={18} color={QcOpColors.inkSoft} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Buscar por código o nombre..."
              placeholderTextColor={QcOpColors.inkSoft}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.headerActions}>
            <Text style={styles.countText}>
              {processes.length} {processes.length === 1 ? 'proceso raíz' : 'procesos raíz'}
            </Text>
            <View style={styles.toggleGroup}>
              <Pressable 
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
                onPress={() => setViewMode('list')}
              >
                <ListIcon size={18} color={viewMode === 'list' ? '#fff' : QcOpColors.inkSoft} />
              </Pressable>
              <Pressable 
                style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleActive]}
                onPress={() => setViewMode('cards')}
              >
                <LayoutGridIcon size={18} color={viewMode === 'cards' ? '#fff' : QcOpColors.inkSoft} />
              </Pressable>
            </View>
          </View>
        </View>

        <FlatList
          key={viewMode}
          data={paginatedData}
          keyExtractor={(p) => p.id}
          numColumns={viewMode === 'cards' ? 2 : 1}
          contentContainerStyle={viewMode === 'cards' ? styles.gridContainer : styles.listContainer}
          columnWrapperStyle={viewMode === 'cards' ? { justifyContent: 'space-between', gap: 12 } : undefined}
          onEndReached={() => setPage((p) => p + 1)}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            filteredProcesses.length === 0 ? (
              <Text style={styles.empty}>No se encontraron procesos.</Text>
            ) : null
          }
          renderItem={({ item: p }) => (
            <View style={viewMode === 'cards' ? styles.processCardGrid : styles.processCardList}>
              <View style={viewMode === 'cards' ? styles.processHeaderGrid : styles.processHeaderList}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <BuildingIcon size={viewMode === 'cards' ? 24 : 20} color={QcOpColors.ink} />
                  <Text style={viewMode === 'cards' ? styles.processNameGrid : styles.processNameList} numberOfLines={viewMode === 'cards' ? 2 : 1}>
                    {p.name} ({p.code})
                  </Text>
                </View>
                <Pressable onPress={() => handleOpenModal(p, null)} style={styles.editBtn}>
                  <EditIcon size={16} color={QcOpColors.inkSoft} />
                </Pressable>
              </View>

              {p.children?.length > 0 ? (
                <View style={styles.subList}>
                  {viewMode === 'list' && <Text style={styles.subTitle}>Subprocesos ({p.children.length})</Text>}
                  {p.children.map((sub: any) => (
                    <View key={sub.id} style={viewMode === 'cards' ? styles.subCardGrid : styles.subCardList}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <FolderIcon size={16} color={QcOpColors.inkSoft} />
                        <Text style={viewMode === 'cards' ? styles.subNameGrid : styles.subNameList} numberOfLines={1}>
                          {sub.name} ({sub.code})
                        </Text>
                      </View>
                      <Pressable onPress={() => handleOpenModal(sub, p.id)} style={styles.editBtn}>
                        <EditIcon size={14} color={QcOpColors.inkSoft} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptySub}>Sin subprocesos</Text>
              )}
            </View>
          )}
        />
      </>
      )}
    
      {/* Modal CRUD */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProcess ? 'Editar' : 'Nuevo'} {formData.parentId ? 'Subproceso' : 'Proceso'}</Text>
              <Pressable onPress={() => setModalVisible(false)}><XIcon size={20} color={QcOpColors.ink} /></Pressable>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Código</Text>
              <TextInput style={styles.input} value={formData.code} onChangeText={t => setFormData({...formData, code: t})} placeholder="Ej: PRO-01" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({...formData, name: t})} placeholder="Ej: Gestión Humana" />
            </View>

            <View style={[styles.formGroup, { zIndex: 10 }]}>
              <Text style={styles.label}>Proceso padre (opcional)</Text>
              <Pressable 
                style={[styles.input, styles.selectBtn]} 
                onPress={() => setParentSelectorOpen(!parentSelectorOpen)}
              >
                <Text style={formData.parentId ? styles.selectText : styles.selectPlaceholder}>
                  {formData.parentId 
                    ? processes.find((p: any) => p.id === formData.parentId)?.name || 'Proceso seleccionado' 
                    : 'Sin padre (proceso raíz)'}
                </Text>
              </Pressable>
              
              {parentSelectorOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                    <Pressable 
                      style={styles.dropdownItem} 
                      onPress={() => { setFormData({ ...formData, parentId: null }); setParentSelectorOpen(false); }}>
                      <Text style={styles.dropdownItemText}>Sin padre (proceso raíz)</Text>
                    </Pressable>
                    {processes.filter((p: any) => p.id !== editingProcess?.id).map((p: any) => (
                      <Pressable 
                        key={p.id} 
                        style={styles.dropdownItem} 
                        onPress={() => { setFormData({ ...formData, parentId: p.id }); setParentSelectorOpen(false); }}>
                        <Text style={styles.dropdownItemText}>{p.code} · {p.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, (!formData.name || !formData.code || isSubmitting) && { opacity: 0.5 }]} onPress={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  customPageHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 16 },
  pageTitle: { fontFamily: FontFamilies.display, fontSize: 28, color: QcOpColors.ink },
  pageSubtitle: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginTop: 4, paddingRight: 12 },
  addButtonHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: QcOpColors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  countText: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.inkSoft },
  
  actionHeader: { flexDirection: 'column', gap: 12, marginBottom: 16, paddingHorizontal: 16 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleGroup: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  toggleActive: { backgroundColor: QcOpColors.accent },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: QcOpColors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  addButtonText: { color: '#fff', fontFamily: FontFamilies.bodyBold, fontSize: 13 },
  
  listContainer: { paddingBottom: 24, gap: 16, paddingHorizontal: 16 },
  gridContainer: { paddingBottom: 24, gap: 12, paddingHorizontal: 16 },

  processCardList: { backgroundColor: QcOpColors.surface, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, padding: 16 },
  processCardGrid: { backgroundColor: QcOpColors.surface, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, padding: 12, width: '48%' },
  
  processHeaderList: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: QcOpColors.rule, justifyContent: 'space-between' },
  processHeaderGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: QcOpColors.rule, justifyContent: 'space-between' },
  
  processNameList: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink },
  processNameGrid: { fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.ink },
  
  subTitle: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft, textTransform: 'uppercase', marginBottom: 8 },
  subList: { gap: 8 },
  
  subCardList: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: QcOpColors.rule, justifyContent: 'space-between' },
  subCardGrid: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: QcOpColors.rule, justifyContent: 'space-between' },
  
  subNameList: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink, flex: 1 },
  subNameGrid: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.ink, flex: 1 },

  emptySub: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.inkSoft, fontStyle: 'italic' },
  empty: { textAlign: 'center', fontFamily: FontFamilies.body, color: QcOpColors.inkSoft, marginTop: 40, width: '100%' },

  editBtn: { padding: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: FontFamilies.display, fontSize: 18, color: QcOpColors.ink },
  formGroup: { marginBottom: 16 },
  label: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.inkSoft, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
  selectBtn: { justifyContent: 'center', paddingVertical: 0, height: 42 },
  selectText: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
  selectPlaceholder: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.inkSoft },
  dropdownMenu: { position: 'absolute', top: 72, left: 0, right: 0, zIndex: 9999, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 6, backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: QcOpColors.rule },
  dropdownItemText: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: QcOpColors.inkSoft },
  saveBtn: { backgroundColor: QcOpColors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  saveBtnText: { fontFamily: FontFamilies.bodyBold, fontSize: 14, color: '#fff' },
});
