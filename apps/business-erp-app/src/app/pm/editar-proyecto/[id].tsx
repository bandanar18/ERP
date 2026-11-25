import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PmColors } from '@/features/pm/theme';
import { PmApiError } from '@/features/pm/api/client';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { PmScreenError } from '@/features/pm/components/auth-ui';
import { ProjectForm } from '@/features/pm/components/project-form';
import { goBackSafe } from '@/features/pm/utils/navigation';
import type { CreateProjectDto, Project, UpdateProjectDto } from '@/features/pm/types';

export default function PmEditarProyectoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // No pedir datos hasta que la sesión esté restaurada (evita requests sin token).
    if (status !== 'authenticated') return;
    projectService
      .getById(id)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoadingProject(false));
  }, [id, status]);

  const handleSubmit = async (payload: CreateProjectDto | UpdateProjectDto) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      await projectService.update(id, payload as UpdateProjectDto);
      goBackSafe(router);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Proyectos / Edición"
      title="Editar proyecto"
      copy="Actualizá los datos del proyecto y guardá los cambios."
      onBack={() => goBackSafe(router)}>
      {loadingProject ? (
        <View style={styles.loader}>
          <ActivityIndicator color={PmColors.orange} />
        </View>
      ) : project ? (
        <ProjectForm
          companies={[]}
          loadingCompanies={false}
          initial={project}
          submitLabel="Guardar cambios"
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
        />
      ) : (
        <PmScreenError message="No se encontró el proyecto" />
      )}
    </PmFormShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    paddingTop: 20,
    alignItems: 'center',
  },
});