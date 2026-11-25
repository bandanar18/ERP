import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/features/executive/components/ui/button';
import { Input } from '@/features/executive/components/ui/input';
import { Label } from '@/features/executive/components/ui/label';
import { Badge } from '@/features/executive/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/features/executive/components/ui/dialog';
import { useAuthStore } from '../../shared/store/auth.store';
import { apiFetch } from '../../shared/api/api-client';
import { apiUrl } from '../../shared/api/config';
import {
  Target, Plus, Search, Pencil, CheckCircle2,
  ArrowRight, ArrowLeft, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column, type TableActions } from '../../components/mvpblocks/ui/data-table';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';

/* ─── Types ─── */

interface Process {
  id: string;
  code: string;
  name: string;
}

interface IndicatorRow {
  id: string;
  code: string;
  name: string;
  process: { id: string; code: string; name: string } | null;
  versions: {
    frequency: string;
    direction: string;
    formula: string | null;
    targets: { targetValue: number; unit: string; thresholds: Record<string, number> }[];
  }[];
  createdAt: string;
}

const freqLabel: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  PROJECT_BASED: 'Por Proyecto',
};

const dirLabel: Record<string, string> = {
  AT_LEAST: 'Mayor es mejor',
  AT_MOST: 'Menor es mejor',
  RANGE: 'Rango',
};

const ITEMS_PER_PAGE = 15;

/* ─── Wizard step components ─── */

const steps = [
  { key: 'identification', title: 'Identificación', description: 'Código, nombre y proceso del indicador.' },
  { key: 'definition', title: 'Definición técnica', description: 'Frecuencia, dirección y fórmula.' },
  { key: 'target', title: 'Meta y semáforo', description: 'Valor objetivo, unidad y umbrales.' },
  { key: 'confirm', title: 'Confirmación', description: 'Revisa todos los datos antes de crear.' },
];

interface WizardState {
  code: string;
  name: string;
  processId: string;
  frequency: string;
  direction: string;
  formula: string;
  inputMode: string;
  chartType: string;
  targetValue: string;
  unit: string;
  thresholdsGreen: string;
  thresholdsYellow: string;
  thresholdsOrange: string;
  thresholdsRed: string;
}

const initialWizard: WizardState = {
  code: '',
  name: '',
  processId: '',
  frequency: 'MONTHLY',
  direction: 'AT_LEAST',
  formula: '',
  inputMode: 'DIRECT_VALUE',
  chartType: 'LINE',
  targetValue: '',
  unit: '%',
  thresholdsGreen: '',
  thresholdsYellow: '',
  thresholdsOrange: '',
  thresholdsRed: '',
};

/* ─── Main page ─── */

