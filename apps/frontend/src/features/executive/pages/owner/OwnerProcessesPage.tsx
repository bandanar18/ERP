import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/features/executive/components/ui/card';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import { Activity, ClipboardList, ChevronRight, Target } from 'lucide-react';

const freqLabels: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  PROJECT_BASED: 'Por Proyecto',
};

export const OwnerProcessesPage: React.FC = () => {
  const { data, isLoading, error } = useMyProcesses();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mis Procesos</h2>
        <p className="mt-1 text-muted-foreground">Procesos e indicadores bajo tu responsabilidad.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-destructive font-medium">Error al cargar procesos asignados.</p>
          </CardContent>
        </Card>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((process: any) => (
            <Card key={process.id} className="border-border/40 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <CardHeader className="border-b border-border/30 bg-muted/10 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{process.name}</CardTitle>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {process.indicators?.length || 0} indicadores
                  </span>
                </div>
                <CardDescription>
                  Código: {process.code}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {process.indicators && process.indicators.length > 0 ? (
                  <div className="space-y-2">
                    {process.indicators.map((ind: any) => {
                      const activeVersion = ind.versions?.[0];
                      const target = activeVersion?.targets?.[0];
                      return (
                        <Link key={ind.id} to={`/owner/indicadores/${ind.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3 min-w-0">
                              <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              <div className="min-w-0">
                                <span className="font-medium text-sm group-hover:text-primary transition-colors truncate block">
                                  {ind.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">{ind.code}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {target && (
                                <span className="text-xs text-muted-foreground font-medium hidden sm:flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {target.targetValue}{target.unit || '%'}
                                </span>
                              )}
                              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border/40">
                                {freqLabels[activeVersion?.frequency] || activeVersion?.frequency || '—'}
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 rounded-lg border border-dashed border-border/40 bg-muted/20">
                    <p className="text-sm text-muted-foreground font-medium">Sin indicadores asignados a este proceso</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/40 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-bold mb-2">No tienes procesos asignados</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Contacta al administrador para que te asigne responsabilidades.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
