import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gauge } from "lucide-react";
import type { QcMatrixEntry } from "../types";
import { QC_FREQUENCY_LABELS } from "../types";
import { QcTrafficLight } from "./QcTrafficLight";
import { QcEmptyState } from "./QcEmptyState";
import { QcPagination } from "./QcPagination";

const DIRECTION_HINTS: Record<string, string> = {
  AT_LEAST: "≥",
  AT_MOST: "≤",
  RANGE: "~",
};

function formatValue(value: number | null, unit: string | null) {
  if (value === null || value === undefined) return "—";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

export function QcMatrixTable({
  entries,
  variant = "table",
  pageSize = 9,
}: {
  entries: QcMatrixEntry[];
  variant?: "table" | "cards";
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setPage((current) => {
      const max = Math.max(1, Math.ceil(entries.length / pageSize));
      return Math.min(current, max);
    });
  }, [entries.length, pageSize]);

  // Force cards on mobile regardless of variant
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (entries.length === 0) {
    return (
      <QcEmptyState
        title="Sin indicadores"
        description="Aún no hay indicadores registrados para este alcance."
      />
    );
  }

  const safePage = Math.min(page, Math.max(1, Math.ceil(entries.length / pageSize)));
  const paged = entries.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showCards = isMobile || variant === "cards";

  return (
    <div className="overflow-hidden rounded-xl border border-[#dce8e0] bg-white">
      {showCards ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((entry) => (
            <Link
              key={entry.id}
              to={`/quality-control/indicadores/${entry.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-[#dce8e0] bg-white p-4 transition-[border-color,box-shadow] hover:border-[#a7f3d0] hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#047857] via-[#10b981] to-[#34d399] opacity-80" />
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfdf5] text-[#047857]">
                  <Gauge className="size-5 stroke-[1.8]" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#101f19]">{entry.name}</span>
                  <span className="block text-[10px] font-medium tracking-wide text-[#9db0a5]">{entry.code}</span>
                </div>
                <QcTrafficLight status={entry.complianceStatus} compact />
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="inline-flex shrink-0 rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                  {entry.processCode}
                </span>
                <span className="min-w-0 truncate text-[11px] font-medium text-[#5b7267]">{entry.process}</span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#eef4f0] bg-[#fbfdfc] px-3 py-2">
                <span className="text-[11px] font-semibold text-[#7c9186]">
                  {QC_FREQUENCY_LABELS[entry.frequency] ?? entry.frequency}
                  {entry.direction ? ` · ${DIRECTION_HINTS[entry.direction]} ${formatValue(entry.targetValue, entry.unit)}` : ""}
                </span>
                <span className="text-[13px] font-bold text-[#101f19]">
                  {formatValue(entry.latestMeasurement, entry.unit)}
                </span>
              </div>

              <p className="mt-2.5 line-clamp-2 min-h-[2rem] text-[11px] leading-snug text-[#7c9186]">
                {entry.observation ?? "Sin observaciones."}
              </p>

              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#047857] opacity-0 transition-opacity group-hover:opacity-100">
                Ver detalle <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e2ece6] bg-[#f7faf8]">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Estado</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Proceso</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Indicador</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Frecuencia</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Meta</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Última medición</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Observación</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((entry) => (
                <tr
                  key={entry.id}
                  className="group border-b border-[#eef4f0] transition-colors last:border-0 hover:bg-[#f7fcf9]"
                >
                  <td className="px-4 py-3">
                    <QcTrafficLight status={entry.complianceStatus} compact />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                        {entry.processCode}
                      </span>
                      <span className="text-[12px] font-medium text-[#5b7267]">{entry.process}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-[13px] font-semibold text-[#101f19]">{entry.name}</span>
                    <span className="block text-[10px] font-medium text-[#9db0a5]">{entry.code}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#5b7267]">
                    {QC_FREQUENCY_LABELS[entry.frequency] ?? entry.frequency}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold text-[#101f19]">
                    {entry.direction ? (
                      <span>
                        {DIRECTION_HINTS[entry.direction]} {formatValue(entry.targetValue, entry.unit)}
                      </span>
                    ) : (
                      formatValue(entry.targetValue, entry.unit)
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#101f19]">
                    {formatValue(entry.latestMeasurement, entry.unit)}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[12px] text-[#5b7267]" title={entry.observation ?? ""}>
                    {entry.observation ?? "—"}
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      to={`/quality-control/indicadores/${entry.id}`}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-[#9db0a5] transition-colors hover:bg-[#ecfdf5] hover:text-[#047857]"
                      aria-label={`Ver detalle de ${entry.name}`}
                    >
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QcPagination page={safePage} pageSize={pageSize} total={entries.length} onPageChange={setPage} />
    </div>
  );
}
