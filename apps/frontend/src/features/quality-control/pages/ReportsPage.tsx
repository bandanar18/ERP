import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Gauge,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { reportApi } from "../api/report.api";
import { exportApi, type ExportFilters } from "../api/export.api";
import { processApi } from "../api/process.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader, QcPrimaryButton, QcSecondaryButton } from "../components/QcPageHeader";
import { QcTrafficLight } from "../components/QcTrafficLight";
import { QcEmptyState } from "../components/QcEmptyState";
import { cn } from "@/lib/utils";

function formatValue(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const inputClass =
  "h-10 w-full rounded-lg border border-[#d8e6de] bg-white text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-50";

const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#5b7267]";

/* ── Mini-vistas previas de gráfica para el selector de tipo ─────────────── */
function MiniLineChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 30" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 24 13 17l10 4L35 9l11 6 16-12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="24" r="2.2" fill="currentColor" />
      <circle cx="35" cy="9" r="2.2" fill="currentColor" />
      <circle cx="62" cy="3" r="2.2" fill="currentColor" />
    </svg>
  );
}

function MiniBarChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 30" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="17" width="8" height="11" rx="1.5" fill="currentColor" />
      <rect x="16" y="11" width="8" height="17" rx="1.5" fill="currentColor" />
      <rect x="28" y="6" width="8" height="22" rx="1.5" fill="currentColor" />
      <rect x="40" y="13" width="8" height="15" rx="1.5" fill="currentColor" />
      <rect x="52" y="3" width="8" height="25" rx="1.5" fill="currentColor" />
    </svg>
  );
}

