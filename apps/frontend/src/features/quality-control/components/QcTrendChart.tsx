import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AreaChart as AreaIcon, BarChart3, Layers, LineChart as LineIcon } from "lucide-react";
import type { QcTrendEntry } from "../types";
import { cn } from "@/lib/utils";

type TrendView = "composed" | "line" | "area" | "bar";

const VIEWS: { id: TrendView; label: string; icon: typeof Layers }[] = [
  { id: "composed", label: "Combinada", icon: Layers },
  { id: "line", label: "Línea", icon: LineIcon },
  { id: "area", label: "Área", icon: AreaIcon },
  { id: "bar", label: "Barras", icon: BarChart3 },
];

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #dce8e0",
  boxShadow: "0 8px 24px rgba(16,31,25,0.1)",
  fontSize: 12,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipFormatter = (value: any, name: any) => [
  value,
  name === "totalGreen" ? "Cumplen" : name === "totalRed" ? "No cumplen" : name === "compliancePct" ? "% Cumplimiento" : name,
];

const legendFormatter = (value: unknown) => (
  <span className="text-[11px] font-semibold text-[#5b7267]">
    {value === "totalGreen" ? "Cumplen" : value === "totalRed" ? "No cumplen" : "% Cumplimiento"}
  </span>
);

export function QcTrendChart({ data }: { data: QcTrendEntry[] }) {
  const [view, setView] = useState<TrendView>(() => {
    if (typeof window === "undefined") return "composed";
    const saved = window.localStorage.getItem("qc-trend-view");
    return saved === "line" || saved === "area" || saved === "bar" ? saved : "composed";
  });

  const changeView = (next: TrendView) => {
    setView(next);
    try {
      window.localStorage.setItem("qc-trend-view", next);
    } catch {
      /* noop */
    }
  };

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#e2ece6" vertical={false} />;
  const xAxis = (
    <XAxis
      dataKey="period"
      tick={{ fontSize: 11, fill: "#5b7267", fontWeight: 600 }}
      axisLine={{ stroke: "#dce8e0" }}
      tickLine={false}
    />
  );
  const yLeft = (
    <YAxis
      tick={{ fontSize: 11, fill: "#5b7267" }}
      axisLine={false}
      tickLine={false}
      yAxisId="left"
      allowDecimals={false}
    />
  );
  const yRight = <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />;
  const tooltip = <Tooltip contentStyle={TOOLTIP_STYLE} formatter={tooltipFormatter} />;
  const legend = <Legend formatter={legendFormatter} />;

  return (
    <div>
      {/* Selector de tipo de gráfica */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[#7c9186]">Cumplen vs. no cumplen · % por período</span>
        <div className="flex items-center gap-0.5 rounded-lg border border-[#d8e6de] bg-white p-0.5">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => changeView(id)}
              title={label}
              aria-label={label}
              aria-pressed={view === id}
              className={cn(
                "grid size-7 place-items-center rounded-md transition-colors",
                view === id
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-[#7c9186] hover:bg-[#f2f7f4] hover:text-[#047857]"
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {view === "line" ? (
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              {grid}
              {xAxis}
              {yLeft}
              {yRight}
              {tooltip}
              {legend}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalGreen"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalRed"
                stroke="#f87171"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#f87171", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="compliancePct"
                stroke="#047857"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : view === "area" ? (
            <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              {grid}
              {xAxis}
              {yLeft}
              {yRight}
              {tooltip}
              {legend}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalGreen"
                stackId="a"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalRed"
                stackId="a"
                stroke="#f87171"
                fill="#f87171"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="compliancePct"
                stroke="#047857"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          ) : view === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              {grid}
              {xAxis}
              {yLeft}
              {yRight}
              {tooltip}
              {legend}
              <Bar yAxisId="left" dataKey="totalGreen" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar yAxisId="left" dataKey="totalRed" fill="#f87171" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          ) : (
            <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              {grid}
              {xAxis}
              {yLeft}
              {yRight}
              {tooltip}
              {legend}
              <Bar yAxisId="left" dataKey="totalGreen" stackId="a" fill="#10b981" barSize={22} />
              <Bar yAxisId="left" dataKey="totalRed" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} barSize={22} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="compliancePct"
                stroke="#047857"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
