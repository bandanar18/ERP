import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { PmApiError } from '@/features/pm/api/client';
import { physicalProgressService } from '@/features/pm/api/physical-progress';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { PmButton, PmField, PmScreenError, PmDatePicker } from '@/features/pm/components/auth-ui';
import { goBackSafe } from '@/features/pm/utils/navigation';
import { useNotify } from '@/features/pm/notifications/toast-provider';

export default function PmCrearAvanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useNotify();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actualProgress, setActualProgress] = useState('');
  const [plannedProgress, setPlannedProgress] = useState('');
  const [attentionPoints, setAttentionPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!startDate || !endDate) {
      setError('Las fechas son obligatorias');
      return;
    }
    if (!actualProgress || !plannedProgress) {
      setError('Avance real y planificado son obligatorios');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await physicalProgressService.create({
        projectId: id!,
        date: new Date().toISOString(),
        startDate: startDate,
        endDate: endDate,
        actualProgress,
        plannedProgress,
        attentionPoints: attentionPoints || undefined,
      });
      notify('Avance registrado correctamente', 'success');
      goBackSafe(router);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al crear el avance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Avance físico / Registro"
      title="Registrar avance"
      copy="Registrá el avance real y planificado del proyecto."
      onBack={() => goBackSafe(router)}>
      <PmScreenError message={error} />

      <PmDatePicker
        label="Fecha de Inicio del Periodo"
        value={startDate}
        onChange={setStartDate}
        placeholder="Seleccionar fecha de inicio"
      />
      <PmDatePicker
        label="Fecha de Fin del Periodo"
        value={endDate}
        onChange={setEndDate}
        placeholder="Seleccionar fecha de fin"
      />
      <PmField
        label="Avance real (%)"
        value={actualProgress}
        onChangeText={setActualProgress}
        keyboardType="numeric"
        placeholder="Ej: 45"
      />
      <PmField
        label="Avance planificado (%)"
        value={plannedProgress}
        onChangeText={setPlannedProgress}
        keyboardType="numeric"
        placeholder="Ej: 50"
      />
      <PmField
        label="Puntos de atención (Opcional)"
        value={attentionPoints}
        onChangeText={setAttentionPoints}
        placeholder="Observaciones, retrasos o puntos importantes..."
      />

      <PmButton label="Registrar avance" onPress={handleCreate} loading={loading} />
    </PmFormShell>
  );
}
