import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { PmApiError } from '@/features/pm/api/client';
import { financialService } from '@/features/pm/api/financial';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { PmButton, PmField, PmScreenError, PmDatePicker } from '@/features/pm/components/auth-ui';
import { goBackSafe } from '@/features/pm/utils/navigation';
import { useNotify } from '@/features/pm/notifications/toast-provider';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function PmCrearValuacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useNotify();

  const [valuationNumber, setValuationNumber] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const amount = Number(amountUsd);
    if (!valuationNumber.trim()) {
      setError('El número de valuación es obligatorio');
      return;
    }
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
      await financialService.create({
        projectId: id!,
        valuationNumber: valuationNumber.trim(),
        amountUsd: amount,
        startDate,
        endDate,
      });
      notify('Valuación registrada correctamente', 'success');
      goBackSafe(router);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al crear la valuación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Financiero / Registro"
      title="Crear valuación"
      copy="Registrá una valuación financiera del proyecto."
      onBack={() => goBackSafe(router)}>
      <PmScreenError message={error} />

      <PmField
        label="Número de valuación"
        value={valuationNumber}
        onChangeText={setValuationNumber}
        placeholder="Ej: V-001"
      />
      <PmField
        label="Monto (USD)"
        value={amountUsd}
        onChangeText={setAmountUsd}
        keyboardType="numeric"
        placeholder="Ej: 15000"
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

      <PmButton label="Crear valuación" onPress={handleCreate} loading={loading} />
    </PmFormShell>
  );
}