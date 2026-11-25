import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { PmApiError } from '@/features/pm/api/client';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { useNotify } from '@/features/pm/notifications/toast-provider';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { ProjectWizard } from '@/features/pm/components/project-wizard';
import { goBackSafe } from '@/features/pm/utils/navigation';
import type { Company, CreateProjectDto } from '@/features/pm/types';

export default function PmCrearProyectoScreen() {
  const router = useRouter();
  const { status } = usePmAuth();
  const { notify } = useNotify();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(() => {
    projectService
      .getCompanies()
      .then((data) => setCompanies(data.companies ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingCompanies(false));
  }, []);

  // No pedir datos hasta que la sesión esté restaurada (evita requests sin token).
  useEffect(() => {
    if (status !== 'authenticated') return;
    loadCompanies();
  }, [status, loadCompanies]);

  // Al volver de "Nueva empresa" del asistente, refresca la lista de empresas.
  useFocusEffect(
    useCallback(() => {
      if (status !== 'authenticated') return;
      loadCompanies();
    }, [status, loadCompanies]),
  );

  const handleSubmit = async (payload: CreateProjectDto) => {
    setLoading(true);
    setError(null);
    try {
      await projectService.create(payload);
      notify('Proyecto creado con éxito', 'success');
      goBackSafe(router);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Proyectos / Nuevo"
      title="Nuevo proyecto"
      copy="Completá los datos paso a paso para crear un proyecto del módulo."
      onBack={() => goBackSafe(router)}>
      <ProjectWizard
        companies={companies}
        loadingCompanies={loadingCompanies}
        loading={loading}
        error={error}
        onNewCompany={() => router.push('/pm/crear-empresa')}
        onSubmit={handleSubmit}
      />
    </PmFormShell>
  );
}

