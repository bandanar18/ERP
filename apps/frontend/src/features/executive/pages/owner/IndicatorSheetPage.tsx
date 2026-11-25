import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIndicatorSheet, useIndicatorChart, useProcurementDistribution } from '../../shared/hooks/useIndicators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { Button } from '@/features/executive/components/ui/button';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import { ArrowLeft, Activity, Calendar, FileText, Target } from 'lucide-react';
import { IndicatorTrendChart } from '../../components/dashboard/IndicatorTrendChart';
import { ProcurementSupplierPieChart } from '../../components/dashboard/ProcurementSupplierPieChart';
import { ProcurementSupplierBarChart } from '../../components/dashboard/ProcurementSupplierBarChart';

export const IndicatorSheetPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sheet, isLoading, error } = useIndicatorSheet(id || null);
  const { data: trendData = [], isLoading: isTrendLoading } = useIndicatorChart(id || null);
  
  const isProcurement = sheet?.indicator?.chartType === 'PIE' || sheet?.chartType === 'PIE';
  
  const {
    data: procurementDistribution,
    isLoading: isProcurementLoading,
    error: distributionError,
  } = useProcurementDistribution(isProcurement ? (id || null) : null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="text-center p-12 bg-destructive/10 border border-destructive/20 rounded-xl mt-8">
        <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-destructive/80 mb-4">No se pudo cargar la ficha del indicador.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="border-destructive/30 text-destructive hover:bg-destructive/10">Volver</Button>
      </div>
    );
  }

  const activeVersion = sheet.versions?.[0];
  const target = activeVersion?.targets?.[0];
  const recentMeasurements = activeVersion?.measurements || [];
  const latestMeasurement = recentMeasurements[0];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="bg-card border-border text-foreground/80 hover:bg-muted/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-card-foreground tracking-tight">Ficha Técnica: {sheet.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono font-medium">{sheet.code}</span>
              <span>•</span>
              <span>Proceso: {sheet.process?.name}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/owner/indicadores/${id}/carga`)}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm"
        >
          Capturar Medición
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Identificación
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-1">Organización</span>
              <span className="font-medium text-card-foreground">{sheet.organization?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-1">Frecuencia</span>
              <span className="font-medium text-card-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {(() => {
                  const freqMap: Record<string, string> = {
                    MONTHLY: 'Mensual',
                    QUARTERLY: 'Trimestral',
                    SEMIANNUAL: 'Semestral',
                    PROJECT_BASED: 'Por Proyecto',
                  };
                  return freqMap[activeVersion?.frequency || ''] || activeVersion?.frequency || 'Mensual';
                })()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-1">Meta Vigente</span>
              <span className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                <Target className="h-4 w-4 text-green-600" /> {activeVersion?.direction === 'AT_LEAST' ? '≥' : '≤'} {target?.targetValue || 0} {target?.unit || '%'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Último Resultado: {latestMeasurement?.period?.startsAt ? new Date(latestMeasurement.period.startsAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Sin datos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-center">
            {latestMeasurement ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="text-xs text-muted-foreground font-bold uppercase mb-2">Valor Obtenido</div>
                  <div className="text-3xl font-bold text-card-foreground truncate" title={latestMeasurement.value}>
                    {typeof latestMeasurement.value === 'number' ? latestMeasurement.value.toFixed(2) : latestMeasurement.value}
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="text-xs text-muted-foreground font-bold uppercase mb-2">Conclusión</div>
                  <div className="flex justify-center mt-2">
                    <div className={`px-3 py-1 rounded-md text-xs font-bold border ${latestMeasurement.trafficLight === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40' :
                        latestMeasurement.trafficLight === 'RED' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40' :
                          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600'
                      }`}>
                      {latestMeasurement.trafficLight === 'GREEN' ? 'CUMPLE' :
                        latestMeasurement.trafficLight === 'RED' ? 'NO CUMPLE' : 'S/D'}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 bg-muted/30 p-4 rounded-xl border border-border/50 text-left">
                  <div className="text-xs text-muted-foreground font-bold uppercase mb-2">Análisis / Observación</div>
                  <p className="text-sm text-card-foreground/80 line-clamp-3">
                    {latestMeasurement.observation || 'Sin observaciones documentadas para este periodo.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8 border-2 border-dashed border-border/50 rounded-lg">
                <p className="font-medium text-foreground/80">No hay mediciones registradas.</p>
                <p className="text-sm mt-1">Realice la primera captura para comenzar a graficar el historial.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
          {isProcurement && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ProcurementSupplierPieChart
                title="Criterio de clasificación de proveedores"
                distribution={procurementDistribution}
                isLoading={isProcurementLoading}
              />

              <ProcurementSupplierBarChart
                title="Cantidad de proveedores por clasificación"
                distribution={procurementDistribution}
                isLoading={isProcurementLoading}
              />
            </div>
          )}

          <IndicatorTrendChart
            title={isProcurement ? 'Tendencia de proveedores confiables' : 'Tendencia de cumplimiento'}
            data={trendData || []}
            isLoading={isTrendLoading}
            unit={target?.unit || '%'}
          />

          {distributionError && (
            <p className="text-sm text-destructive">
              No fue posible cargar la clasificación de proveedores.
            </p>
          )}
      </section>

      <Card className="shadow-sm mt-6">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="text-lg text-card-foreground">Historial Operativo</CardTitle>
          <CardDescription>Registro de mediciones recientes, variables ingresadas y resultados obtenidos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-bold border-r border-border/30">Período</th>
                  <th className="px-6 py-4 font-bold border-r border-border/30 text-center">Conclusión</th>
                  <th className="px-6 py-4 font-bold border-r border-border/30 text-center">Resultado</th>
                  <th className="px-6 py-4 font-bold">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentMeasurements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4 border-r border-border/20 text-card-foreground font-semibold">
                      {new Date(m.period.startsAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 border-r border-border/20 text-center">
                      <div className="flex justify-center">
                        <div className={`px-3 py-1 rounded-md text-xs font-bold border ${m.trafficLight === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40' :
                            m.trafficLight === 'RED' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40' :
                              'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600'
                          }`}>
                          {m.trafficLight === 'GREEN' ? 'CUMPLE' :
                            m.trafficLight === 'RED' ? 'NO CUMPLE' : 'S/D'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-border/20 text-center font-bold text-card-foreground text-base">
                      {typeof m.value === 'number' ? m.value.toFixed(2) : m.value}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {m.submittedBy?.email}
                    </td>
                  </tr>
                ))}
                {recentMeasurements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No hay historial de mediciones cargado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

