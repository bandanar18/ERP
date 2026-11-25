import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Boxes, Gauge, SlidersHorizontal, UsersRound } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcSummaryCards } from "../components/QcSummaryCards";
import { QcTrendChart } from "../components/QcTrendChart";
import { QcMatrixTable } from "../components/QcMatrixTable";
import { QcCard } from "../components/QcPageHeader";
import { QcPageHeader } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";

const SHORTCUTS = [
  {
    label: "Procesos",
    description: "Estructura de procesos y subprocesos",
    icon: Boxes,
    to: "/quality-control/procesos",
  },
  {
    label: "Indicadores",
    description: "Metas, fórmulas y umbrales",
    icon: SlidersHorizontal,
    to: "/quality-control/admin/indicadores",
  },
  {
    label: "Usuarios y roles",
    description: "RBAC, permisos y alcances",
    icon: UsersRound,
    to: "/quality-control/usuarios",
  },
];

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[96px] animate-pulse rounded-xl border border-[#e2ece6] bg-[#f2f7f4]" />
        ))}
      </div>
      <div className="h-[300px] animate-pulse rounded-xl border border-[#e2ece6] bg-[#f2f7f4]" />
    </div>
  );
}

export const AdminDashboardPage = () => {
  const summary = useQuery({ queryKey: ["qc-summary"], queryFn: dashboardApi.summary });
  const trend = useQuery({ queryKey: ["qc-trend"], queryFn: dashboardApi.complianceTrend });
  const matrix = useQuery({ queryKey: ["qc-matrix"], queryFn: dashboardApi.matrix });
  const activePeriod = useQuery({ queryKey: ["qc-active-period"], queryFn: dashboardApi.activePeriod });

  const periodLabel = activePeriod.data
    ? new Date(activePeriod.data.startsAt).toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <QcAppShell active="Resumen" crumb={<>Inicio / <strong>Panel de administración</strong></>}>
      <QcPageHeader
        title="Panel de administración"
        subtitle={
          periodLabel
            ? `Consolidado de cumplimiento · ${periodLabel}`
            : "Consolidado de cumplimiento del sistema de gestión"
        }
        actions={
          <Link
            to="/quality-control/indicadores"
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#059669] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#047857]"
          >
            <Gauge className="size-4" />
            Ver matriz de indicadores
          </Link>
        }
      />

      {summary.isLoading ? (
        <LoadingBlock />
      ) : summary.data ? (
        <QcSummaryCards summary={summary.data} />
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <QcCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-bold text-[#101f19]">Tendencia de cumplimiento</h2>
              <p className="text-[11px] text-[#7c9186]">Indicadores que cumplen vs. no cumplen por período</p>
            </div>
          </div>
          {trend.isLoading ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-[#f2f7f4]" />
          ) : trend.data && trend.data.length > 0 ? (
            <QcTrendChart data={trend.data} />
          ) : (
            <QcEmptyState title="Sin tendencia" description="Aún no hay mediciones para graficar." />
          )}
        </QcCard>

        <div className="space-y-5">
          <QcCard className="p-5">
            <h2 className="mb-3 text-[14px] font-bold text-[#101f19]">Administración</h2>
            <div className="grid gap-2">
              {SHORTCUTS.map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  className="group flex items-center gap-3 rounded-lg border border-[#e2ece6] bg-[#fbfdfc] px-3.5 py-3 transition-[border-color,background-color] hover:border-[#a7f3d0] hover:bg-[#f0faf5]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecfdf5] text-[#047857] transition-colors group-hover:bg-[#d1fae5]">
                    <s.icon className="size-4.5 stroke-[1.7]" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-[#101f19]">{s.label}</span>
                    <span className="block text-[11px] text-[#7c9186]">{s.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </QcCard>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-[#101f19]">Matriz consolidada</h2>
            <p className="text-[11px] text-[#7c9186]">Última medición por indicador con estado de cumplimiento</p>
          </div>
        </div>
        {matrix.isLoading ? (
          <div className="h-[300px] animate-pulse rounded-xl border border-[#e2ece6] bg-[#f2f7f4]" />
        ) : matrix.data ? (
          <QcMatrixTable entries={matrix.data} />
        ) : null}
      </div>
    </QcAppShell>
  );
};
