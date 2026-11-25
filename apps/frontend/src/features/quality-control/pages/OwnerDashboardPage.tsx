import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Boxes, ClipboardPlus, FolderKanban } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { processApi } from "../api/process.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcSummaryCards } from "../components/QcSummaryCards";
import { QcMatrixTable } from "../components/QcMatrixTable";
import { QcCard, QcPageHeader, QcPrimaryButton } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";

export const OwnerDashboardPage = () => {
  const summary = useQuery({ queryKey: ["qc-owner-summary"], queryFn: dashboardApi.ownerSummary });
  const processes = useQuery({ queryKey: ["qc-my-processes"], queryFn: processApi.mine });
  const matrix = useQuery({ queryKey: ["qc-matrix"], queryFn: dashboardApi.matrix });

  const myProcessCodes = useMemo(
    () => new Set((processes.data ?? []).map((p) => p.code)),
    [processes.data]
  );

  const myMatrix = useMemo(
    () => (matrix.data ?? []).filter((entry) => myProcessCodes.has(entry.processCode)),
    [matrix.data, myProcessCodes]
  );

  return (
    <QcAppShell active="Resumen" crumb={<>Inicio / <strong>Panel de proceso</strong></>}>
      <QcPageHeader
        title="Mi panel de proceso"
        subtitle="Indicadores, mediciones y cumplimiento de tus procesos asignados"
        actions={
          <Link to="/quality-control/mediciones">
            <QcPrimaryButton>
              <ClipboardPlus className="size-4" />
              Cargar medición
            </QcPrimaryButton>
          </Link>
        }
      />

      {summary.data ? <QcSummaryCards summary={summary.data} /> : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <QcCard className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-[#101f19]">
            <Boxes className="size-4 text-[#047857]" />
            Mis procesos
          </h2>
          {processes.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[46px] animate-pulse rounded-lg bg-[#f2f7f4]" />
              ))}
            </div>
          ) : processes.data && processes.data.length > 0 ? (
            <div className="grid gap-2">
              {processes.data.map((process) => {
                const count = process.qc_indicators?.length ?? 0;
                return (
                  <div
                    key={process.id}
                    className="rounded-lg border border-[#e2ece6] bg-[#fbfdfc] px-3.5 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                        {process.code}
                      </span>
                      <span className="text-[10px] font-semibold text-[#9db0a5]">{count} indicadores</span>
                    </div>
                    <p className="mt-1.5 text-[12px] font-semibold text-[#101f19]">{process.name}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <QcEmptyState
              title="Sin procesos asignados"
              description="Contacta a un administrador para que te asigne procesos."
            />
          )}
        </QcCard>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <FolderKanban className="size-4 text-[#047857]" />
            <h2 className="text-[14px] font-bold text-[#101f19]">Indicadores de mis procesos</h2>
          </div>
          {matrix.isLoading ? (
            <div className="h-[320px] animate-pulse rounded-xl border border-[#e2ece6] bg-[#f2f7f4]" />
          ) : (
            <QcMatrixTable entries={myMatrix} />
          )}
        </div>
      </div>
    </QcAppShell>
  );
};
