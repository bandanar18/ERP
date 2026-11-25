import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CheckCircle2, Download, Eye, FileSpreadsheet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "../api/dashboard.api";
import { reportApi } from "../api/report.api";
import { exportApi } from "../api/export.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcSummaryCards } from "../components/QcSummaryCards";
import { QcTrendChart } from "../components/QcTrendChart";
import { QcTrafficLight } from "../components/QcTrafficLight";
import { QcCard, QcPageHeader, QcPrimaryButton, QcSecondaryButton } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";
import { QcPagination } from "../components/QcPagination";
import { useQcPermission } from "../hooks/useQcPermission";

export const DirectorDashboardPage = () => {
  const { isReadOnly } = useQcPermission();
  const summary = useQuery({ queryKey: ["qc-summary"], queryFn: dashboardApi.summary });
  const trend = useQuery({ queryKey: ["qc-trend"], queryFn: dashboardApi.complianceTrend });
  const report = useQuery({ queryKey: ["qc-performance-report"], queryFn: () => reportApi.performance() });

  const handleExport = async (kind: "pdf" | "xlsx") => {
    try {
      if (kind === "pdf") {
        await exportApi.pdf({});
      } else {
        await exportApi.xlsx({});
      }
      toast.success("Informe generado correctamente");
    } catch {
      // El api-client ya notifica el error.
    }
  };

  const processNames = Object.keys(report.data?.byProcess ?? {});

  const matrixItems = useMemo(() => {
    if (!report.data) return [];
    return processNames.flatMap((name) =>
      report.data.byProcess[name].map((item) => ({ indicator: item.indicator, status: item.status }))
    );
  }, [report.data, processNames]);

  const MATRIX_PAGE_SIZE = 9;
  const [matrixPage, setMatrixPage] = useState(1);
  useEffect(() => {
    setMatrixPage(1);
  }, [matrixItems.length]);
  const pagedMatrix = matrixItems.slice((matrixPage - 1) * MATRIX_PAGE_SIZE, matrixPage * MATRIX_PAGE_SIZE);

  return (
    <QcAppShell active="Resumen" crumb={<>Inicio / <strong>Panel de dirección</strong></>}>
      <QcPageHeader
        title="Panel de dirección"
        subtitle="Visión ejecutiva del cumplimiento del sistema de gestión de calidad"
        actions={
          <>
            {isReadOnly ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-bold text-sky-700">
                <Eye className="size-3.5" />
                Modo solo lectura
              </span>
            ) : null}
            <QcSecondaryButton onClick={() => handleExport("xlsx")}>
              <FileSpreadsheet className="size-4" />
              Exportar XLSX
            </QcSecondaryButton>
            <QcPrimaryButton onClick={() => handleExport("pdf")}>
              <Download className="size-4" />
              Exportar PDF
            </QcPrimaryButton>
          </>
        }
      />

      {summary.data ? <QcSummaryCards summary={summary.data} /> : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <QcCard className="p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-[#101f19]">Tendencia de cumplimiento</h2>
            <p className="text-[11px] text-[#7c9186]">Evolución por período de reporte</p>
          </div>
          {trend.isLoading ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-[#f2f7f4]" />
          ) : trend.data && trend.data.length > 0 ? (
            <QcTrendChart data={trend.data} />
          ) : (
            <QcEmptyState title="Sin tendencia" description="Aún no hay mediciones para graficar." />
          )}
        </QcCard>

        <QcCard className="p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-[#101f19]">Rendimiento por proceso</h2>
            <p className="text-[11px] text-[#7c9186]">Cumplimiento consolidado de los procesos</p>
          </div>

          {report.isLoading ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-[#f2f7f4]" />
          ) : report.data ? (
            <div className="grid gap-2.5">
              <div className="flex items-center gap-4 rounded-lg border border-[#e2ece6] bg-[#fbfdfc] px-4 py-3">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#101f19]">
                  <BarChart3 className="size-4 text-[#047857]" />
                  Cumplimiento global
                </div>
                <span className="ml-auto text-[22px] font-bold text-[#101f19]">
                  {report.data.totalIndicators > 0
                    ? `${Math.round((report.data.complying / report.data.totalIndicators) * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 rounded-lg border border-[#d1fae5] bg-[#f0fdf4] px-4 py-3">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-[12px] font-semibold text-emerald-800">
                    {report.data.complying} cumplen
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[#fee2e2] bg-[#fef2f2] px-4 py-3">
                  <XCircle className="size-4 text-red-600" />
                  <span className="text-[12px] font-semibold text-red-800">
                    {report.data.notComplying} no cumplen
                  </span>
                </div>
              </div>

              <div className="mt-1 max-h-[190px] space-y-2 overflow-y-auto pr-1">
                {processNames.map((name) => {
                  const items = report.data!.byProcess[name];
                  const green = items.filter((i) => i.status === "GREEN").length;
                  const pct = items.length > 0 ? Math.round((green / items.length) * 100) : 0;
                  return (
                    <div key={name} className="rounded-lg border border-[#e2ece6] px-3.5 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-[12px] font-semibold text-[#101f19]">{name}</span>
                        <span className="shrink-0 text-[11px] font-bold text-[#047857]">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e2ece6]">
                        <div
                          className="h-full rounded-full bg-[#10b981] transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Link
            to="/quality-control/reportes"
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#047857] hover:underline"
          >
            Ver informe de rendimiento completo <ArrowRight className="size-3.5" />
          </Link>
        </QcCard>
      </div>

      <div className="mt-5">
        <div className="mb-3">
          <h2 className="text-[14px] font-bold text-[#101f19]">Matriz consolidada</h2>
          <p className="text-[11px] text-[#7c9186]">Estado de cada indicador por proceso</p>
        </div>
        <QcCard className="overflow-hidden">
          {matrixItems.length > 0 ? (
            <>
              <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedMatrix.map((item, index) => (
                  <div
                    key={`${item.indicator}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e2ece6] px-3.5 py-2.5"
                  >
                    <span className="min-w-0 truncate text-[12px] font-medium text-[#101f19]">{item.indicator}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <QcTrafficLight status={item.status} compact />
                    </span>
                  </div>
                ))}
              </div>
              <QcPagination
                page={matrixPage}
                pageSize={MATRIX_PAGE_SIZE}
                total={matrixItems.length}
                onPageChange={setMatrixPage}
              />
            </>
          ) : (
            <div className="p-4">
              <QcEmptyState title="Sin datos de rendimiento" description="Aún no hay mediciones registradas." />
            </div>
          )}
        </QcCard>
      </div>
    </QcAppShell>
  );
};
