import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { Button } from '@/features/executive/components/ui/button';
import { Link } from 'react-router-dom';
import { useUsers } from '../../shared/hooks/useUsers';
import { useDashboardSummary } from '../../shared/hooks/useIndicators';
import { downloadExport } from '../../shared/api/reports.api';
import StatsCards from '../../components/mvpblocks/ui/stats-cards';
import {
  Download, Users, AlertCircle,
  ShieldAlert, History, FileSpreadsheet, CheckCircle2, XCircle, Activity,
} from 'lucide-react';
import type { StatItem } from '../../components/mvpblocks/ui/stats-cards';
import { cn } from '../../utils/utils';

const adminModules = [
  {
    title: "Revisión de mediciones",
    description: "Verifica y gestiona las mediciones registradas por los dueños de proceso.",
    href: "/executive/admin/revision",
    icon: ShieldAlert,
    iconClass: "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    hoverClass: "hover:border-amber-500/40",
  },
  {
    title: "Informes consolidados",
    description: "Panorama corporativo completo de cumplimiento de indicadores.",
    href: "/executive/admin/informes",
    icon: FileSpreadsheet,
    iconClass: "bg-blue-500/15 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    hoverClass: "hover:border-blue-500/40",
  },
  {
    title: "Bitácora de trazabilidad",
    description: "Historial inmutable de eventos y decisiones del sistema.",
    href: "/executive/admin/auditoria",
    icon: History,
    iconClass: "bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    hoverClass: "hover:border-violet-500/40",
  },
];

export const AdminHomePage: React.FC = () => {
  const { data: users } = useUsers();
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const total = (summary?.green ?? 0) + (summary?.red ?? 0) + (summary?.gray ?? 0);

  const statItems: StatItem[] = useMemo(() => [
    {
      title: 'Total Indicadores',
      value: total,
      icon: Activity,
      description: 'Registrados en el sistema',
      gradient: 'from-slate-500 to-slate-600',
    },
    {
      title: 'Cumplen',
      value: summary?.green ?? 0,
      icon: CheckCircle2,
      description: 'Semáforo en verde',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'No Cumplen',
      value: summary?.red ?? 0,
      icon: XCircle,
      description: 'Semáforo en rojo',
      gradient: 'from-red-500 to-orange-500',
    },
    {
      title: 'Usuarios Activos',
      value: users?.length ?? 0,
      icon: Users,
      description: 'Registrados en la plataforma',
      gradient: 'from-blue-500 to-cyan-500',
    },
  ], [summary, total, users]);

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      setExportError(null);
      setIsExporting(format);
      await downloadExport(format);
    } catch (err: any) {
      setExportError(err.message || 'Error al generar el documento');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {exportError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{exportError}</p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setExportError(null)}>Cerrar</Button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panel de Administración</h2>
        <p className="mt-1 text-muted-foreground">Gestión global del sistema: usuarios, auditoría y exportación de datos.</p>
      </div>

      {/* ── Stats Cards with real data ── */}
      {isSummaryLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <StatsCards items={statItems} />
      )}

      {/* ── Accesos rápidos de control y auditoría ── */}
      <div className="grid gap-6 md:grid-cols-3">
        {adminModules.map((module) => (
          <Link key={module.href} to={module.href} className="block">
            <Card
              className={cn(
                "h-full border-border bg-card shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:bg-accent/30 hover:shadow-md",
                module.hoverClass,
              )}
            >
              <CardHeader>
                <div className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl", module.iconClass)}>
                  <module.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">
                  {module.title}
                </CardTitle>
                <CardDescription className="leading-relaxed text-muted-foreground">
                  {module.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Exportación Global ── */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="border-b border-border/30 bg-muted/10">
          <CardTitle className="text-lg">Exportación Global de Datos</CardTitle>
          <CardDescription>Genera reportes consolidados del período actual con fichas técnicas y gráficas.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              onClick={() => handleExport('xlsx')}
              disabled={isExporting !== null}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isExporting === 'xlsx'
                ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                : <Download className="mr-2 h-4 w-4" />
              }
              Exportar Excel (.xlsx)
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {isExporting === 'pdf'
                ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                : <Download className="mr-2 h-4 w-4" />
              }
              Exportar PDF con Fichas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
