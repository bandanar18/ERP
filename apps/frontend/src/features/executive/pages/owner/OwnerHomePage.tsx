import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import { Activity, LayoutDashboard, PlusCircle, ArrowRight } from 'lucide-react';

export const OwnerHomePage: React.FC = () => {
  const { data, isLoading, error } = useMyProcesses();

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Bandeja Operativa
        </h2>
        <p className="mt-1 text-muted-foreground">
          Gestión de mediciones e indicadores asignados a tus procesos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-full shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <CardTitle className="text-card-foreground">Mis Procesos</CardTitle>
            </div>
            <CardDescription>
              Indicadores bajo tu responsabilidad
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : error ? (
              <div className="text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                Error al cargar procesos asignados.
              </div>
            ) : data && data.length > 0 ? (
              <ul className="space-y-4">
                {data.map((process: any) => (
                  <li 
                    key={process.id} 
                    className="p-5 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg text-card-foreground">{process.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {process.indicators?.length || 0} Indicadores
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{process.description || 'Sin descripción'}</p>
                    </div>
                    
                    {process.indicators && process.indicators.length > 0 ? (
                      <div className="space-y-2 mt-auto">
                        {process.indicators.map((ind: any) => (
                          <Link key={ind.id} to={`/owner/indicadores/${ind.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-accent hover:border-accent/50 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="font-medium text-sm text-foreground/80 group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[250px]">{ind.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {ind.latestTrafficLight && ind.latestTrafficLight !== 'GRAY' && (
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                                    ind.latestTrafficLight === 'GREEN'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40'
                                      : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40'
                                  }`}>
                                    {ind.latestTrafficLight === 'GREEN' ? 'CUMPLE' : 'NO CUMPLE'}
                                  </span>
                                )}
                                <span className="px-2 py-1 text-[10px] font-mono font-bold text-muted-foreground bg-card rounded border border-border">
                                  {ind.code}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-auto flex items-center justify-center p-4 rounded-lg border border-dashed border-border bg-muted/20">
                        <p className="text-sm text-muted-foreground font-medium">Sin indicadores asignados</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-border bg-muted/20">
                <LayoutDashboard className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-bold mb-1">No tienes procesos asignados</p>
                <p className="text-sm text-muted-foreground/70">Contacta al administrador para que te asigne responsabilidades.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-card-foreground">Cargar Medición</CardTitle>
            </div>
            <CardDescription>
              Registra nuevos valores para tus indicadores.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Seleccioná un indicador desde la lista de procesos para registrar una medición, o usá el centro de carga dedicado.
            </p>
            <Link
              to="/executive/owner/upload"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Ir al centro de carga
              <ArrowRight className="h-4 w-4" />
            </Link>
            {data && data.length > 0 && data[0].indicators?.length > 0 && (
              <Link
                to={`/owner/indicadores/${data[0].indicators[0].id}/carga`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm hover:bg-muted/50 transition-colors"
              >
                Cargar {data[0].indicators[0].name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

