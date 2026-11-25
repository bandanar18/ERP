import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/features/executive/components/ui/card';
import { Badge } from '@/features/executive/components/ui/badge';
import { buttonVariants } from '@/features/executive/components/ui/button';
import { Input } from '@/features/executive/components/ui/input';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Search,
  Target,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { formatIndicatorValue, formatTarget } from '../../utils/indicator-format';

type StatusStyle = {
  label: string
  icon: LucideIcon
  className: string
}

const getMeasurementStatus = (
  measurement?: { status?: string },
): StatusStyle => {
  switch (measurement?.status) {
    case "SUBMITTED":
      return {
        label: "En revisión",
        icon: AlertCircle,
        className: "border-sky-700 bg-sky-600 text-white shadow-sm",
      }

    case "APPROVED":
      return {
        label: "Aprobado",
        icon: CheckCircle2,
        className: "border-emerald-700 bg-emerald-600 text-white shadow-sm",
      }

    case "REJECTED":
      return {
        label: "Rechazado",
        icon: XCircle,
        className: "border-red-700 bg-red-600 text-white shadow-sm",
      }

    default:
      return {
        label: "Pendiente de medición",
        icon: Clock3,
        className: "border-amber-600 bg-amber-500 text-white shadow-sm",
      }
  }
}

function MetricBox({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  const isEmpty = value === "Sin medición" || value === "No definida"

  return (
    <div className="min-h-[84px] rounded-xl border border-border bg-background/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p
        className={[
          "mt-1 line-clamp-2 text-base font-bold leading-5",
          isEmpty
            ? "text-muted-foreground"
            : emphasis
              ? "text-primary"
              : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  )
}

function IndicatorCard({ indicator }: { indicator: any }) {
  const version = indicator.versions?.[0]
  const latest = version?.measurements?.[0]
  const target = version?.targets?.[0]
  const status = getMeasurementStatus(latest)
  const StatusIcon = status.icon

  const lastDate = latest?.period?.startsAt
    ? new Date(latest.period.startsAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <Card className="flex min-h-[365px] h-full flex-col overflow-hidden border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <CardHeader className="min-h-[126px] border-b border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Target className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2 min-h-10 text-[15px] leading-5 text-card-foreground">
              {indicator.name}
            </CardTitle>

            <CardDescription className="mt-1 truncate">
              {indicator.processName}
            </CardDescription>

            <Badge
              variant="outline"
              className="mt-2 border-primary/20 bg-primary/5 font-mono text-[10px] font-semibold text-primary"
            >
              {indicator.code}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="mb-4 flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          <span>Última carga: {lastDate ?? "Sin registros"}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="Resultado"
            emphasis
            value={formatIndicatorValue(latest?.value, target?.unit)}
          />

          <MetricBox
            label="Meta"
            value={formatTarget(version?.direction, target?.targetValue, target?.unit)}
          />
        </div>

        <div className="mt-4 flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 px-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
              <Activity className="size-3.5" />
            </div>

            <span className="text-sm font-medium text-foreground">
              Estado de carga
            </span>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 gap-1.5 border px-2.5 py-1 text-xs font-bold ${status.className}`}
          >
            <StatusIcon className="size-3.5" aria-hidden="true" />
            {status.label}
          </Badge>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
          <Link
            to={`/owner/indicadores/${indicator.id}`}
            className={buttonVariants({
              variant: "outline",
              className: "h-9 border-border bg-background font-semibold hover:bg-muted",
            })}
          >
            Ver detalle
          </Link>

          <Link
            to={`/owner/indicadores/${indicator.id}/carga`}
            className={buttonVariants({
              className: "h-9 font-semibold shadow-sm",
            })}
          >
            Registrar
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export const OwnerIndicatorsPage: React.FC = () => {
  const { data: processes, isLoading, error } = useMyProcesses();
  const [searchTerm, setSearchTerm] = useState('');
  const [processFilter, setProcessFilter] = useState('');

  const allIndicators = useMemo(
    () =>
      processes?.flatMap((p: any) =>
        (p.indicators || []).map((ind: any) => ({
          ...ind,
          processName: p.name,
          processId: p.id,
        })),
      ) || [],
    [processes],
  );

  const filtered = useMemo(
    () =>
      allIndicators.filter((ind: any) => {
        const matchesSearch =
          ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ind.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProcess = !processFilter || ind.processId === processFilter;
        return matchesSearch && matchesProcess;
      }),
    [allIndicators, searchTerm, processFilter],
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mis indicadores</h2>
        <p className="mt-1 text-muted-foreground">
          {filtered.length} de {allIndicators.length} indicadores asignados.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={processFilter}
          onChange={(e) => setProcessFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los procesos</option>
          {processes?.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center flex items-center justify-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error al cargar indicadores.</span>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground/80 mb-2">
              {searchTerm || processFilter
                ? 'Sin resultados'
                : 'No hay indicadores asignados'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              {searchTerm || processFilter
                ? 'Intenta con otros términos de búsqueda o seleccioná otro proceso.'
                : 'Aún no tienes indicadores asignados. Contactá al administrador.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* ── Indicator cards ── */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ind: any) => (
            <IndicatorCard key={ind.id} indicator={ind} />
          ))}
        </div>
      )}
    </div>
  );
};

