import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { useIndicatorChart, useProcurementDistribution } from '../../shared/hooks/useIndicators';
import { RippleLoader } from '../../components/evilcharts/blocks/ripple-loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/features/executive/components/ui/card';
import { Button } from '@/features/executive/components/ui/button';
import { IndicatorTrendChart } from '../../components/dashboard/IndicatorTrendChart';
import { ProcurementSupplierPieChart } from '../../components/dashboard/ProcurementSupplierPieChart';
import { ProcurementSupplierBarChart } from '../../components/dashboard/ProcurementSupplierBarChart';
import {
  Activity,
  Target,
  CheckCircle2,
  XCircle,
  Upload,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const { data: processes, isLoading } = useMyProcesses();
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  // Derive all indicators from processes
  const indicators = useMemo(
    () =>
      processes?.flatMap((p: any) =>
        (p.indicators ?? []).map((ind: any) => ({
          ...ind,
          processName: p.name,
          processId: p.id,
        })),
      ) || [],
    [processes],
  );

  // Auto-select first indicator on load
  useEffect(() => {
    if (!selectedIndicatorId && indicators.length > 0) {
      setSelectedIndicatorId(indicators[0].id);
    }
  }, [indicators, selectedIndicatorId]);

  // Find the selected indicator details
  const selectedIndicator = indicators.find((i: any) => i.id === selectedIndicatorId);
  const latestMeasurement = selectedIndicator?.versions?.[0]?.measurements?.[0];
  const target = selectedIndicator?.versions?.[0]?.targets?.[0];

  const getTrafficLightBadge = (tl?: string) => {
    if (tl === 'GREEN') return { label: 'Cumple', classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40' };
    if (tl === 'RED') return { label: 'No cumple', classes: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40' };
    return { label: 'Pendiente de medición', classes: 'bg-gray-200 text-gray-800 border-gray-400 font-medium dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600' };
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RippleLoader size="md" label="Cargando tus indicadores..." />
      </div>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 text-muted-foreground">
        <p className="font-medium">No tienes procesos asignados.</p>
        <p className="text-xs">Contacta al administrador para que te asigne indicadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de Control</h2>
          <p className="mt-1 text-muted-foreground">
            Resumen rápido de tus indicadores y acceso a carga de mediciones.
          </p>
        </div>
      </div>

      {/* ── Stats overview ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Indicadores</p>
              <p className="text-2xl font-bold">{indicators.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cumplen</p>
              <p className="text-2xl font-bold">
                {indicators.filter((i: any) => i.latestTrafficLight === 'GREEN').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No cumplen</p>
              <p className="text-2xl font-bold">
                {indicators.filter((i: any) => i.latestTrafficLight === 'RED').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Indicator Selector + Chart ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/30 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Tendencia del Indicador
              </CardTitle>
              <CardDescription>
                Seleccioná un indicador para ver su evolución y comparación con la meta.
              </CardDescription>
            </div>
            {/* Selector de indicador */}
            <select
              value={selectedIndicatorId || ''}
              onChange={(e) => setSelectedIndicatorId(e.target.value || null)}
              className="h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
            >
              {indicators.map((ind: any) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name} ({ind.processName})
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {selectedIndicator && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Valor Actual</p>
                <p className="text-lg font-bold text-foreground">
                  {latestMeasurement?.value != null
                    ? `${latestMeasurement.value}${target?.unit ? ` ${target.unit}` : ""}`
                    : "Sin medición"}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Meta</p>
                <p className="text-lg font-bold text-foreground">
                  {target ? `${target.direction === 'AT_LEAST' ? '≥' : '≤'} ${target.targetValue}${target.unit || ''}` : '—'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Estado</p>
                <div className="flex justify-center mt-1">
                  {(() => {
                    const badge = getTrafficLightBadge(selectedIndicator.latestTrafficLight);
                    return (
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Frecuencia</p>
                <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {(() => {
                    const freq: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', SEMIANNUAL: 'Semestral' };
                    return freq[selectedIndicator.versions?.[0]?.frequency] || '—';
                  })()}
                </p>
              </div>
            </div>
          )}

          {!selectedIndicatorId ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground border-2 border-dashed border-border/40 rounded-xl">
              Seleccioná un indicador para ver su tendencia.
            </div>
          ) : (
            <div className="w-full">
              <OwnerTrendChartWrapper indicator={selectedIndicator} />
            </div>
          )}

          {selectedIndicator && selectedIndicatorId && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-border/30">
              <Link to={`/owner/indicadores/${selectedIndicator.id}`}>
                <Button variant="outline" className="border-border/60">
                  Ver detalle
                </Button>
              </Link>
              <Link to={`/owner/indicadores/${selectedIndicator.id}/carga`}>
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                  <Upload className="h-4 w-4" />
                  Registrar medición
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick indicator cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.slice(0, 6).map((ind: any) => {
          const badge = getTrafficLightBadge(ind.latestTrafficLight);
          return (
            <Link key={ind.id} to={`/owner/indicadores/${ind.id}`}>
              <Card className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    ind.latestTrafficLight === 'GREEN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                      ind.latestTrafficLight === 'RED' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-muted text-muted-foreground'
                  }`}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate">{ind.name}</h4>
                    <p className="text-xs text-muted-foreground">{ind.processName} · {ind.code}</p>
                  </div>
                  <div className="shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
function OwnerTrendChartWrapper({ indicator }: { indicator: any }) {
  const isPieChart = indicator?.chartType === 'PIE' || indicator?.code === 'KPI-PROC-001';
  const { data: trendData, isLoading: isTrendLoading } = useIndicatorChart(indicator?.id);
  const { data: distributionData, isLoading: isDistributionLoading } = useProcurementDistribution(
    isPieChart ? indicator?.id : null
  );

  return (
    <section className="space-y-6">
      <IndicatorTrendChart
        title="Tendencia del Indicador"
        data={trendData || []}
        isLoading={isTrendLoading}
      />

      {isPieChart && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ProcurementSupplierPieChart
            title="Criterio de clasificación de proveedores"
            distribution={distributionData}
            isLoading={isDistributionLoading}
          />
          <ProcurementSupplierBarChart
            title="Cantidad de proveedores por clasificación"
            distribution={distributionData}
            isLoading={isDistributionLoading}
          />
        </div>
      )}
    </section>
  );
}
