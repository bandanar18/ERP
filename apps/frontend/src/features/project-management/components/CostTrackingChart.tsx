"use client";

import { useState, useMemo } from "react";
import {
  EvilLineChart,
  Line,
  XAxis,
  YAxis,
  Grid,
  Tooltip,
  Legend,
  Dot,
  ActiveDot,
} from "@/components/evilcharts/charts/line-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CostPlanning } from "../interfaces/cost.types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CostTrackingChartProps {
  costs: CostPlanning[];
  estimatedCost: number;
  projectStartDate?: string;
  projectEndDate?: string;
}

interface ChartDataPoint {
  [key: string]: string | number;
  period: string;
  costoEstimado: number;
  costoReal: number;
}

type Timeframe = "semanal" | "mensual";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_LABELS: Record<string, string> = {
  "01": "Ene",
  "02": "Feb",
  "03": "Mar",
  "04": "Abr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dic",
};

/** Returns the ISO week number for a given date. */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Formats a YYYY-MM key into a short Spanish label like "Ene 2025". */
function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${MONTH_LABELS[month] ?? month} ${year}`;
}

/** Get all periods between start and end dates. */
function getAllPeriods(
  startDate: Date,
  endDate: Date,
  timeframe: Timeframe
): string[] {
  const periods: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (timeframe === "semanal") {
      const week = getISOWeek(current);
      periods.push(`${current.getFullYear()}-W${String(week).padStart(2, "0")}`);
      current.setDate(current.getDate() + 7);
    } else {
      periods.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
      current.setMonth(current.getMonth() + 1);
    }
  }

  return [...new Set(periods)].sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart config
// ─────────────────────────────────────────────────────────────────────────────

const chartConfig = {
  costoReal: {
    label: "Costo Real",
    colors: { light: ["#5e8fc2"] },
  },
  costoEstimado: {
    label: "Costo Estimado (Acumulado)",
    colors: { light: ["#d9772f"] },
  },
} satisfies ChartConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CostTrackingChart({
  costs,
  estimatedCost,
  projectStartDate,
  projectEndDate,
}: CostTrackingChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("mensual");

  const sortedCosts = useMemo(
    () => [...costs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [costs],
  );

  const data = useMemo(() => {
    if (!projectStartDate || !projectEndDate) {
      return [];
    }

    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);

    const allPeriods = getAllPeriods(start, end, timeframe);
    const totalPeriods = allPeriods.length;

    if (totalPeriods === 0) return [];

    const estimatedCostPerPeriod = estimatedCost / totalPeriods;

    const groupedRealCosts = new Map<string, number>();
    for (const cost of sortedCosts) {
      const d = new Date(cost.startDate);
      let key: string;

      if (timeframe === "semanal") {
        const week = getISOWeek(d);
        key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      groupedRealCosts.set(key, (groupedRealCosts.get(key) ?? 0) + Number(cost.amountUsd));
    }

    const result: ChartDataPoint[] = [];
    let cumulativeReal = 0;
    let cumulativeEstimated = 0;

    for (let i = 0; i < allPeriods.length; i++) {
      const period = allPeriods[i];
      cumulativeReal += groupedRealCosts.get(period) || 0;
      cumulativeEstimated += estimatedCostPerPeriod;

      result.push({
        period: timeframe === "mensual" ? formatMonthLabel(period) : `Sem ${i + 1}`,
        costoEstimado: Math.round(cumulativeEstimated),
        costoReal: Math.round(cumulativeReal),
      });
    }

    return result;
  }, [sortedCosts, estimatedCost, projectStartDate, projectEndDate, timeframe]);

  return (
    <Card className="shadow-none border border-[#d8d0c4] bg-[#fffdf9]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-[15px] font-bold text-[#111416]">
            Evolución de Costos
          </CardTitle>
        </div>
        <div className="flex border border-[#d8d0c4] bg-[#f5f0e8] p-1">
          <button
            onClick={() => setTimeframe("semanal")}
            className={cn(
              "px-3 py-1 text-[11px] font-bold transition-colors",
              timeframe === "semanal"
                ? "bg-[#111416] text-white"
                : "text-[#4e5558] hover:bg-[#ece6dc]",
            )}
          >
            Semanal
          </button>
          <button
            onClick={() => setTimeframe("mensual")}
            className={cn(
              "px-3 py-1 text-[11px] font-bold transition-colors",
              timeframe === "mensual"
                ? "bg-[#111416] text-white"
                : "text-[#4e5558] hover:bg-[#ece6dc]",
            )}
          >
            Mensual
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {!projectStartDate || !projectEndDate ? (
          <div className="flex h-[280px] items-center justify-center text-sm font-medium text-[#4e5558]">
            El proyecto no tiene fechas definidas
          </div>
        ) : costs.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm font-medium text-[#4e5558]">
            Sin registros de costos
          </div>
        ) : (
          <div className="h-[350px] w-full mt-4">
            <EvilLineChart
              config={chartConfig}
              data={data}
              xDataKey="period"
              curveType="monotone"
              animationType="left-to-right"
            >
              <Grid />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} />
              <Line dataKey="costoEstimado" strokeVariant="dashed">
                <Dot variant="border" />
              </Line>
              <Line dataKey="costoReal" glowing>
                <Dot variant="colored-border" />
                <ActiveDot variant="colored-border" />
              </Line>
              <Tooltip />
              <Legend variant="circle" />
            </EvilLineChart>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
