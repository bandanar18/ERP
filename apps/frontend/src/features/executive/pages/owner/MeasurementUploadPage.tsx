import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIndicatorSheet } from '../../shared/hooks/useIndicators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { Badge } from '@/features/executive/components/ui/badge';
import { Button } from '@/features/executive/components/ui/button';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { MeasurementUploadForm } from '../../components/dashboard/MeasurementUploadForm';
import { apiFetch } from '../../shared/api/api-client';
import { apiUrl } from '../../shared/api/config';
import { formatTarget } from '../../utils/indicator-format';
// Utility to extract variables from simple math formulas
const extractVariables = (formula: string): string[] => {
  if (!formula) return [];
  const words = formula.match(/[a-zA-Z_]\w*/g) || [];
  return [...new Set(words)];
};

const frequencyLabels: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  PROJECT_BASED: 'Por Proyecto',
};

export const MeasurementUploadPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sheet, isLoading, error } = useIndicatorSheet(id || null);
  const [periodId, setPeriodId] = useState<string>('');
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodError, setPeriodError] = useState('');

  useEffect(() => {
    const fetchActivePeriod = async () => {
      try {
        const res = await apiFetch(apiUrl('/dashboard/active-period'), undefined, { silent: true });
        const data = await res.json();
        if (data?.id) {
          setPeriodId(data.id);
        } else {
          setPeriodError('No hay un período activo disponible');
        }
      } catch {
        setPeriodError('Error al cargar el período activo');
      } finally {
        setPeriodLoading(false);
      }
    };
    fetchActivePeriod();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="text-center p-12 bg-destructive/10 border border-destructive/20 rounded-xl mt-8 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-destructive/80 mb-4">No se pudo cargar la información del indicador para la carga.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="border-destructive/30 text-destructive hover:bg-destructive/10">Volver</Button>
      </div>
    );
  }

  const activeVersion = sheet.versions?.[0];
  const target = activeVersion?.targets?.[0]
  const unit = target?.unit ?? ""
  const isPercent = unit === "%"
  const isFormulaBased = Boolean(activeVersion?.formula?.trim())
  const directionLabel =
    activeVersion?.direction === "ATLEAST"
      ? "Alcanzar o superar"
      : activeVersion?.direction === "ATMOST"
        ? "Mantener en o por debajo de"
        : "Mantener dentro del rango"
  const formula = activeVersion?.formula || '';
  const variables = formula ? extractVariables(formula) : ['valor_directo'];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="mt-0.5 shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">
                {sheet.code}
              </span>

              <span className="text-sm text-muted-foreground">
                {sheet.process?.name}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Carga de medición
            </h1>

            <p className="mt-1 text-sm font-medium text-foreground">
              {sheet.name}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-primary/25 bg-primary/10 px-3 py-1.5 text-primary"
        >
          {frequencyLabels[activeVersion?.frequency ?? ""] ?? "Según configuración"}
        </Badge>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Meta vigente
          </p>
          <p className="mt-2 text-xl font-bold text-foreground">
            {formatTarget(activeVersion?.direction, target?.targetValue, unit)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Criterio
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 text-foreground">
            {directionLabel}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Período activo
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {periodLoading ? "Cargando..." : "Período habilitado"}
          </p>
        </div>
      </section>

      {periodError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{periodError}</p>
        </div>
      )}

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-muted/25 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base text-foreground">
                Registrar resultado
              </CardTitle>
              <CardDescription className="mt-1">
                {isFormulaBased
                  ? "Ingrese los valores fuente. El sistema calculará el resultado automáticamente."
                  : `Ingrese el ${isPercent ? "porcentaje" : "valor"} reportado para el período activo.`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {periodLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <MeasurementUploadForm
              indicatorVersionId={activeVersion?.id}
              periodId={periodId}
              formulaVariables={variables}
              inputMode={activeVersion?.inputMode}
              displayAsPercent={activeVersion?.displayAsPercent}
              onSuccess={() => navigate(-1)}
            />
          )}
        </CardContent>
      </Card>

      {isFormulaBased && (
        <aside className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Método de cálculo
          </p>

          <p className="mt-1 font-mono text-sm text-foreground">
            {activeVersion?.formula}
          </p>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Los valores introducidos se conservan como soporte de la medición y el
            resultado se calcula automáticamente.
          </p>
        </aside>
      )}
    </div>
  );
};
