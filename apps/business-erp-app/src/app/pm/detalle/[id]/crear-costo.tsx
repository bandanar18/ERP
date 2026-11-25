import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { PmApiError } from '@/features/pm/api/client';
import { costService } from '@/features/pm/api/cost';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { PmButton, PmField, PmScreenError, PmDatePicker } from '@/features/pm/components/auth-ui';
import { goBackSafe } from '@/features/pm/utils/navigation';
import { useNotify } from '@/features/pm/notifications/toast-provider';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function PmCrearCostoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useNotify();

  const [amountUsd, setAmountUsd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const amount = Number(amountUsd);
    if (!amountUsd || Number.isNaN(amount) || amount <= 0) {
      setError('El monto debe ser un número mayor a 0');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError('La fecha de fin no puede ser anterior al inicio');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await costService.create({ projectId: id!, amountUsd: amount, startDate, endDate });
      notify('Costo registrado correctamente', 'success');
      goBackSafe(router);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al crear el costo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Costos / Registro"
      title="Cargar costo"
      copy="Registrá el costo de planificación del proyecto."
      onBack={() => goBackSafe(router)}>
      <PmScreenError message={error} />

      <PmField
        label="Monto (USD)"
        value={amountUsd}
        onChangeText={setAmountUsd}
        keyboardType="numeric"
        placeholder="Ej: 25000"
      />
      <PmDatePicker
        label="Inicio"
        value={startDate}
        onChange={setStartDate}
        placeholder="Seleccionar fecha"
      />
      <PmDatePicker
        label="Fin"
        value={endDate}
        onChange={setEndDate}
        placeholder="Seleccionar fecha"
      />

      <PmButton label="Registrar costo" onPress={handleCreate} loading={loading} />
    </PmFormShell>
  );
}