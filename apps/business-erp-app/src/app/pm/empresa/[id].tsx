import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '@/features/pm/theme';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { ProjectCard } from '@/features/pm/components/project-card';
import type { Project } from '@/features/pm/types';

export default function PmEmpresaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = usePmAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    // No pedir datos hasta que la sesión esté restaurada (evita requests sin token).
    if (status !== 'authenticated') return;
    projectService
      .getProjectsByCompany(id)
      .then((data: any) => {
        setProjects(data.projects ?? []);
        setCompanyName(data.company?.name ?? data.projects?.[0]?.company?.name ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, status]);

  return (
    <PmAppShell
      title={companyName || 'Empresa'}
      subtitle={`${projects.length} proyectos`}
      scrollable={false}>
      {loading ? (
        <ActivityIndicator color={PmColors.orange} style={styles.loader} />
      ) : (
        <FlashList
          data={projects}
          keyExtractor={(p, index) => p.id || `project-${index}`}
          renderItem={({ item }) => <ProjectCard project={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>Sin proyectos</Text>}
          estimatedItemSize={120}
        />
      )}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  separator: {
    height: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmColors.inkSoft,
    textAlign: 'center',
    marginTop: 30,
  },
});
