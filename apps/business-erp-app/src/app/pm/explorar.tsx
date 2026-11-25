import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '@/features/pm/theme';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { ProjectCard } from '@/features/pm/components/project-card';
import { BuildingIcon, FolderPlusIcon } from '@/features/pm/components/icons';
import { canManage, roleLabel } from '@/features/pm/utils/roles';
import type { Project } from '@/features/pm/types';
import { useCachedQuery } from '@/hooks/useCachedQuery';

export default function PmExplorarScreen() {
  const router = useRouter();
  const { user, status } = usePmAuth();
  const { isTablet } = useBreakpoint();
  const [search, setSearch] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  const { data: projects = [], loading } = useCachedQuery(
    '/pm/projects',
    async () => {
      if (status !== 'authenticated') return [];
      const data = await projectService.getAll(true);
      return data.projects ?? [];
    }
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.company?.name?.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const renderItem = useCallback(({ item }: { item: Project }) => <ProjectCard project={item} />, []);
  const keyExtractor = useCallback((p: Project, index: number) => p.id || `project-${index}`, []);
  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  return (
    <PmAppShell
      title="Explorar"
      subtitle={`${roleLabel(user?.roles ?? [])} \u2022 ${filtered.length} proyectos`}
      scrollable={false}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por código, nombre o empresa"
          placeholderTextColor={PmOpColors.placeholder}
        />
      </View>

      {canManage(user?.roles ?? []) ? (
        <>
          {/* Fondo táctil que cierra el menú del FAB */}
          {fabOpen ? <Pressable style={styles.fabOverlay} onPress={() => setFabOpen(false)} /> : null}

          {/* Menú desplegable del FAB */}
          {fabOpen ? (
            <View style={styles.fabMenu}>
              <Pressable
                style={({ pressed }) => [styles.fabMenuItem, pressed && styles.pressed]}
                onPress={() => router.push('/pm/crear-proyecto')}>
                <FolderPlusIcon size={16} color={PmOpColors.orangeDeep} />
                <Text style={styles.fabMenuItemText}>Nuevo proyecto</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.fabMenuItem, pressed && styles.pressed]}
                onPress={() => router.push('/pm/crear-empresa')}>
                <BuildingIcon size={16} color={PmOpColors.orangeDeep} />
                <Text style={styles.fabMenuItemText}>Nueva empresa</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Botón flotante de acción */}
          <Pressable
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            onPress={() => setFabOpen((o) => !o)}>
            <Text style={styles.fabPlus}>{fabOpen ? '\u00D7' : '+'}</Text>
          </Pressable>
        </>
      ) : null}

      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : (
        <FlatList
          key={isTablet ? 'grid' : 'list'}
          data={filtered}
          numColumns={isTablet ? 2 : 1}
          keyExtractor={(p, index) => p.id || `project-${index}`}
          renderItem={({ item }) => (
            <View style={styles.cardCell}>
              <ProjectCard project={item} />
            </View>
          )}
          columnWrapperStyle={isTablet ? styles.gridRow : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}

          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No hay proyectos</Text>}
          estimatedItemSize={120}
        />
      )}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: 12,
  },
  search: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    color: PmOpColors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  newButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PmOpColors.orange,
    backgroundColor: PmOpColors.surface,
    padding: 13,
  },
  newButtonText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
    textAlign: 'center',
  },
  /* Botón flotante de acción (FAB) */
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,20,22,0.25)',
    zIndex: 20,
  },
  fabMenu: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    minWidth: 200,
    zIndex: 30,
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.18)',
    elevation: 6,
    overflow: 'hidden',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PmOpColors.rule,
  },
  fabMenuItemText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: PmOpColors.ink,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PmOpColors.orange,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 8,
    zIndex: 30,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabPlus: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 26,
    color: '#ffffff',
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.7,
  },
  loader: {
    marginTop: 40,
  },
  separator: {
    height: 10,
  },
  /* Grid tablet: celdas que estiran el card a la mitad del ancho */
  cardCell: {
    flex: 1,
  },
  gridRow: {
    gap: 10,
  },
  listContent: {
    paddingBottom: 90,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
    marginTop: 30,
  },
});

