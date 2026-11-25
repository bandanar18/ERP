import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '../theme';
import { PmButton, PmChips, PmDatePicker, PmField, PmScreenError, PmSelect } from './auth-ui';
import { formatDate, statusLabel } from '../utils/format';
import type {
  Company,
  CreateProjectDto,
  ProjectStatus,
} from '../types';

const STATUS_OPTIONS = (
  ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as ProjectStatus[]
).map((s) => ({ label: statusLabel(s), value: s }));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STEPS = ['Datos básicos', 'Detalle', 'Revisión'] as const;

interface ProjectWizardProps {
  companies: Company[];
  loadingCompanies: boolean;
  loading: boolean;
  error: string | null;
  /** Navega a la pantalla de creación de empresa (para volver con la lista refrescada). */
  onNewCompany: () => void;
  onSubmit: (payload: CreateProjectDto) => void;
}

/**
 * Asistente paso a paso para crear un proyecto (reemplaza el formulario único
 * en la pantalla de creación). 3 pasos con validación por paso:
 * 1) datos básicos (empresa, código, nombres), 2) detalle (descripción,
 * fechas, estado), 3) económico + revisión y crear.
 */
export function ProjectWizard({
  companies,
  loadingCompanies,
  loading,
  error,
  onNewCompany,
  onSubmit,
}: ProjectWizardProps) {
  const [step, setStep] = useState(0);

  const [companyId, setCompanyId] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNED');
  const [offeredAmount, setOfferedAmount] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!companyId) return 'Seleccioná la empresa';
      if (!code.trim()) return 'El código es obligatorio';
      if (!fullName.trim()) return 'El nombre completo es obligatorio';
      return null;
    }
    if (s === 1) {
      if (startDate && !DATE_RE.test(startDate)) return 'Formato de fecha inválido (YYYY-MM-DD)';
      if (endDate && !DATE_RE.test(endDate)) return 'Formato de fecha inválido (YYYY-MM-DD)';
      if (startDate && endDate && startDate > endDate)
        return 'La fecha de fin no puede ser anterior al inicio';
      return null;
    }
    if (s === 2) {
      const amount = Number(offeredAmount);
      if (!offeredAmount || Number.isNaN(amount) || amount <= 0)
        return 'El monto ofertado debe ser un número mayor a 0';
      return null;
    }
    return null;
  };

  const goNext = () => {
    setFieldError(null);
    const problem = validateStep(step);
    if (problem) {
      setFieldError(problem);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => {
    setFieldError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = () => {
    setFieldError(null);
    const problem = validateStep(2);
    if (problem) {
      setFieldError(problem);
      return;
    }
    const payload: CreateProjectDto = {
      companyId,
      code: code.trim(),
      fullName: fullName.trim(),
      shortName: shortName.trim() || undefined,
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
      offeredAmount: Number(offeredAmount),
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    };
    onSubmit(payload);
  };

  const company = companies.find((c) => c.id === companyId);

  return (
    <View>
      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <View key={label} style={styles.stepCol}>
              <View style={[styles.stepSegment, active && styles.stepSegmentActive, done && styles.stepSegmentDone]}>
                {done ? <Text style={styles.stepCheck}>✓</Text> : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.stepCount}>Paso {step + 1} de {STEPS.length}</Text>

      {/* Paso 1: datos básicos */}
      {step === 0 ? (
        <View>
          {loadingCompanies ? (
            <View style={styles.companiesLoading}>
              <ActivityIndicator color={PmColors.orange} />
              <Text style={styles.companiesHint}>Cargando empresas…</Text>
            </View>
          ) : (
            <>
              <PmSelect
                label="Empresa"
                options={companies.map((c) => ({ label: c.name, value: c.id }))}
                selected={companyId}
                onSelect={setCompanyId}
                placeholder="Seleccioná una empresa"
              />
              <Pressable style={({ pressed }) => [styles.newCompany, pressed && styles.pressed]} onPress={onNewCompany}>
                <Text style={styles.newCompanyText}>＋ Nueva empresa</Text>
              </Pressable>
            </>
          )}
          <PmField
            label="Código"
            value={code}
            onChangeText={setCode}
            placeholder="Ej: PRY-2026-001"
            autoCapitalize="characters"
          />
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
        </View>
      ) : null}

      {/* Paso 2: detalle */}
      {step === 1 ? (
        <View>
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
        </View>
      ) : null}

      {/* Paso 3: económico + revisión */}
      {step === 2 ? (
        <View>
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

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            {[
              ['Empresa', company?.name ?? '—'],
              ['Código', code],
              ['Nombre', fullName],
              ['Nombre corto', shortName || '—'],
              ['Descripción', description || '—'],
              ['Inicio', startDate ? formatDate(startDate) : '—'],
              ['Fin', endDate ? formatDate(endDate) : '—'],
              ['Estado', statusLabel(status)],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
          <View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 16 }}>
              <Pressable style={({ pressed }) => [styles.navBtn, styles.navBtnBack, pressed && styles.pressed]} onPress={goBack}>
                <Text style={styles.navBtnBackText}>← Anterior</Text>
              </Pressable>
            </View>
            <PmScreenError message={fieldError ?? error} />
            <PmButton label="Crear proyecto" onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      ) : null}

      {/* Navegación del asistente */}
      {step < 2 ? (
        <View style={styles.nav}>
          {step > 0 ? (
            <Pressable style={({ pressed }) => [styles.navBtn, styles.navBtnBack, pressed && styles.pressed]} onPress={goBack}>
              <Text style={styles.navBtnBackText}>← Anterior</Text>
            </Pressable>
          ) : <View style={styles.navSpacer} />}
          <Pressable style={({ pressed }) => [styles.navBtn, styles.navBtnNext, pressed && styles.pressed]} onPress={goNext}>
            <Text style={styles.navBtnNextText}>Siguiente →</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepSegment: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  stepSegmentActive: {
    borderColor: PmColors.orange,
    backgroundColor: PmColors.orange,
  },
  stepSegmentDone: {
    borderColor: '#4c9b7a',
    backgroundColor: '#4c9b7a',
  },
  stepNum: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.inkSoft,
  },
  stepNumActive: {
    color: '#ffffff',
  },
  stepCheck: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
  stepLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PmColors.inkSoft,
    marginTop: 4,
  },
  stepLabelActive: {
    color: PmColors.orangeDeep,
  },
  stepCount: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmColors.inkSoft,
    marginBottom: 14,
  },
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
  newCompany: {
    alignItems: 'center',
    paddingVertical: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PmColors.orange,
  },
  newCompanyText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: PmColors.orangeDeep,
  },
  pressed: {
    opacity: 0.7,
  },
  multiline: {
    height: 68,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  summary: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
    padding: 12,
  },
  summaryTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: PmColors.divider,
  },
  summaryLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmColors.inkSoft,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmColors.ink,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  navSpacer: {
    flex: 1,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  navBtnBack: {
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  navBtnBackText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.inkSoft,
  },
  navBtnNext: {
    borderColor: PmColors.orange,
    backgroundColor: PmColors.orange,
  },
  navBtnNextText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
});