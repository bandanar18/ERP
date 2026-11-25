import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '../theme';
import { PmButton, PmChips, PmDatePicker, PmField, PmScreenError, PmSelect } from './auth-ui';
import { statusLabel } from '../utils/format';
import type {
  Company,
  CreateProjectDto,
  Project,
  ProjectStatus,
  UpdateProjectDto,
} from '../types';

const STATUS_OPTIONS = (
  ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as ProjectStatus[]
).map((s) => ({ label: statusLabel(s), value: s }));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ProjectFormProps {
  /** Lista de empresas (solo se usa al crear; al editar la empresa no cambia). */
  companies: Company[];
  loadingCompanies: boolean;
  /** Si se pasa, el form funciona en modo edición (PUT). */
  initial?: Project;
  submitLabel: string;
  loading: boolean;
  error: string | null;
  onSubmit: (payload: CreateProjectDto | UpdateProjectDto) => void;
}

/**
 * Formulario de proyecto compartido por crear-proyecto y editar-proyecto.
 * En modo edición omite los campos no editables (empresa, código).
 */
export function ProjectForm({
  companies,
  loadingCompanies,
  initial,
  submitLabel,
  loading,
  error,
  onSubmit,
}: ProjectFormProps) {
  const isEdit = Boolean(initial);

  const [companyId, setCompanyId] = useState(initial?.companyId ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [shortName, setShortName] = useState(initial?.shortName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ? initial.startDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.slice(0, 10) : '');
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'PLANNED');
  const [offeredAmount, setOfferedAmount] = useState(initial ? String(initial.offeredAmount) : '');
  const [estimatedCost, setEstimatedCost] = useState(
    initial?.estimatedCost ? String(initial.estimatedCost) : '',
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = () => {
    setFieldError(null);

    if (!fullName.trim()) {
      setFieldError('El nombre completo es obligatorio');
      return;
    }
    const amount = Number(offeredAmount);
    if (!offeredAmount || Number.isNaN(amount) || amount <= 0) {
      setFieldError('El monto ofertado debe ser un número mayor a 0');
      return;
    }
    if (!isEdit && !companyId) {
      setFieldError('Seleccioná la empresa');
      return;
    }
    if (!isEdit && !code.trim()) {
      setFieldError('El código es obligatorio');
      return;
    }
    if (startDate && !DATE_RE.test(startDate)) {
      setFieldError('Formato de fecha inválido (YYYY-MM-DD)');
      return;
    }
    if (endDate && !DATE_RE.test(endDate)) {
      setFieldError('Formato de fecha inválido (YYYY-MM-DD)');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setFieldError('La fecha de fin no puede ser anterior al inicio');
      return;
    }

    if (isEdit) {
      const payload: UpdateProjectDto = {
        fullName: fullName.trim(),
        shortName: shortName.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        offeredAmount: amount,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      };
      onSubmit(payload);
    } else {
      const payload: CreateProjectDto = {
        companyId,
        code: code.trim(),
        fullName: fullName.trim(),
        shortName: shortName.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        offeredAmount: amount,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      };
      onSubmit(payload);
    }
  };

  return (
    <View>
      {isEdit ? null : loadingCompanies ? (
        <View style={styles.companiesLoading}>
          <ActivityIndicator color={PmColors.orange} />
          <Text style={styles.companiesHint}>Cargando empresas…</Text>
        </View>
      ) : (
        <PmSelect
          label="Empresa"
          options={companies.map((c) => ({ label: c.name, value: c.id }))}
          selected={companyId}
          onSelect={setCompanyId}
          placeholder="Seleccioná una empresa"
        />
      )}

      {isEdit ? null : (
        <PmField
          label="Código"
          value={code}
          onChangeText={setCode}
          placeholder="Ej: PRY-2026-001"
          autoCapitalize="characters"
        />
      )}

      <PmField
        label="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Nombre del proyecto"
      />
      <PmField
        label="Nombre corto"
        value={shortName}
        onChangeText={setShortName}
        placeholder="Opcional — alias breve"
      />
      <PmField
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        placeholder="Opcional — detalle del proyecto"
        multiline
        numberOfLines={3}
        style={styles.multiline}
      />
      <PmDatePicker
        label="Inicio"
        value={startDate}
        onChange={setStartDate}
        placeholder="Seleccioná la fecha de inicio"
      />
      <PmDatePicker
        label="Fin"
        value={endDate}
        onChange={setEndDate}
        placeholder="Seleccioná la fecha de fin"
      />
      <PmChips
        label="Estado"
        options={STATUS_OPTIONS}
        selected={status}
        onSelect={(value) => setStatus(value as ProjectStatus)}
      />
      <PmField
        label="Monto ofertado (USD)"
        value={offeredAmount}
        onChangeText={setOfferedAmount}
        keyboardType="numeric"
        placeholder="Ej: 150000"
      />
      <PmField
        label="Costo estimado (USD)"
        value={estimatedCost}
        onChangeText={setEstimatedCost}
        keyboardType="numeric"
        placeholder="Opcional — Ej: 120000"
      />

      <PmScreenError message={fieldError ?? error} />
      <PmButton label={submitLabel} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  companiesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  companiesHint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmColors.inkSoft,
  },
  multiline: {
    height: 68,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
});