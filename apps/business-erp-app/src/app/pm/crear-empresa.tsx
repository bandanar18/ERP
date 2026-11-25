import { useRouter } from 'expo-router';
import { useState } from 'react';

import { PmApiError } from '@/features/pm/api/client';
import { companyService } from '@/features/pm/api/companies';
import { galleryService } from '@/features/pm/api/gallery';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { useNotify } from '@/features/pm/notifications/toast-provider';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { CompanyWizard } from '@/features/pm/components/company-wizard';
import { goBackSafe } from '@/features/pm/utils/navigation';
import type { CreateCompanyDto } from '@/features/pm/types';

export default function PmCrearEmpresaScreen() {
  const router = useRouter();
  const { status } = usePmAuth();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: CreateCompanyDto, logo?: File | null) => {
    setLoading(true);
    setError(null);
    try {
      const company = await companyService.create(payload);

      // Logo: la galería necesita el id de la empresa ya creada, así que
      // primero se crea y después se sube el archivo y se fija logoUrl.
      if (logo && company?.id) {
        try {
          const { file } = await galleryService.upload('Company', company.id, logo);
          if (file?.url) {
            await companyService.update(company.id, { logoUrl: file.url });
          }
        } catch (logoError) {
          setError(
            logoError instanceof PmApiError
              ? `Empresa creada, pero el logo no se pudo subir: ${logoError.message}`
              : 'Empresa creada, pero el logo no se pudo subir',
          );
          notify('Empresa registrada correctamente', 'success');
          goBackSafe(router);
          return;
        }
      }

      notify('Empresa registrada correctamente', 'success');
      goBackSafe(router);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Empresas / Nueva"
      title="Nueva empresa"
      copy="Completá los datos paso a paso para registrar una empresa."
      onBack={() => goBackSafe(router)}>
      <CompanyWizard loading={loading} error={error} onSubmit={handleSubmit} />
    </PmFormShell>
  );
}
