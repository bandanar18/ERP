import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/features/executive/components/ui/card';
import { useAuthStore } from '../../shared/store/auth.store';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import { Shield, Building2, ClipboardList, CheckCircle2, Mail, Target } from 'lucide-react';

export const OwnerProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: processes, isLoading } = useMyProcesses();

  // Get the user's role(s) as readable text
  const roleText = (() => {
    if (!user?.roles) return '—';
    const roleCodes = user.roles.map((r: any) =>
      typeof r === 'string' ? r : r.role?.code ?? r.code ?? r,
    );
    if (roleCodes.includes('ADMIN')) return 'Administrador';
    if (roleCodes.includes('DIRECTOR')) return 'Director Ejecutivo';
    if (roleCodes.includes('PROCESS_OWNER')) return 'Dueño de Proceso';
    return roleCodes.join(', ');
  })();

  const initials = user?.email?.substring(0, 2).toUpperCase() || '?';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Perfil</h2>
        <p className="mt-1 text-muted-foreground">Información personal y alcance operativo en el sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Profile Card ── */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm overflow-hidden">
          {/* Gradient header */}
          <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
          <CardContent className="relative pt-0 -mt-10 text-center">
            {/* Avatar circle overlapping gradient */}
            <div className="flex justify-center mb-3">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xl font-bold text-white shadow-lg ring-4 ring-background">
                {initials}
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground">
              {user?.email?.split('@')[0] || 'Usuario'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {user?.email || '—'}
            </p>

            {/* Role + Status badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground border border-primary/80">
                <Shield className="h-3 w-3" />
                {roleText}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white border border-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Activo
              </span>
            </div>

            <div className="h-px bg-border/60 my-4" />

            {/* Key info */}
            <div className="space-y-3 text-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Organización</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Corporación Principal
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Indicadores</span>
                <span className="font-medium text-foreground">
                  {processes?.reduce((acc: number, p: any) => acc + (p.indicators?.length || 0), 0) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Operational Scope ── */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/30 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Alcance Operativo
            </CardTitle>
            <CardDescription>
              Procesos e indicadores bajo tu responsabilidad en el sistema de gestión.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : processes && processes.length > 0 ? (
              <div className="space-y-4">
                {processes.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-foreground">{p.name}</h4>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                        {p.code}
                      </span>
                    </div>

                    {p.indicators && p.indicators.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {p.indicators.map((ind: any) => (
                          <span
                            key={ind.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/5 text-primary border border-primary/10"
                          >
                            <Target className="h-3 w-3" />
                            {ind.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin indicadores asignados</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sin procesos asignados</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Contacta al administrador para que te asigne responsabilidades.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