/** Filtros del informe: proceso, rango de fechas y tipo de gráfica del PDF. */
function ReportFilters({
  value,
  onChange,
}: {
  value: ExportFilters;
  onChange: (next: ExportFilters) => void;
}) {
  const processes = useQuery({ queryKey: ["qc-processes"], queryFn: processApi.list });
  const activeCount = [value.processId, value.startsAt, value.endsAt].filter(Boolean).length;

  const set = (patch: Partial<ExportFilters>) => onChange({ ...value, ...patch });

  const chartVariant = value.chartVariant ?? "LINE";

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-[#dce8e0] bg-white shadow-[0_1px_3px_rgba(16,31,25,0.05)]">
      {/* Barra de acento superior */}
      <div className="h-1 bg-gradient-to-r from-[#34d399] via-[#059669] to-[#047857]" />

      {/* Cabecera del panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef4f0] bg-[#f7faf8] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#059669] text-white shadow-[0_2px_8px_rgba(5,150,105,0.25)]">
            <SlidersHorizontal className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#101f19]">Filtros del informe</p>
            <p className="text-[11px] text-[#7c9186]">Proceso, rango de fechas y estilo de gráfica</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              {activeCount} {activeCount === 1 ? "filtro activo" : "filtros activos"}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onChange({})}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-colors",
              activeCount > 0
                ? "border-[#d8e6de] bg-white text-[#5b7267] hover:border-[#059669] hover:text-[#047857]"
                : "cursor-not-allowed border-[#e8efeb] bg-[#fbfdfc] text-[#b4c4bb]"
            )}
          >
            <RotateCcw className="size-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Cuerpo del panel */}
      <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)] md:gap-5">
        {/* Proceso */}
        <div>
          <label htmlFor="qc-r-process" className={labelClass}>
            Proceso
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9db0a5]" />
            <select
              id="qc-r-process"
              value={value.processId ?? ""}
              onChange={(e) => set({ processId: e.target.value || undefined })}
              className={cn(inputClass, "appearance-none pl-9 pr-8")}
            >
              <option value="">Todos los procesos</option>
              {(processes.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9db0a5]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m3 6 5 5 5-5" />
            </svg>
          </div>
        </div>

        {/* Rango de fechas unificado */}
        <div>
          <span className={labelClass}>Rango de fechas</span>
          <div className="flex items-center gap-1.5">
            <div className="relative min-w-0 flex-1">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9db0a5]" />
              <input
                id="qc-r-starts"
                type="date"
                aria-label="Fecha inicio"
                value={value.startsAt ?? ""}
                max={value.endsAt ?? undefined}
                onChange={(e) => set({ startsAt: e.target.value || undefined })}
                className={cn(inputClass, "pl-9")}
              />
            </div>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-[#9db0a5]" />
            <div className="relative min-w-0 flex-1">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9db0a5]" />
              <input
                id="qc-r-ends"
                type="date"
                aria-label="Fecha fin"
                value={value.endsAt ?? ""}
                min={value.startsAt ?? undefined}
                onChange={(e) => set({ endsAt: e.target.value || undefined })}
                className={cn(inputClass, "pl-9")}
              />
            </div>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-[#9db0a5]">
            Las mediciones se filtran por el período que cubre el rango.
          </p>
        </div>

        {/* Tipo de gráfica con mini-vistas */}
        <div>
          <span className={labelClass}>Tipo de gráfica</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set({ chartVariant: "LINE" })}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2 transition-all duration-200",
                chartVariant === "LINE"
                  ? "border-[#059669] bg-[#ecfdf5] shadow-[0_2px_10px_rgba(5,150,105,0.15)]"
                  : "border-[#e2ece6] bg-white hover:border-[#a7d9c3]"
              )}
            >
              <MiniLineChart
                className={cn(
                  "h-7 w-full transition-colors",
                  chartVariant === "LINE" ? "text-[#059669]" : "text-[#b4c4bb] group-hover:text-[#7c9186]"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-bold transition-colors",
                  chartVariant === "LINE" ? "text-[#047857]" : "text-[#5b7267]"
                )}
              >
                Línea
              </span>
            </button>
            <button
              type="button"
              onClick={() => set({ chartVariant: "BAR" })}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2 transition-all duration-200",
                chartVariant === "BAR"
                  ? "border-[#059669] bg-[#ecfdf5] shadow-[0_2px_10px_rgba(5,150,105,0.15)]"
                  : "border-[#e2ece6] bg-white hover:border-[#a7d9c3]"
              )}
            >
              <MiniBarChart
                className={cn(
                  "h-7 w-full transition-colors",
                  chartVariant === "BAR" ? "text-[#059669]" : "text-[#b4c4bb] group-hover:text-[#7c9186]"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-bold transition-colors",
                  chartVariant === "BAR" ? "text-[#047857]" : "text-[#5b7267]"
                )}
              >
                Barras
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#eef4f0] bg-[#fbfdfc] px-5 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9db0a5]">Aplicando:</span>
          {value.processId ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Proceso: {processes.data?.find((p) => p.id === value.processId)?.name ?? "Seleccionado"}
              <button
                type="button"
                onClick={() => set({ processId: undefined })}
                aria-label="Quitar proceso"
                className="grid size-3.5 place-items-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}
          {value.startsAt ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Desde {value.startsAt.split("-").reverse().join("/")}
              <button
                type="button"
                onClick={() => set({ startsAt: undefined })}
                aria-label="Quitar fecha inicio"
                className="grid size-3.5 place-items-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}
          {value.endsAt ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Hasta {value.endsAt.split("-").reverse().join("/")}
              <button
                type="button"
                onClick={() => set({ endsAt: undefined })}
                aria-label="Quitar fecha fin"
                className="grid size-3.5 place-items-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const ReportsPage = () => {
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const [filters, setFilters] = useState<ExportFilters>({});

  const report = useQuery({ queryKey: ["qc-performance-report"], queryFn: () => reportApi.performance() });

  const processNames = Object.keys(report.data?.byProcess ?? {});

  const handleExport = async (kind: "pdf" | "xlsx") => {
    setExporting(kind);
    try {
      if (kind === "pdf") {
        await exportApi.pdf(filters);
      } else {
        await exportApi.xlsx(filters);
      }
      toast.success(kind === "pdf" ? "Informe PDF generado" : "Informe XLSX generado");
    } catch {
      // El api-client ya notifica el error.
    } finally {
      setExporting(null);
    }
  };

  const globalPct =
    report.data && report.data.totalIndicators > 0
      ? Math.round((report.data.complying / report.data.totalIndicators) * 100)
      : 0;

  return (
    <QcAppShell active="Reportes" crumb={<>Inicio / <strong>Reportes</strong></>}>
      <QcPageHeader
        title="Informe de rendimiento"
        subtitle="Cumplimiento consolidado de indicadores por proceso, con exportación a PDF y XLSX"
        actions={
          <>
            <QcSecondaryButton onClick={() => handleExport("xlsx")} disabled={exporting !== null}>
              {exporting === "xlsx" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
              Exportar XLSX
            </QcSecondaryButton>
            <QcPrimaryButton onClick={() => handleExport("pdf")} disabled={exporting !== null}>
              {exporting === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Exportar PDF
            </QcPrimaryButton>
          </>
        }
      />

      <ReportFilters value={filters} onChange={setFilters} />

      {report.isLoading ? (
        <div className="h-[360px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : report.data ? (
        <>
          {/* KPIs globales compactos */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <QcCard className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfdf5] text-[#047857]">
                <Gauge className="size-5 stroke-[1.8]" />
              </span>
              <div className="min-w-0">
                <p className="text-[22px] font-bold leading-none text-[#101f19]">{report.data.totalIndicators}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7c9186]">Indicadores</p>
              </div>
            </QcCard>
            <QcCard className="flex items-center gap-3 border-[#d1fae5] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-5 stroke-[1.8]" />
              </span>
              <div className="min-w-0">
                <p className="text-[22px] font-bold leading-none text-emerald-700">{report.data.complying}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7c9186]">Cumplen</p>
              </div>
            </QcCard>
            <QcCard className="flex items-center gap-3 border-[#fee2e2] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <XCircle className="size-5 stroke-[1.8]" />
              </span>
              <div className="min-w-0">
                <p className="text-[22px] font-bold leading-none text-red-700">{report.data.notComplying}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7c9186]">No cumplen</p>
              </div>
            </QcCard>
            <QcCard className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7c9186]">Global</p>
                <span className="text-[20px] font-bold leading-none text-[#047857]">{globalPct}%</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e2ece6]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#059669] transition-[width] duration-700"
                  style={{ width: `${globalPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-[#9db0a5]">Cumplimiento global</p>
            </QcCard>
          </div>

          {/* Detalle por proceso (tabla compacta) */}
          <QcCard className="mt-5 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4f0] bg-[#f7faf8] px-5 py-3">
              <h2 className="flex items-center gap-2 text-[12px] font-bold text-[#101f19]">
                <BarChart3 className="size-4 text-[#047857]" />
                Detalle por proceso
              </h2>
              <span className="text-[11px] font-semibold text-[#7c9186]">
                {report.data.totalIndicators} {report.data.totalIndicators === 1 ? "indicador" : "indicadores"}
              </span>
            </div>

            {processNames.length > 0 ? (
              <>
              {/* Tabla desktop */}
              <div className="overflow-x-auto hidden lg:block">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <tbody>
                    {processNames.map((name) => {
                      const items = report.data!.byProcess[name];
                      const green = items.filter((i) => i.status === "GREEN").length;
                      const pct = items.length > 0 ? Math.round((green / items.length) * 100) : 0;
                      return (
                        <Fragment key={name}>
                          <tr className="border-b border-[#e2ece6] bg-[#ecfdf5]/50">
                            <td colSpan={3} className="px-5 py-2.5">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[12px] font-bold text-[#101f19]">{name}</span>
                                <span className="rounded-full border border-[#a7f3d0] bg-white px-2 py-0.5 text-[10px] font-bold text-[#047857]">
                                  {items.length} {items.length === 1 ? "indicador" : "indicadores"}
                                </span>
                                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#e2ece6]">
                                  <div
                                    className="h-full rounded-full bg-[#10b981]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="ml-auto text-[12px] font-bold text-[#047857]">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                          {items.map((item, index) => (
                            <tr
                              key={`${name}-${index}`}
                              className="border-b border-[#eef4f0] transition-colors last:border-0 hover:bg-[#f7fcf9]"
                            >
                              <td className="max-w-[380px] truncate px-5 py-2.5 pl-8 text-[12px] font-medium text-[#101f19]">
                                {item.indicator}
                              </td>
                              <td className="px-5 py-2.5 text-right text-[12px] font-bold text-[#101f19]">
                                {formatValue(item.value)}
                              </td>
                              <td className="px-5 py-2.5 text-right">
                                <QcTrafficLight status={item.status ?? "GRAY"} compact />
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards móvil + tablet */}
              <div className="grid gap-3 p-4 lg:hidden">
                {processNames.map((name) => {
                  const items = report.data!.byProcess[name];
                  const green = items.filter((i) => i.status === "GREEN").length;
                  const pct = items.length > 0 ? Math.round((green / items.length) * 100) : 0;
                  return (
                    <div key={name} className="rounded-xl border border-[#dce8e0] bg-[#fbfdfc] p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-[#101f19]">{name}</span>
                        <span className="rounded-full border border-[#a7f3d0] bg-white px-2 py-0.5 text-[10px] font-bold text-[#047857]">
                          {items.length} {items.length === 1 ? "indicador" : "indicadores"}
                        </span>
                        <span className="ml-auto text-[13px] font-bold text-[#047857]">{pct}%</span>
                      </div>
                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#e2ece6]">
                        <div
                          className="h-full rounded-full bg-[#10b981]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="divide-y divide-[#eef4f0]">
                        {items.map((item, index) => (
                          <div
                            key={`${name}-${index}`}
                            className="flex items-center justify-between gap-2 py-2.5"
                          >
                            <span className="min-w-0 truncate text-[12px] font-medium text-[#101f19]">
                              {item.indicator}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[12px] font-bold text-[#101f19]">
                                {formatValue(item.value)}
                              </span>
                              <QcTrafficLight status={item.status ?? "GRAY"} compact />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            ) : (
              <div className="p-4">
                <QcEmptyState
                  title="Sin datos de rendimiento"
                  description="Aún no hay mediciones registradas para generar el informe."
                />
              </div>
            )}
          </QcCard>
        </>
      ) : null}
    </QcAppShell>
  );
};
