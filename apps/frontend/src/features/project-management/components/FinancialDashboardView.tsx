import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Search,
  Printer,
} from "lucide-react";
import { PmAppShell } from "./PmAppShell";
import { ErpPageHeader } from "./ErpPageHeader";
import { ErpMetricStrip, type ErpMetric } from "./ErpMetricStrip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { payablesService } from "../api";
import type { PayablesOverview } from "../interfaces/payables.types";
import { usePermission } from "../hooks/usePermission";
import { FinancialReportModal } from "./FinancialReportModal";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

export function FinancialDashboardView() {
  const navigate = useNavigate();
  const { canPrintFinancialReport } = usePermission();
  const [data, setData] = useState<PayablesOverview | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payablesService.getOverview();
      setData(res);
    } catch (err: any) {
      console.error("Error al cargar resumen financiero:", err);
      setError(err.message || "Error al cargar datos financieros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];
    if (!search.trim()) return data.projects;
    const q = search.toLowerCase();
    return data.projects.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        (p.shortName && p.shortName.toLowerCase().includes(q)) ||
        (p.company?.name && p.company.name.toLowerCase().includes(q))
    );
  }, [data, search]);

  const metrics: ErpMetric[] = useMemo(() => {
    if (!data) return [];
    const { globalSummary } = data;
    const paidPercent =
      globalSummary.totalDebt > 0
        ? Math.round((globalSummary.totalPaid / globalSummary.totalDebt) * 100)
        : 0;

    return [
      {
        title: "Costo Real Acumulado",
        value: fmt(globalSummary.totalActualCost ?? 0),
        change: "Total gastado en proyectos",
        rail: "bg-[#b9561d]",
      },
      {
        title: "Total Cobrado",
        value: fmt(globalSummary.totalCollected ?? 0),
        change: "Ingresos percibidos de clientes",
        rail: "bg-[#376850]",
      },
      {
        title: "Deuda Total Comprometida",
        value: fmt(globalSummary.totalDebt),
        change: `${globalSummary.totalProjects} proyecto${globalSummary.totalProjects !== 1 ? "s" : ""} registrados`,
        rail: "bg-[#d9772f]",
      },
      {
        title: "Total Pagado",
        value: fmt(globalSummary.totalPaid),
        change: `${paidPercent}% saldado del total`,
        rail: "bg-[#4c9b7a]",
      },
      {
        title: "Por Pagar",
        value: fmt(globalSummary.totalPending),
        change: globalSummary.totalPending > 0 ? "Pendiente de desembolso" : "Sin obligaciones pendientes",
        rail: globalSummary.totalPending > 0 ? "bg-[#c85454]" : "bg-[#4e5558]",
      },
    ];
  }, [data]);

  return (
    <PmAppShell
      active="Finanzas"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Panel Financiero</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Finanzas / Panel Financiero"
        title="Panel Financiero"
        copy="Seguimiento centralizado de costos reales, cobros, deudas y cuentas por pagar por proyecto."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canPrintFinancialReport && (
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-xs font-bold text-[#b9561d] hover:border-[#b9561d] hover:text-[#111416] transition-colors shadow-2xs"
                title="Generar e imprimir informe de pagos y deudas"
              >
                <Printer className="h-3.5 w-3.5" />
                Emitir Reporte de Pagos
              </button>
            )}
            <Link
              to="/project-management/explorar"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-xs font-bold text-[#b9561d] hover:border-[#b9561d] hover:text-[#111416]"
            >
              Explorador de Proyectos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-[#a84730]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-xs font-bold text-[#4e5558]">Cargando métricas financieras...</p>
          </div>
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-8 text-center text-[#4e5558]">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[#c85454]" />
          <p className="font-bold">No se pudieron obtener datos financieros</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ErpMetricStrip metrics={metrics} />

          {/* Tabla de proyectos y deudas */}
          <div className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#d8d0c4] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111416]">Estado de Cuentas por Pagar por Proyecto</h3>
                <p className="text-xs text-[#4e5558]">
                  {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? "s" : ""} con seguimiento de obligaciones
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4e5558]" />
                <Input
                  type="text"
                  placeholder="Buscar por código, nombre o empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 rounded-lg border-[#d8d0c4] bg-white pl-8 text-xs"
                />
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4e5558]">
                No se encontraron proyectos coincidentes.
              </div>
            ) : (
              <>
                {/* Vista Móvil y Tablet: Tarjetas Ejecutivas Simétricas */}
                <div className="block lg:hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-[#fffdf9]">
                    {filteredProjects.map((p) => {
                      const pct =
                        p.summary.totalDebt > 0
                          ? Math.round((p.summary.totalPaid / p.summary.totalDebt) * 100)
                          : 0;

                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-3.5 shadow-xs hover:border-[#b9561d]/50 hover:shadow-sm transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Cabecera de la tarjeta */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge className="shrink-0 rounded-md border border-[#edb6a5] bg-[#fff0eb] px-1.5 py-0.5 text-[10px] font-bold text-[#a84730]">
                                    {p.code}
                                  </Badge>
                                  <Link
                                    to={`/project-management/detalle/${p.id}`}
                                    className="font-bold text-sm text-[#111416] hover:text-[#b9561d] hover:underline truncate"
                                    title={p.fullName || p.shortName || p.code}
                                  >
                                    {p.fullName || p.shortName || p.code}
                                  </Link>
                                </div>
                                <span className="text-xs text-[#4e5558] block truncate mt-1" title={p.company?.name || "Sin empresa"}>
                                  {p.company?.name || "Sin empresa asignada"}
                                </span>
                              </div>
                              <div className="shrink-0">
                                {p.summary.totalCount === 0 ? (
                                  <span className="text-[10px] text-[#8d918f] font-medium">Sin registros</span>
                                ) : p.summary.openCount === 0 ? (
                                  <Badge className="rounded-md border border-[#a7c9b4] bg-[#edf3ec] text-[#376850] text-[10px] font-bold whitespace-nowrap">
                                    Al día
                                  </Badge>
                                ) : (
                                  <Badge className="rounded-md border border-[#edb6a5] bg-[#fff0eb] text-[#a84730] text-[10px] font-bold whitespace-nowrap">
                                    {p.summary.openCount} abierta{p.summary.openCount !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Grid simétrico de métricas financieras */}
                            <div className="mt-3 grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 text-xs">
                              {/* 1. Costo Real / Cobrado */}
                              <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2 flex flex-col justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block truncate">
                                  Costo / Cobro
                                </span>
                                <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                                  <span className="font-bold text-[#b9561d] text-xs truncate">
                                    <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Real:</strong>
                                    {fmt(p.summary.actualCost ?? 0)}
                                  </span>
                                  <span className="font-semibold text-[#376850] text-xs truncate mt-0.5">
                                    <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Cob:</strong>
                                    {fmt(p.summary.collectedAmount ?? 0)}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Deuda Total / Pagado */}
                              <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2 flex flex-col justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block truncate">
                                  Deuda / Pagado
                                </span>
                                <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                                  <span className="font-medium text-[#111416] text-xs truncate">
                                    <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Deuda:</strong>
                                    {fmt(p.summary.totalDebt)}
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5 truncate">
                                    <span className="font-semibold text-[#376850] text-xs">
                                      {fmt(p.summary.totalPaid)}
                                    </span>
                                    {p.summary.totalDebt > 0 && (
                                      <span className="text-[10px] text-[#4e5558]">
                                        ({pct}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 3. Por Pagar */}
                              <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2 flex flex-col justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block truncate">
                                  Por Pagar
                                </span>
                                <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                                  <span
                                    className={cn(
                                      "font-bold text-xs truncate",
                                      p.summary.totalPending > 0 ? "text-[#a84730]" : "text-[#376850]"
                                    )}
                                  >
                                    {fmt(p.summary.totalPending)}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-[10px] font-medium mt-0.5 truncate",
                                      p.summary.totalPending > 0 ? "text-[#a84730]" : "text-[#376850]"
                                    )}
                                  >
                                    {p.summary.totalPending > 0 ? "Pendiente" : "Al día"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Pie de tarjeta */}
                          <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#d8d0c4]/40 text-xs">
                            <span className="text-[11px] text-[#4e5558]">
                              {p.summary.openCount > 0
                                ? `${p.summary.openCount} obligación(es) pendiente(s)`
                                : "Sin compromisos pendientes"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/project-management/detalle/${p.id}/cuentas-por-pagar`)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 py-1.5 text-xs font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:bg-[#fff0eb]"
                            >
                              <span>Gestión Financiera</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vista Escritorio: Tabla Panorámica 100% Fluida, Simétrica y sin Scroll en PC */}
                <div className="hidden lg:block overflow-x-auto scrollbar-thin">
                  <table className="w-full table-fixed border-collapse text-left text-xs">
                    <colgroup>
                      <col className="w-[18%]" />
                      <col className="w-[14%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[11%]" />
                      <col className="w-[10%]" />
                      <col className="w-[15%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead className="border-b border-[#d8d0c4] bg-[#f5f0e8] text-[10px] font-bold uppercase tracking-[0.06em] text-[#4e5558]">
                      <tr>
                        <th className="py-3 px-3 pl-4 text-left whitespace-nowrap">Proyecto</th>
                        <th className="py-3 px-3 text-left whitespace-nowrap">Empresa</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">Costo Real</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">Cobrado</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">Deuda Total</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">Pagado</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">Por Pagar</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">Obligaciones</th>
                        <th className="py-3 px-3 pr-4 text-center whitespace-nowrap">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece6dc]">
                      {filteredProjects.map((p) => {
                        const pct =
                          p.summary.totalDebt > 0
                            ? Math.round((p.summary.totalPaid / p.summary.totalDebt) * 100)
                            : 0;

                        return (
                          <tr key={p.id} className="hover:bg-[#fbf8f3] transition-colors">
                            <td className="py-3 px-3 pl-4 text-left align-middle">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge className="shrink-0 rounded-md border border-[#edb6a5] bg-[#fff0eb] px-1.5 py-0.5 text-[10px] font-bold text-[#a84730]">
                                  {p.code}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/project-management/detalle/${p.id}`}
                                    className="font-bold text-[#111416] hover:text-[#b9561d] hover:underline block truncate text-xs"
                                    title={p.fullName || p.shortName || p.code}
                                  >
                                    {p.fullName || p.shortName || p.code}
                                  </Link>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-left align-middle">
                              <span className="text-[#4e5558] block truncate text-xs" title={p.company?.name || "Sin empresa"}>
                                {p.company?.name || "Sin empresa"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right align-middle font-bold text-[#b9561d] tabular-nums whitespace-nowrap text-xs">
                              {fmt(p.summary.actualCost ?? 0)}
                            </td>
                            <td className="py-3 px-3 text-right align-middle font-semibold text-[#376850] tabular-nums whitespace-nowrap text-xs">
                              {fmt(p.summary.collectedAmount ?? 0)}
                            </td>
                            <td className="py-3 px-3 text-right align-middle font-medium text-[#111416] tabular-nums whitespace-nowrap text-xs">
                              {fmt(p.summary.totalDebt)}
                            </td>
                            <td className="py-3 px-3 text-right align-middle tabular-nums whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5 leading-none">
                                <span className="font-semibold text-[#376850] text-xs">
                                  {fmt(p.summary.totalPaid)}
                                </span>
                                {p.summary.totalDebt > 0 && (
                                  <span className="text-[10px] text-[#4e5558] font-normal">
                                    ({pct}%)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right align-middle tabular-nums whitespace-nowrap">
                              <span
                                className={cn(
                                  "font-bold text-xs",
                                  p.summary.totalPending > 0 ? "text-[#a84730]" : "text-[#376850]"
                                )}
                              >
                                {fmt(p.summary.totalPending)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                              {p.summary.totalCount === 0 ? (
                                <span className="text-[10px] text-[#8d918f] font-medium">Sin registros</span>
                              ) : p.summary.openCount === 0 ? (
                                <Badge className="rounded-md border border-[#a7c9b4] bg-[#edf3ec] text-[#376850] text-[10px] font-bold">
                                  Al día
                                </Badge>
                              ) : (
                                <Badge className="rounded-md border border-[#edb6a5] bg-[#fff0eb] text-[#a84730] text-[10px] font-bold">
                                  {p.summary.openCount} abierta{p.summary.openCount !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3 pr-4 text-center align-middle whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/project-management/detalle/${p.id}/cuentas-por-pagar`)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 py-1.5 text-xs font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:bg-[#fff0eb] whitespace-nowrap shadow-2xs"
                                title="Ver módulo de Cuentas por Pagar"
                              >
                                <span>Gestión</span>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Reporte Financiero Imprimible */}
      <FinancialReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        globalData={data}
      />
    </PmAppShell>
  );
}
