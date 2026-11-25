"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/executive/components/ui/card";

import type { ProcurementDistribution } from "./ProcurementSupplierPieChart";

type ProcurementSupplierBarChartProps = {
  title?: string;
  distribution?: ProcurementDistribution;
  isLoading?: boolean;
};

const COLORS = {
  confiables: "#4472c4",
  requierenMejoras: "#ed7d31",
  suspendidos: "#a5a5a5",
};

export function ProcurementSupplierBarChart({
  title = "Cantidad de proveedores por clasificación",
  distribution,
  isLoading = false,
}: ProcurementSupplierBarChartProps) {
  const data = React.useMemo(
    () => [
      {
        category: "Confiable",
        value: distribution?.confiables ?? 0,
        color: COLORS.confiables,
      },
      {
        category: "Requiere mejoras",
        value: distribution?.requierenMejoras ?? 0,
        color: COLORS.requierenMejoras,
      },
      {
        category: "Suspendido",
        value: distribution?.suspendidos ?? 0,
        color: COLORS.suspendidos,
      },
    ],
    [distribution],
  );

  const highest = Math.max(...data.map((item) => item.value), 1);
  const yMax = Math.ceil(highest / 5) * 5;

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex h-[410px] items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Cargando cantidades de proveedores...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[370px] p-3 sm:p-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 32, right: 16, left: -12, bottom: 12 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 600,
              }}
            />

            <YAxis
              allowDecimals={false}
              domain={[0, yMax]}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={34}
              tick={{
                fill: "#6b7280",
                fontSize: 12,
              }}
            />

            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              formatter={(value) => [
                `${value} proveedor(es)`,
                "Cantidad",
              ]}
            />

            <Bar
              dataKey="value"
              radius={[5, 5, 0, 0]}
              maxBarSize={76}
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}

              <LabelList
                dataKey="value"
                position="top"
                offset={10}
                style={{
                  fill: "#374151",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
