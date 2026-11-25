"use client";

import * as React from "react";
import { PieChart as PieChartIcon } from "lucide-react";

import { EvilPieChart } from "@/features/executive/components/evilcharts/charts/recharts-pie-chart";
import { type ChartConfig } from "@/features/executive/components/evilcharts/ui/recharts-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/executive/components/ui/card";

export type ProcurementDistribution = {
  confiables: number;
  requierenMejoras: number;
  suspendidos: number;
};

type ProcurementSupplierPieChartProps = {
  title?: string;
  distribution?: ProcurementDistribution;
  isLoading?: boolean;
};

// Colores según el modelo del Excel: CONFIABLE (azul), REQUIERE MEJORAS
// (naranja), SUSPENDIDO (gris).
const chartConfig = {
  confiables: {
    label: "Confiable",
    colors: {
      light: ["#4472c4"],
      dark: ["#5b8def"],
    },
  },
  requierenMejoras: {
    label: "Requiere mejoras",
    colors: {
      light: ["#ed7d31"],
      dark: ["#f0955a"],
    },
  },
  suspendidos: {
    label: "Suspendido",
    colors: {
      light: ["#a5a5a5"],
      dark: ["#bcbcbc"],
    },
  },
} satisfies ChartConfig;

export function ProcurementSupplierPieChart({
  title = "Clasificación de proveedores",
  distribution,
  isLoading = false,
}: ProcurementSupplierPieChartProps) {
  const data = React.useMemo(
    () => [
      {
        category: "confiables",
        label: "Confiables",
        value: distribution?.confiables ?? 0,
      },
      {
        category: "requierenMejoras",
        label: "Requieren mejoras",
        value: distribution?.requierenMejoras ?? 0,
      },
      {
        category: "suspendidos",
        label: "Suspendidos",
        value: distribution?.suspendidos ?? 0,
      },
    ],
    [distribution],
  );

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Inject total into each item so the label formatter can compute percentages
  const chartData = data.map((item) => ({ ...item, total }));

  const confiables = distribution?.confiables ?? 0;
  const porcentajeConfiables =
    total > 0 ? (confiables / total) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex h-[410px] items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Cargando clasificación de proveedores...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!total) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex h-[410px] flex-col items-center justify-center gap-2 text-center">
          <PieChartIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            No hay proveedores registrados en este periodo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>

          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {porcentajeConfiables.toFixed(2)} % confiables
          </span>
        </div>
      </CardHeader>

      <CardContent className="h-[370px] p-3 sm:p-5">
        <EvilPieChart
          className="h-full w-full"
          data={chartData}
          dataKey="value"
          nameKey="category"
          config={chartConfig}
          isLoading={isLoading}
        >
          <EvilPieChart.Legend isClickable />
          <EvilPieChart.Tooltip />
          <EvilPieChart.Pie
            isClickable
            pieProps={{
              paddingAngle: 1,
              startAngle: 90,
              endAngle: -270,
            }}
          >
            <EvilPieChart.Label
              labelListProps={{
                position: 'outside',
                formatter: (value: any, ...rest: any[]) => {
                  const entry = rest[0];
                  const t = entry?.payload?.total ?? 0;
                  const pct = t > 0 ? Math.round((value / t) * 100) : 0;
                  return `${value}; ${pct}%`;
                },
                style: {
                  fill: '#404040',
                  fontSize: 13,
                  fontWeight: 700,
                },
              }}
            />
          </EvilPieChart.Pie>
        </EvilPieChart>
      </CardContent>
    </Card>
  );
}