export const AdminIndicatorsPage: React.FC = () => {
  useAuthStore();
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizard, setWizard] = useState<WizardState>(initialWizard);
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});
  // Edit wizard state
  const [editingIndicator, setEditingIndicator] = useState<IndicatorRow | null>(null);
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [editWizardStep, setEditWizardStep] = useState(0);
  const [editWizard, setEditWizard] = useState<WizardState>(initialWizard);
  const [editWizardErrors, setEditWizardErrors] = useState<Record<string, string>>({});

  const fetchIndicators = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [indRes, procRes] = await Promise.all([
        apiFetch(apiUrl('/admin/indicators')),
        apiFetch(apiUrl('/admin/processes')),
      ]);
      const indData = await indRes.json();
      const procData = await procRes.json();
      setIndicators(indData);
      setProcesses(procData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar indicadores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  const filtered = useMemo(() =>
    indicators.filter((ind) =>
      ind.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ind.process?.name || '').toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    [indicators, searchTerm],
  );

  const fmtDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  // Pagination
  const { totalPages, paginatedItems } = usePagination(filtered, ITEMS_PER_PAGE);
  const visibleItems = paginatedItems(page);

  useEffect(() => { setPage(1); }, [searchTerm]);
  useEffect(() => { if (page > totalPages) setPage(Math.max(totalPages, 1)); }, [page, totalPages]);

  const openEditWizard = (ind: IndicatorRow) => {
    const v = ind.versions?.[0];
    const t = v?.targets?.[0];
    const thresholds = (t?.thresholds ?? {}) as Record<string, number>;
    setEditingIndicator(ind);
    setEditWizard({
      code: ind.code,
      name: ind.name,
      processId: ind.process?.id || '',
      frequency: v?.frequency || 'MONTHLY',
      direction: v?.direction || 'AT_LEAST',
      formula: v?.formula || '',
      inputMode: 'DIRECT_VALUE', // no exposed in list; default safe
      chartType: 'LINE',         // no exposed in list; default safe
      targetValue: t?.targetValue != null ? String(t.targetValue) : '',
      unit: t?.unit || '%',
      thresholdsGreen: thresholds.green != null ? String(thresholds.green) : '',
      thresholdsYellow: thresholds.yellow != null ? String(thresholds.yellow) : '',
      thresholdsOrange: thresholds.orange != null ? String(thresholds.orange) : '',
      thresholdsRed: thresholds.red != null ? String(thresholds.red) : '',
    });
    setEditWizardStep(0);
    setEditWizardErrors({});
    setEditWizardOpen(true);
  };

  // Edit action for indicators
  const indicatorActions: TableActions<IndicatorRow> = {
    label: '',
    render: (ind: IndicatorRow) => (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.stopPropagation(); openEditWizard(ind); }}
        title="Editar"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  };

  const updateEditWizard = (field: keyof WizardState, value: string) => {
    setEditWizard((prev) => ({ ...prev, [field]: value }));
    if (editWizardErrors[field]) {
      setEditWizardErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validateEditStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    if (step === 0) {
      if (!editWizard.name.trim()) errors.name = 'El nombre es obligatorio.';
      if (!editWizard.processId) errors.processId = 'Selecciona un proceso.';
    }
    if (step === 1) {
      if (!editWizard.frequency) errors.frequency = 'Selecciona una frecuencia.';
      if (!editWizard.direction) errors.direction = 'Selecciona una dirección.';
    }
    if (step === 2) {
      const tv = parseFloat(editWizard.targetValue);
      if (isNaN(tv) || tv < 0) errors.targetValue = 'Ingresa un valor objetivo válido.';
      if (!editWizard.unit.trim()) errors.unit = 'Ingresa la unidad de medida.';
      const g = parseFloat(editWizard.thresholdsGreen);
      if (isNaN(g)) errors.thresholdsGreen = 'El umbral verde es obligatorio.';
    }
    setEditWizardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextEditStep = () => { if (validateEditStep(editWizardStep)) setEditWizardStep((s) => Math.min(s + 1, steps.length - 1)); };
  const prevEditStep = () => setEditWizardStep((s) => Math.max(s - 1, 0));

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingIndicator) return;
    if (!validateEditStep(2)) { setEditWizardStep(2); return; }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: editWizard.name.trim(),
        processId: editWizard.processId || undefined,
        chartType: editWizard.chartType || undefined,
        frequency: editWizard.frequency || undefined,
        direction: editWizard.direction || undefined,
        formula: editWizard.formula.trim() || null,
        inputMode: editWizard.inputMode || undefined,
        targetValue: parseFloat(editWizard.targetValue),
        unit: editWizard.unit.trim(),
        thresholds: {
          green: parseFloat(editWizard.thresholdsGreen),
          ...(editWizard.thresholdsYellow.trim() && { yellow: parseFloat(editWizard.thresholdsYellow) }),
          ...(editWizard.thresholdsOrange.trim() && { orange: parseFloat(editWizard.thresholdsOrange) }),
          ...(editWizard.thresholdsRed.trim() && { red: parseFloat(editWizard.thresholdsRed) }),
        },
      };

      await apiFetch(apiUrl(`/admin/indicators/${editingIndicator.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast.success('Indicador actualizado', {
        description: `Los cambios en ${editingIndicator.code} fueron guardados. Se creó una nueva versión técnica.`,
      });
      setEditWizardOpen(false);
      setEditingIndicator(null);
      fetchIndicators();
    } catch (err: any) {
      toast.error('Error al actualizar', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // DataTable columns definition
  const columns: Column<IndicatorRow>[] = useMemo(() => [
    {
      key: 'code',
      label: 'Código',
      render: (ind: IndicatorRow) => (
        <span className="font-mono text-xs font-bold text-primary">{ind.code}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (ind: IndicatorRow) => (
        <span className="font-medium max-w-[240px] truncate block" title={ind.name}>{ind.name}</span>
      ),
    },
    {
      key: 'process',
      label: 'Proceso',
      render: (ind: IndicatorRow) => (
        <span className="text-sm text-muted-foreground">{ind.process?.code || '—'}</span>
      ),
    },
    {
      key: 'frequency',
      label: 'Frecuencia',
      align: 'center',
      render: (ind: IndicatorRow) => {
        const v = ind.versions?.[0];
        return <span className="text-sm">{freqLabel[v?.frequency as string] || v?.frequency || '—'}</span>;
      },
      hide: 'md',
    },
    {
      key: 'direction',
      label: 'Dirección',
      align: 'center',
      render: (ind: IndicatorRow) => {
        const v = ind.versions?.[0];
        return <span className="text-xs text-muted-foreground">{dirLabel[v?.direction as string] || v?.direction || '—'}</span>;
      },
      hide: 'lg',
    },
    {
      key: 'target',
      label: 'Meta',
      align: 'center',
      render: (ind: IndicatorRow) => {
        const t = ind.versions?.[0]?.targets?.[0];
        return <span className="font-mono text-sm font-semibold">{t ? `${t.targetValue} ${t.unit}` : '—'}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Creado',
      align: 'right',
      render: (ind: IndicatorRow) => (
        <span className="text-xs text-muted-foreground">{fmtDate(ind.createdAt)}</span>
      ),
      hide: 'md',
    },
  ], []);

  // ── Wizard handlers ──

  const openWizard = () => {
    setWizard(initialWizard);
    setWizardStep(0);
    setWizardErrors({});
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardStep(0);
    setWizardErrors({});
  };

  const updateWizard = (field: keyof WizardState, value: string) => {
    setWizard((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (wizardErrors[field]) {
      setWizardErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!wizard.code.trim()) errors.code = 'El código es obligatorio.';
      if (!wizard.name.trim()) errors.name = 'El nombre es obligatorio.';
      if (!wizard.processId) errors.processId = 'Selecciona un proceso.';
    }

    if (step === 1) {
      if (!wizard.frequency) errors.frequency = 'Selecciona una frecuencia.';
      if (!wizard.direction) errors.direction = 'Selecciona una dirección.';
    }

    if (step === 2) {
      const tv = parseFloat(wizard.targetValue);
      if (isNaN(tv) || tv < 0) errors.targetValue = 'Ingresa un valor objetivo válido.';
      if (!wizard.unit.trim()) errors.unit = 'Ingresa la unidad de medida.';
      const g = parseFloat(wizard.thresholdsGreen);
      if (isNaN(g)) errors.thresholdsGreen = 'El umbral verde es obligatorio.';
    }

    setWizardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setWizardStep((s) => Math.max(s - 1, 0));
  };

  const handleCreate = async () => {
    // Validate final step
    if (!validateStep(2)) {
      setWizardStep(2);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: wizard.code.trim().toUpperCase(),
        name: wizard.name.trim(),
        processId: wizard.processId,
        frequency: wizard.frequency,
        direction: wizard.direction,
        formula: wizard.formula.trim() || null,
        targetValue: parseFloat(wizard.targetValue),
        unit: wizard.unit.trim(),
        thresholds: {
          green: parseFloat(wizard.thresholdsGreen),
          ...(wizard.thresholdsYellow.trim() && { yellow: parseFloat(wizard.thresholdsYellow) }),
          ...(wizard.thresholdsOrange.trim() && { orange: parseFloat(wizard.thresholdsOrange) }),
          ...(wizard.thresholdsRed.trim() && { red: parseFloat(wizard.thresholdsRed) }),
        },
      };

      await apiFetch(apiUrl('/admin/indicators'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success('Indicador creado', {
        description: `El indicador ${wizard.code} fue creado exitosamente con su versión y meta.`,
      });
      closeWizard();
      fetchIndicators();
    } catch (err: any) {
      toast.error('Error al crear indicador', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Indicadores y Metas
          </h2>
          <p className="mt-1 text-muted-foreground">
            Crea, edita y versiona indicadores. Define fórmulas, frecuencias, metas y umbrales de semáforo.
          </p>
        </div>
        <Button onClick={openWizard} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo Indicador
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, nombre o proceso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table using DataTable (same style as MeasurementReviewPage) */}
      <DataTable
        title="Catálogo de Indicadores"
        titleIcon={<Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        columns={columns}
        data={visibleItems}
        actions={indicatorActions}
        loading={loading}
        error={error || null}
        emptyMessage={
          searchTerm
            ? 'No se encontraron indicadores con ese criterio de búsqueda.'
            : 'No hay indicadores registrados. Usa el botón "Nuevo Indicador" para crear el primero.'
        }
      />

      {totalPages > 1 && (
        <BasicPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showFirstLast
          size="sm"
          className="pt-2"
        />
      )}

      {/* ── Wizard Dialog ── */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) closeWizard(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FlaskConical className="h-5 w-5 text-primary" />
              Nuevo Indicador
            </DialogTitle>
            <DialogDescription>
              Completa los pasos para crear un indicador con su versión inicial y meta. Los datos se guardan en una sola transacción.
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                      i < wizardStep
                        ? 'bg-primary text-primary-foreground'
                        : i === wizardStep
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < wizardStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${i === wizardStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="h-px flex-1 bg-border min-w-4" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[240px]">
            {/* Step 1: Identification */}
            {wizardStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ind-code">Código</Label>
                    <Input
                      id="ind-code"
                      value={wizard.code}
                      onChange={(e) => updateWizard('code', e.target.value)}
                      placeholder="Ej: KPI-FIN-01"
                      className="font-mono uppercase"
                      maxLength={20}
                    />
                    {wizardErrors.code && <p className="text-xs text-red-500">{wizardErrors.code}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ind-name">Nombre</Label>
                    <Input
                      id="ind-name"
                      value={wizard.name}
                      onChange={(e) => updateWizard('name', e.target.value)}
                      placeholder="Ej: Cumplimiento del Presupuesto"
                      maxLength={200}
                    />
                    {wizardErrors.name && <p className="text-xs text-red-500">{wizardErrors.name}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ind-process">Proceso</Label>
                  <select
                    id="ind-process"
                    value={wizard.processId}
                    onChange={(e) => updateWizard('processId', e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Selecciona un proceso —</option>
                    {processes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                  {wizardErrors.processId && <p className="text-xs text-red-500">{wizardErrors.processId}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Technical definition */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ind-frequency">Frecuencia</Label>
                    <select
                      id="ind-frequency"
                      value={wizard.frequency}
                      onChange={(e) => updateWizard('frequency', e.target.value)}
                      className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="MONTHLY">Mensual</option>
                      <option value="QUARTERLY">Trimestral</option>
                      <option value="SEMIANNUAL">Semestral</option>
                      <option value="PROJECT_BASED">Por Proyecto</option>
                    </select>
                    {wizardErrors.frequency && <p className="text-xs text-red-500">{wizardErrors.frequency}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ind-direction">Dirección</Label>
                    <select
                      id="ind-direction"
                      value={wizard.direction}
                      onChange={(e) => updateWizard('direction', e.target.value)}
                      className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="AT_LEAST">Mayor es mejor</option>
                      <option value="AT_MOST">Menor es mejor</option>
                      <option value="RANGE">Rango</option>
                    </select>
                    {wizardErrors.direction && <p className="text-xs text-red-500">{wizardErrors.direction}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ind-formula">
                    Fórmula <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="ind-formula"
                    value={wizard.formula}
                    onChange={(e) => updateWizard('formula', e.target.value)}
                    placeholder="Ej: (costo_ejecutado / costo_presupuestado) * 100"
                    className="font-mono text-sm"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa variables entre paréntesis. Se evalúa con mathjs al registrar la medición.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Target and thresholds */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ind-target">Valor objetivo (meta)</Label>
                    <Input
                      id="ind-target"
                      type="number"
                      step="any"
                      value={wizard.targetValue}
                      onChange={(e) => updateWizard('targetValue', e.target.value)}
                      placeholder="Ej: 90"
                    />
                    {wizardErrors.targetValue && <p className="text-xs text-red-500">{wizardErrors.targetValue}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ind-unit">Unidad de medida</Label>
                    <Input
                      id="ind-unit"
                      value={wizard.unit}
                      onChange={(e) => updateWizard('unit', e.target.value)}
                      placeholder="Ej: %, $, horas"
                      maxLength={20}
                    />
                    {wizardErrors.unit && <p className="text-xs text-red-500">{wizardErrors.unit}</p>}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Umbrales de semáforo</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Verde</span>
                        <span className="text-muted-foreground">*</span>
                      </div>
                      <Input
                        type="number"
                        step="any"
                        value={wizard.thresholdsGreen}
                        onChange={(e) => updateWizard('thresholdsGreen', e.target.value)}
                        placeholder="Ej: 90"
                      />
                      {wizardErrors.thresholdsGreen && <p className="text-xs text-red-500">{wizardErrors.thresholdsGreen}</p>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Amarillo</span>
                      </div>
                      <Input
                        type="number"
                        step="any"
                        value={wizard.thresholdsYellow}
                        onChange={(e) => updateWizard('thresholdsYellow', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Naranja</span>
                      </div>
                      <Input
                        type="number"
                        step="any"
                        value={wizard.thresholdsOrange}
                        onChange={(e) => updateWizard('thresholdsOrange', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Rojo</span>
                      </div>
                      <Input
                        type="number"
                        step="any"
                        value={wizard.thresholdsRed}
                        onChange={(e) => updateWizard('thresholdsRed', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Revisa los datos antes de crear el indicador. Se guardará en una sola transacción: indicador + versión + meta.
                </p>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Código</span>
                    <span className="font-mono font-semibold">{wizard.code.toUpperCase()}</span>
                    <span className="text-muted-foreground">Nombre</span>
                    <span className="font-medium">{wizard.name}</span>
                    <span className="text-muted-foreground">Proceso</span>
                    <span className="font-medium">{processes.find((p) => p.id === wizard.processId)?.code || '—'}</span>
                    <span className="text-muted-foreground">Frecuencia</span>
                    <span>{freqLabel[wizard.frequency]}</span>
                    <span className="text-muted-foreground">Dirección</span>
                    <span>{dirLabel[wizard.direction]}</span>
                    <span className="text-muted-foreground">Fórmula</span>
                    <span className="font-mono text-xs">{wizard.formula || '—'}</span>
                    <span className="text-muted-foreground">Valor objetivo</span>
                    <span className="font-semibold">{wizard.targetValue} {wizard.unit}</span>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Umbrales</p>
                    <div className="flex gap-4">
                      <Badge variant="success">
                        Verde: {wizard.thresholdsGreen}
                      </Badge>
                      {wizard.thresholdsYellow && (
                        <Badge variant="warning">
                          Amarillo: {wizard.thresholdsYellow}
                        </Badge>
                      )}
                      {wizard.thresholdsOrange && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/40">
                          Naranja: {wizard.thresholdsOrange}
                        </Badge>
                      )}
                      {wizard.thresholdsRed && (
                        <Badge variant="danger">
                          Rojo: {wizard.thresholdsRed}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2">
            {wizardStep > 0 ? (
              <Button type="button" variant="outline" onClick={prevStep} disabled={saving} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={closeWizard} disabled={saving}>
                Cancelar
              </Button>
            )}

            {wizardStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="gap-2">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleCreate} disabled={saving} className="gap-2">
                {saving ? 'Creando...' : 'Crear Indicador'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Wizard Dialog ── */}
      <Dialog open={editWizardOpen} onOpenChange={(open) => { if (!open) { setEditWizardOpen(false); setEditingIndicator(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Indicador: {editingIndicator?.code}
            </DialogTitle>
            <DialogDescription>
              Modifica los datos del indicador. Si cambias campos técnicos (frecuencia, fórmula, meta, umbrales), se creará una nueva versión automáticamente.
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                      i < editWizardStep
                        ? 'bg-primary text-primary-foreground'
                        : i === editWizardStep
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < editWizardStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${i === editWizardStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="h-px flex-1 bg-border min-w-4" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[240px]">
            {/* Step 1: Identification */}
            {editWizardStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input value={editWizard.code} disabled className="font-mono text-sm bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-name">Nombre</Label>
                    <Input
                      id="edit-ind-name"
                      value={editWizard.name}
                      onChange={(e) => updateEditWizard('name', e.target.value)}
                      placeholder="Nombre del indicador"
                      maxLength={200}
                    />
                    {editWizardErrors.name && <p className="text-xs text-red-500">{editWizardErrors.name}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ind-process">Proceso</Label>
                  <select
                    id="edit-ind-process"
                    value={editWizard.processId}
                    onChange={(e) => updateEditWizard('processId', e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Selecciona un proceso —</option>
                    {processes.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                  {editWizardErrors.processId && <p className="text-xs text-red-500">{editWizardErrors.processId}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Technical definition */}
            {editWizardStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-frequency">Frecuencia</Label>
                    <select
                      id="edit-ind-frequency"
                      value={editWizard.frequency}
                      onChange={(e) => updateEditWizard('frequency', e.target.value)}
                      className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="MONTHLY">Mensual</option>
                      <option value="QUARTERLY">Trimestral</option>
                      <option value="SEMIANNUAL">Semestral</option>
                      <option value="PROJECT_BASED">Por Proyecto</option>
                    </select>
                    {editWizardErrors.frequency && <p className="text-xs text-red-500">{editWizardErrors.frequency}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-direction">Dirección</Label>
                    <select
                      id="edit-ind-direction"
                      value={editWizard.direction}
                      onChange={(e) => updateEditWizard('direction', e.target.value)}
                      className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="AT_LEAST">Mayor es mejor</option>
                      <option value="AT_MOST">Menor es mejor</option>
                      <option value="RANGE">Rango</option>
                    </select>
                    {editWizardErrors.direction && <p className="text-xs text-red-500">{editWizardErrors.direction}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-inputMode">Modo de captura</Label>
                    <select
                      id="edit-ind-inputMode"
                      value={editWizard.inputMode}
                      onChange={(e) => updateEditWizard('inputMode', e.target.value)}
                      className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="DIRECT_VALUE">Valor directo</option>
                      <option value="FORMULA_INPUTS">Por variables de fórmula</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-chartType">Tipo de gráfica</Label>
                    <select
                      id="edit-ind-chartType"
                      value={editWizard.chartType}
                      onChange={(e) => updateEditWizard('chartType', e.target.value)}
                      className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="LINE">Línea / Barras</option>
                      <option value="PIE">Torta + Barras + Tendencia</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ind-formula">
                    Fórmula <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="edit-ind-formula"
                    value={editWizard.formula}
                    onChange={(e) => updateEditWizard('formula', e.target.value)}
                    placeholder="Ej: (proveedoresConfiables / totalProveedoresEvaluados) * 100"
                    className="font-mono text-sm"
                    maxLength={2000}
                  />
                </div>
                {editWizard.inputMode === 'FORMULA_INPUTS' && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                    <p className="font-bold text-primary">Campos de captura para fórmula</p>
                    <p className="text-muted-foreground">El sistema solicitará al responsable estos valores al registrar la medición. El resultado se calcula automáticamente.</p>
                    {editWizard.formula.includes('proveedoresConfiables') && (
                      <ul className="list-disc list-inside text-foreground/70 mt-1 space-y-0.5">
                        <li>Proveedores confiables</li>
                        <li>Proveedores que requieren mejoras</li>
                        <li>Proveedores suspendidos</li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Target and thresholds */}
            {editWizardStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-target">Valor objetivo (meta)</Label>
                    <Input
                      id="edit-ind-target"
                      type="number"
                      step="any"
                      value={editWizard.targetValue}
                      onChange={(e) => updateEditWizard('targetValue', e.target.value)}
                      placeholder="Ej: 90"
                    />
                    {editWizardErrors.targetValue && <p className="text-xs text-red-500">{editWizardErrors.targetValue}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ind-unit">Unidad de medida</Label>
                    <Input
                      id="edit-ind-unit"
                      value={editWizard.unit}
                      onChange={(e) => updateEditWizard('unit', e.target.value)}
                      placeholder="Ej: %, $, horas"
                      maxLength={20}
                    />
                    {editWizardErrors.unit && <p className="text-xs text-red-500">{editWizardErrors.unit}</p>}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Umbrales de semáforo</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'thresholdsGreen' as keyof WizardState, label: 'Verde', color: 'bg-green-500', required: true },
                      { key: 'thresholdsYellow' as keyof WizardState, label: 'Amarillo', color: 'bg-yellow-500', required: false },
                      { key: 'thresholdsOrange' as keyof WizardState, label: 'Naranja', color: 'bg-orange-500', required: false },
                      { key: 'thresholdsRed' as keyof WizardState, label: 'Rojo', color: 'bg-red-500', required: false },
                    ].map(({ key, label, color, required }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span>{label}</span>
                          {required && <span className="text-muted-foreground">*</span>}
                        </div>
                        <Input
                          type="number"
                          step="any"
                          value={editWizard[key]}
                          onChange={(e) => updateEditWizard(key, e.target.value)}
                          placeholder={required ? 'Obligatorio' : 'Opcional'}
                        />
                        {editWizardErrors[key] && <p className="text-xs text-red-500">{editWizardErrors[key]}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {editWizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Revisa los cambios. Si modificaste frecuencia, dirección, fórmula, modo de entrada, meta o umbrales, se creará una nueva versión técnica automáticamente.
                </p>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Código</span>
                    <span className="font-mono font-semibold">{editWizard.code}</span>
                    <span className="text-muted-foreground">Nombre</span>
                    <span className="font-medium">{editWizard.name}</span>
                    <span className="text-muted-foreground">Proceso</span>
                    <span className="font-medium">{processes.find((p) => p.id === editWizard.processId)?.code || '—'}</span>
                    <span className="text-muted-foreground">Frecuencia</span>
                    <span>{freqLabel[editWizard.frequency] || editWizard.frequency}</span>
                    <span className="text-muted-foreground">Dirección</span>
                    <span>{dirLabel[editWizard.direction] || editWizard.direction}</span>
                    <span className="text-muted-foreground">Modo captura</span>
                    <span>{editWizard.inputMode === 'FORMULA_INPUTS' ? 'Por variables de fórmula' : 'Valor directo'}</span>
                    <span className="text-muted-foreground">Tipo gráfica</span>
                    <span>{editWizard.chartType === 'PIE' ? 'Torta + Barras + Tendencia' : 'Línea / Barras'}</span>
                    <span className="text-muted-foreground">Fórmula</span>
                    <span className="font-mono text-xs">{editWizard.formula || '—'}</span>
                    <span className="text-muted-foreground">Valor objetivo</span>
                    <span className="font-semibold">{editWizard.targetValue} {editWizard.unit}</span>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Umbrales</p>
                    <div className="flex flex-wrap gap-2">
                      {editWizard.thresholdsGreen && <Badge variant="success">Verde: {editWizard.thresholdsGreen}</Badge>}
                      {editWizard.thresholdsYellow && <Badge variant="warning">Amarillo: {editWizard.thresholdsYellow}</Badge>}
                      {editWizard.thresholdsOrange && <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/40">Naranja: {editWizard.thresholdsOrange}</Badge>}
                      {editWizard.thresholdsRed && <Badge variant="danger">Rojo: {editWizard.thresholdsRed}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2">
            {editWizardStep > 0 ? (
              <Button type="button" variant="outline" onClick={prevEditStep} disabled={saving} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => { setEditWizardOpen(false); setEditingIndicator(null); }} disabled={saving}>
                Cancelar
              </Button>
            )}
            {editWizardStep < steps.length - 1 ? (
              <Button type="button" onClick={nextEditStep} className="gap-2">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleEditSave} disabled={saving} className="gap-2">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
