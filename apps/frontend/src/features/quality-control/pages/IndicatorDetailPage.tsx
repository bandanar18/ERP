import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Calculator, ClipboardCheck, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { indicatorApi } from "../api/indicator.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader } from "../components/QcPageHeader";
import { QcTrafficLight } from "../components/QcTrafficLight";
import { QcEmptyState } from "../components/QcEmptyState";
import {
  QC_DIRECTION_LABELS,
  QC_FREQUENCY_LABELS,
  QC_STATUS_LABELS,
} from "../types";

const PIE_COLORS = ["#10b981", "#fbbf24", "#f87171"];

function formatValue(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(decimals);
}

export const IndicatorDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const detail = useQuery({
    queryKey: ["qc-indicator", id],
    queryFn: () => indicatorApi.detail(id!),
    enabled: !!id,
  });
  const chart = useQuery({
    queryKey: ["qc-indicator-chart", id],
    queryFn: () => indicatorApi.chart(id!),
    enabled: !!id,
  });
  const procurement = useQuery({
    queryKey: ["qc-procurement", id],
    queryFn: () => indicatorApi.procurementDistribution(id!),
    enabled: !!id && detail.data?.chartType === "PIE",
  });

  const activeVersion = useMemo(
    () => detail.data?.versions.find((v) => v.effectiveTo === null) ?? detail.data?.versions[0],
    [detail.data]
  );

  const target = activeVersion?.targets?.[0];
  const measurements = activeVersion?.measurements ?? [];

  const chartData = useMemo(() => {
    return (chart.data ?? []).map((point) => ({
      period: point.period,
      meta: point.meta,
      medicion: point.medicion,
      tendencia: point.tendencia,
    }));
  }, [chart.data]);

  const pieData = useMemo(() => {
    if (!procurement.data) return [];
    return [
      { name: "Confiables", value: procurement.data.confiables },
      { name: "Requieren mejoras", value: procurement.data.requierenMejoras },
      { name: "Suspendidos", value: procurement.data.suspendidos },
    ];
  }, [procurement.data]);

  return (
    <QcAppShell
      active="Matriz de indicadores"
      crumb={
        <>
          Inicio / Matriz de indicadores / <strong>{detail.data?.code ?? "Indicador"}</strong>
        </>
      }
    >
      <Link
        to="/quality-control/indicadores"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#047857] hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Volver a la matriz
      </Link>

      <QcPageHeader
        title={
          <>
            <span className="mr-2 rounded bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-bold text-[#047857] align-middle">
              {detail.data?.code}
            </span>
            {detail.data?.name ?? "Cargando…"}
          </>
        }
        subtitle={
          detail.data?.process
            ? `${detail.data.process.name} · ${QC_FREQUENCY_LABELS[activeVersion?.frequency ?? ""] ?? activeVersion?.frequency ?? ""}`
            : undefined
        }
      />

      {detail.isLoading ? (
        <div className="h-[360px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : detail.data ? (
        <>
          {/* Ficha técnica */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <QcCard className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Frecuencia</p>
              <p className="mt-1.5 text-[14px] font-bold text-[#101f19]">
                {QC_FREQUENCY_LABELS[activeVersion?.frequency ?? ""] ?? activeVersion?.frequency ?? "—"}
              </p>
            </QcCard>
            <QcCard className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Dirección</p>
              <p className="mt-1.5 text-[14px] font-bold text-[#101f19]">
                {QC_DIRECTION_LABELS[activeVersion?.direction ?? ""] ?? activeVersion?.direction ?? "—"}
              </p>
            </QcCard>
            <QcCard className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Meta</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-bold text-[#101f19]">
                <Target className="size-4 text-[#047857]" />
                {formatValue(target?.targetValue, target?.targetValue === Math.round(target?.targetValue ?? 0) ? 0 : 2)}
                {target?.unit ? ` ${target.unit}` : ""}
              </p>
            </QcCard>
            <QcCard className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Mediciones</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-bold text-[#101f19]">
                <ClipboardCheck className="size-4 text-[#047857]" />
                {measurements.length}
              </p>
            </QcCard>
          </div>

          {activeVersion?.formula ? (
            <QcCard className="mt-3.5 flex items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecfdf5] text-[#047857]">
                <Calculator className="size-4.5 stroke-[1.7]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Fórmula de cálculo</p>
                <code className="mt-0.5 block truncate text-[13px] font-semibold text-[#101f19]" title={activeVersion.formula}>
                  {activeVersion.formula}
                </code>
              </div>
            </QcCard>
          ) : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Tendencia */}
            <QcCard className="p-5">
              <h2 className="text-[14px] font-bold text-[#101f19]">Tendencia de la medición</h2>
              <p className="mb-4 text-[11px] text-[#7c9186]">Meta vs. medición por período de reporte</p>
              {chart.isLoading ? (
                <div className="h-[300px] animate-pulse rounded-lg bg-[#f2f7f4]" />
              ) : chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2ece6" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11, fill: "#5b7267", fontWeight: 600 }}
                        axisLine={{ stroke: "#dce8e0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#5b7267" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #dce8e0",
                          boxShadow: "0 8px 24px rgba(16,31,25,0.1)",
                          fontSize: 12,
                        }}
                        formatter={(value: any, name: any) => [
                          value,
                          name === "medicion" ? "Medición" : name === "meta" ? "Meta" : name === "tendencia" ? "Tendencia" : name,
                        ]}
                      />
                      <Legend
                        formatter={(value) => (
                          <span className="text-[11px] font-semibold text-[#5b7267]">
                            {value === "medicion" ? "Medición" : value === "meta" ? "Meta" : value === "tendencia" ? "Tendencia" : value}
                          </span>
                        )}
                      />
                      <Bar dataKey="medicion" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
                      <Line
                        type="monotone"
                        dataKey="meta"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="tendencia"
                        stroke="#047857"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <QcEmptyState title="Sin datos de tendencia" description="Aún no hay mediciones para este indicador." />
              )}
            </QcCard>

            {/* Distribución de proveedores (solo PIE) */}
            {detail.data.chartType === "PIE" ? (
              <QcCard className="p-5">
                <h2 className="text-[14px] font-bold text-[#101f19]">Distribución de proveedores</h2>
                <p className="mb-4 text-[11px] text-[#7c9186]">Clasificación según el estado de los proveedores</p>
                {procurement.isLoading ? (
                  <div className="h-[300px] animate-pulse rounded-lg bg-[#f2f7f4]" />
                ) : procurement.data && procurement.data.total > 0 ? (
                  <>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={86}
                            paddingAngle={3}
                            strokeWidth={2}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 10,
                              border: "1px solid #dce8e0",
                              boxShadow: "0 8px 24px rgba(16,31,25,0.1)",
                              fontSize: 12,
                            }}
                          />
                          <Legend
                            formatter={(value) => <span className="text-[11px] font-semibold text-[#5b7267]">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#eef4f0] pt-3 text-center">
                      <div>
                        <p className="text-[18px] font-bold text-[#10b981]">{procurement.data.confiables}</p>
                        <p className="text-[10px] font-semibold text-[#7c9186]">Confiables</p>
                      </div>
                      <div>
                        <p className="text-[18px] font-bold text-[#f59e0b]">{procurement.data.requierenMejoras}</p>
                        <p className="text-[10px] font-semibold text-[#7c9186]">Requieren mejoras</p>
                      </div>
                      <div>
                        <p className="text-[18px] font-bold text-[#f87171]">{procurement.data.suspendidos}</p>
                        <p className="text-[10px] font-semibold text-[#7c9186]">Suspendidos</p>
                      </div>
                    </div>
                    <p className="mt-3 rounded-lg bg-[#f0faf5] px-3 py-2 text-center text-[12px] font-bold text-[#047857]">
                      {formatValue(procurement.data.porcentajeConfiables, 1)}% de proveedores confiables
                    </p>
                  </>
                ) : (
                  <QcEmptyState title="Sin distribución" description="No hay mediciones de proveedores registradas." />
                )}
              </QcCard>
            ) : (
              <QcCard className="p-5">
                <h2 className="text-[14px] font-bold text-[#101f19]">Últimas mediciones</h2>
                <p className="mb-4 text-[11px] text-[#7c9186]">Historial de mediciones del indicador</p>
                {measurements.length > 0 ? (
                  <div className="grid gap-2">
                    {measurements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#e2ece6] bg-[#fbfdfc] px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[#101f19]">
                            {new Date(m.period.startsAt).toLocaleDateString("es-ES", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[10px] font-medium text-[#9db0a5]">
                            {QC_STATUS_LABELS[m.status] ?? m.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-bold text-[#101f19]">{formatValue(m.value)}</span>
                          <QcTrafficLight status={m.trafficLight} compact />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <QcEmptyState title="Sin mediciones" description="Este indicador aún no tiene mediciones registradas." />
                )}
              </QcCard>
            )}
          </div>

          {/* Barra horizontal de mediciones para indicadores LINE */}
          {detail.data.chartType !== "PIE" && measurements.length > 0 ? (
            <div className="mt-5">
              <QcCard className="overflow-hidden">
                <div className="border-b border-[#eef4f0] px-5 py-4">
                  <h2 className="text-[14px] font-bold text-[#101f19]">Historial de mediciones</h2>
                  <p className="text-[11px] text-[#7c9186]">Todas las mediciones con su valor y estado</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#e2ece6] bg-[#f7faf8]">
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Período</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Valor</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Estado</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id} className="border-b border-[#eef4f0] last:border-0 hover:bg-[#f7fcf9]">
                          <td className="px-5 py-3 text-[12px] font-medium text-[#101f19]">
                            {new Date(m.period.startsAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            –{" "}
                            {new Date(m.period.endsAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-5 py-3 text-[13px] font-bold text-[#101f19]">{formatValue(m.value)}</td>
                          <td className="px-5 py-3">
                            <QcTrafficLight status={m.trafficLight} compact />
                          </td>
                          <td className="max-w-[320px] truncate px-5 py-3 text-[12px] text-[#5b7267]" title={m.observation ?? ""}>
                            {m.observation ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </QcCard>
            </div>
          ) : null}
        </>
      ) : (
        <QcEmptyState title="Indicador no encontrado" description="El indicador solicitado no existe o no tienes acceso." />
      )}
    </QcAppShell>
  );
};
