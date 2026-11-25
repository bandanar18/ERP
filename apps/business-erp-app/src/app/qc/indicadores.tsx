import { Text, View, StyleSheet, ActivityIndicator, Pressable, TextInput, FlatList } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { qcApi } from '@/features/qc/api/client';
import { SearchIcon, LayoutList, LayoutGrid } from 'lucide-react-native';
import { useQcPermission } from '@/features/qc/hooks/usePermission';
import { useRouter } from 'expo-router';
import { useViewMode } from '@/features/qc/hooks/useViewMode';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import { useCachedQuery } from '@/hooks/useCachedQuery';

const QC_FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  PROJECT_BASED: 'Por Proyecto',
};

export default function QcIndicadoresScreen() {
  const [search, setSearch] = useState('');
  const { canManageIndicators } = useQcPermission();
  const router = useRouter();
  const { isTablet } = useBreakpoint();

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const { viewMode, setViewMode } = useViewMode();

  const { data: indicators = [], loading, refetch: loadData } = useCachedQuery(
    '/dashboard/matrix',
    async () => {
      const res = await qcApi.get<any>('/dashboard/matrix');
      return res.data || res;
    }
  );

  const filtered = useMemo(() => {
    return (indicators as any[]).filter((i: any) => 
      i.name.toLowerCase().includes(search.toLowerCase()) || 
      i.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [indicators, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginatedData = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const handleEndReached = () => {
    if (page * PAGE_SIZE < filtered.length) {
      setPage(p => p + 1);
    }
  };

  const renderItem = ({ item: ind }: { item: any }) => {
    const freq = QC_FREQUENCY_LABELS[ind.frequency ?? ''] ?? ind.frequency ?? 'Sin frecuencia';
    const target = ind.targetValue;
    const unit = ind.unit;
    const targetStr = target != null
      ? `${target}${unit === 'PERCENTAGE' || unit === '%' ? '%' : unit ? ` ${unit}` : ''}`
      : 'Sin meta';

    if (viewMode === 'list') {
      return (
        <Pressable style={styles.listItem} onPress={() => router.push(`/qc/indicador/${ind.id}`)}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{ind.code}</Text>
          </View>
          <Text style={styles.listName} numberOfLines={1}>{ind.name}</Text>
          <Text style={styles.goalText}>
            {target != null ? `Meta: ${targetStr}` : 'Sin meta'}
          </Text>
        </Pressable>
      );
    }

    return (
      <View style={viewMode === 'cards' && isTablet ? styles.cardCell : undefined}>
        <Pressable style={styles.card} onPress={() => router.push(`/qc/indicador/${ind.id}`)}>
          <View style={styles.cardHeader}>
            <Text style={styles.name} numberOfLines={2}>{ind.name}</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{ind.code}</Text>
            </View>
          </View>

          <View style={styles.processBox}>
            <View style={styles.processBadge}>
              <Text style={styles.processCode}>{ind.processCode || 'PROC'}</Text>
            </View>
            <Text style={styles.processName} numberOfLines={1}>{ind.process || 'Proceso no asignado'}</Text>
          </View>

          <View style={styles.detailsBox}>
            <Text style={styles.freqText}>{freq}</Text>
            <Text style={styles.goalText}>{targetStr}</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <QcAppShell title="Matriz de Indicadores" subtitle="Fórmulas, umbrales y metas" scrollable={false}>
      <View style={styles.headerRow}>
        <View style={styles.searchBox}>
          <SearchIcon size={16} color={QcOpColors.inkSoft} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar por código o nombre..."
            placeholderTextColor={QcOpColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Pressable 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} 
            onPress={() => setViewMode('list')}
          >
            <LayoutList size={18} color={viewMode === 'list' ? QcOpColors.white : QcOpColors.inkSoft} />
          </Pressable>
          <Pressable 
            style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]} 
            onPress={() => setViewMode('cards')}
          >
            <LayoutGrid size={18} color={viewMode === 'cards' ? QcOpColors.white : QcOpColors.inkSoft} />
          </Pressable>
        </View>

      </View>

      {loading ? (
        <ActivityIndicator color={QcOpColors.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          key={`${viewMode}-${isTablet ? 'tablet' : 'phone'}`}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={viewMode === 'cards' && isTablet ? 2 : 1}
          columnWrapperStyle={viewMode === 'cards' && isTablet ? styles.columnWrapper : undefined}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            filtered.length === 0 ? <Text style={styles.empty}>No hay indicadores registrados.</Text> : null
          }
        />
      )}
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: QcOpColors.surface, borderWidth: 1, borderColor: QcOpColors.rule, paddingHorizontal: 12, height: 44, borderRadius: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
  toggleContainer: { flexDirection: 'row', borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.surface, height: 44, borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: QcOpColors.ink },
  listContainer: { gap: 12, paddingBottom: 20 },
  columnWrapper: { gap: 12 },
  cardCell: { flex: 1 },
  
  card: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  name: { flex: 1, fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.ink, lineHeight: 18 },
  codeBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6 },
  codeText: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: '#475569', textTransform: 'uppercase' },
  
  processBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  processBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  processCode: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.green },
  processName: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, flex: 1 },
  
  detailsBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  freqText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft },
  goalText: { fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.ink },

  listItem: { backgroundColor: QcOpColors.surface, padding: 12, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  listName: { flex: 1, fontFamily: FontFamilies.display, fontSize: 14, color: QcOpColors.ink },
  
  empty: { textAlign: 'center', marginTop: 24, fontFamily: FontFamilies.body, color: QcOpColors.inkSoft },
});
