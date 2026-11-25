"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, LineChart as LineChartIcon, BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/executive/components/ui/card";

type TrendPoint = {
  period: string;
  meta: number | null;
  medicion?: number | null;
  /** Regresión lineal sobre los puntos medidos (línea de tendencia punteada). */
  tendencia?: number | null;
  /** Valor de la tendencia en el último punto medido — alimenta la anotación. */
  tendenciaFinal?: number | null;
  /** Promedio móvil (solo CUMULATIVE_RATIO). Fallback histórico. */
  trend?: number | null;
  proyeccion?: number | null;
  trafficLight?: "GREEN" | "RED" | "GRAY" | null;
};

type IndicatorTrendChartProps = {
  title: string;
  data: TrendPoint[];
  unit?: string;
  isLoading?: boolean;
  /** Permite alternar entre vista de líneas y barras (por defecto habilitado). */
  allowVariantToggle?: boolean;
  /** Variante inicial mostrada. */
  defaultVariant?: "line" | "bar";
  /** Nombre de la serie mostrado en la leyenda inferior. */
  seriesName?: string;
};

type ChartRow = {
  period: string;
  resultado: number | null;
  tendencia: number | null;
  tendenciaFinal: number | null;
  meta: number | null;
  isMeta: boolean;
  trafficLight: "GREEN" | "RED" | "GRAY";
};

const Y_TICK_STEP = 20;
const MIN_Y_MAX = 120;

const META_COLUMN_LABEL = "Meta (%)";

const BAR_GREEN = "#16a34a";
const BAR_RED = "#dc2626";
const META_LINE = "#2563eb";

/** Gris claro de la barra de meta y de la línea de tendencia, como en la hoja de cálculo. */
const META_BAR_FILL = "#bfbfbf";
const TREND_STROKE = "#d9d9d9";

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return `${Number(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function barColor(row: ChartRow) {
  if (row.trafficLight === "RED") return BAR_RED;
  if (row.trafficLight === "GREEN") return BAR_GREEN;
  return "var(--color-muted-foreground)";
}

function getAxisMax(rows: ChartRow[], metaValue: number | null) {
  const highestValue = Math.max(
    MIN_Y_MAX,
    metaValue ?? 0,
    ...rows.flatMap((row) =>
      [row.resultado, row.tendencia, row.meta].filter(
        (value): value is number => typeof value === "number",
      ),
    ),
  );

  return Math.ceil(highestValue / Y_TICK_STEP) * Y_TICK_STEP;
}

export function IndicatorTrendChart({
  title,
  data,
  isLoading = false,
  allowVariantToggle = true,
  defaultVariant = "line",
  seriesName,
}: IndicatorTrendChartProps) {
  const [variant, setVariant] = React.useState<"line" | "bar">(defaultVariant);

  // La meta se toma del último periodo que la declara: los periodos del
  // calendario aún sin medición pueden venir sin meta.
  const metaValue = React.useMemo(() => {
    for (let index = data.length - 1; index >= 0; index -= 1) {
      const meta = data[index]?.meta;
      if (typeof meta === "number") return meta;
    }

    return null;
  }, [data]);

  const chartData = React.useMemo<ChartRow[]>(() => {
    if (!data.length) return [];

    const rows: ChartRow[] = data.map((item) => ({
      period: item.period.toUpperCase(),
      resultado: item.medicion ?? null,
      tendencia: item.tendencia ?? item.trend ?? item.proyeccion ?? null,
      tendenciaFinal: item.tendenciaFinal ?? null,
      meta: null,
      isMeta: false,
      trafficLight: item.trafficLight ?? "GRAY",
    }));

    // En la vista de líneas la meta se agrega como una barra final.
    // En la vista de barras se representa como una línea horizontal (ReferenceLine),
    // por lo que NO se agrega la fila extra.
    if (variant === "line") {
      rows.push({
        period: META_COLUMN_LABEL,
        resultado: null,
        tendencia: null,
        tendenciaFinal: null,
        meta: metaValue,
        isMeta: true,
        trafficLight: "GRAY",
      });
    }

    return rows;
  }, [data, variant, metaValue]);

  const axisMax = React.useMemo(
    () => getAxisMax(chartData, metaValue),
    [chartData, metaValue],
  );

  const yTicks = React.useMemo(
    () =>
      Array.from(
        { length: axisMax / Y_TICK_STEP + 1 },
        (_, index) => index * Y_TICK_STEP,
      ),
    [axisMax],
  );

  const legendLabel = seriesName ?? title;

  /**
   * Anotación "Tendencia del <serie>: XX,XX%" anclada al último punto medido,
   * como en la hoja de cálculo corporativa.
   */
  const renderTrendAnnotation = React.useCallback(
    (props: any) => {
      const { index, x, y } = props;
      const row = chartData[index];

      if (!row || typeof row.tendenciaFinal !== "number") return null;
      if (typeof x !== "number" || typeof y !== "number") return null;

      return (
        <text
          x={x}
          y={y}
          textAnchor="end"
          fill="var(--color-muted-foreground)"
          fontSize={11}
        >
          <tspan x={x} dy={-30}>
            Tendencia del
          </tspan>
          <tspan x={x} dy={13}>
            {legendLabel}: {formatPercent(row.tendenciaFinal)}
          </tspan>
        </text>
      );
    },
    [chartData, legendLabel],
  );

  /** Leyenda inferior centrada con marcador de línea y punto. */
  const renderLegend = React.useCallback(
    () => (
      <div className="flex items-center justify-center gap-2 pt-1">
        <svg width="34" height="10" aria-hidden="true">
          <line
            x1="0"
            y1="5"
            x2="34"
            y2="5"
            stroke="var(--color-foreground)"
            strokeWidth="2.5"
          />
          <circle cx="17" cy="5" r="3.5" fill="var(--color-foreground)" />
        </svg>
        <span className="text-xs text-foreground">{legendLabel}</span>
      </div>
    ),
    [legendLabel],
  );

  /**
   * Leyenda superior-derecha de la variante de barras.
   * Recharts no acepta la prop `payload` en `<Legend>` (se calcula solo);
   * se renderiza vía `content` para conservar las etiquetas en español.
   */
  const renderBarLegend = React.useCallback(
    () => (
      <div className="flex items-center justify-end gap-3 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: BAR_GREEN }}
          />
          Cumple
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: BAR_RED }}
          />
          No cumple
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3" style={{ backgroundColor: META_LINE }} />
          Meta
        </span>
      </div>
    ),
    [],
  );

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex h-[430px] items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Cargando tendencia histórica...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex h-[430px] flex-col items-center justify-center gap-2 text-center">
          <TrendingUp className="h-9 w-9 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            Aún no existen mediciones para construir la tendencia.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {allowVariantToggle ? <span className="hidden sm:block sm:w-[150px]" /> : null}

          <CardTitle className="flex-1 text-center text-base font-normal text-muted-foreground">
            {title}
          </CardTitle>

          {allowVariantToggle && (
            <div className="inline-flex items-center gap-1 self-center rounded-lg border border-border/60 bg-muted/40 p-0.5 sm:self-auto">
              <button
                type="button"
                onClick={() => setVariant("line")}
                aria-pressed={variant === "line"}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  variant === "line"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LineChartIcon className="h-3.5 w-3.5" />
                Líneas
              </button>
              <button
                type="button"
                onClick={() => setVariant("bar")}
                aria-pressed={variant === "bar"}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  variant === "bar"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Barras
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="h-[460px] p-3 sm:p-6">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart
            data={chartData}
            margin={{ top: 56, right: 8, left: 8, bottom: 18 }}
          >
            {/* Horizontal dashed grid lines — visible in both bar and line variants */}
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeOpacity={0.6}
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="period"
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickMargin={12}
              interval={0}
              tick={{
                fill: "var(--color-foreground)",
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            {/* Doble eje Y (izquierdo y derecho espejo), como en la hoja de cálculo. */}
            <YAxis
              yAxisId="left"
              domain={[0, axisMax]}
              ticks={yTicks}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickMargin={10}
              width={52}
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: 11,
              }}
              tickFormatter={(value) => `${value}%`}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, axisMax]}
              ticks={yTicks}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickMargin={10}
              width={52}
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: 11,
              }}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              cursor={{ stroke: "var(--color-muted-foreground)", strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                color: "var(--color-card-foreground)",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, .10)",
              }}
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  resultado: legendLabel,
                  tendencia: "Tendencia",
                  meta: "Meta",
                };

                return [formatPercent(value as number), labels[String(name)]];
              }}
              labelFormatter={(label) => `Periodo: ${label}`}
            />

            {variant === "line" ? (
              <Legend verticalAlign="bottom" align="center" content={renderLegend} />
            ) : (
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                content={renderBarLegend}
              />
            )}

            {/* Meta: barra gris final (líneas) o línea horizontal punteada (barras) */}
            {variant === "line" ? (
              <Bar
                yAxisId="left"
                dataKey="meta"
                name="meta"
                barSize={34}
                radius={[0, 0, 0, 0]}
                fill={META_BAR_FILL}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="meta"
                  position="top"
                  formatter={(value: any) =>
                    typeof value === "number" ? formatPercent(value) : ""
                  }
                  style={{
                    fill: "var(--color-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              </Bar>
            ) : (
              metaValue !== null && (
                <ReferenceLine
                  yAxisId="left"
                  y={metaValue}
                  stroke={META_LINE}
                  strokeDasharray="7 6"
                  strokeWidth={2.5}
                  label={{
                    value: `Meta: ${metaValue}`,
                    position: "insideTopLeft",
                    fill: META_LINE,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
              )
            )}

            {/* Línea de tendencia (regresión lineal) — solo en vista de líneas */}
            {variant === "line" && (
              <Line
                yAxisId="left"
                type="linear"
                dataKey="tendencia"
                name="tendencia"
                stroke={TREND_STROKE}
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              >
                <LabelList dataKey="tendencia" content={renderTrendAnnotation} />
              </Line>
            )}

            {/* Serie principal de resultados: barras o línea según la variante */}
            {variant === "bar" ? (
              <Bar
                yAxisId="left"
                dataKey="resultado"
                name="resultado"
                barSize={44}
                radius={[4, 4, 0, 0]}
                isAnimationActive
              >
                {chartData.map((row, index) => (
                  <Cell key={`cell-${index}`} fill={barColor(row)} />
                ))}
                <LabelList
                  dataKey="resultado"
                  position="top"
                  offset={8}
                  formatter={(value: any) =>
                    typeof value === "number" ? formatPercent(value) : ""
                  }
                  style={{
                    fill: "var(--color-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              </Bar>
            ) : (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="resultado"
                name="resultado"
                stroke="var(--color-foreground)"
                strokeWidth={3.5}
                dot={{
                  r: 4,
                  fill: "var(--color-foreground)",
                  stroke: "var(--color-foreground)",
                  strokeWidth: 1,
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--color-foreground)",
                  stroke: "var(--color-background)",
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive
              >
                <LabelList
                  dataKey="resultado"
                  position="top"
                  offset={12}
                  formatter={(value: any) =>
                    typeof value === "number" ? formatPercent(value) : ""
                  }
                  style={{
                    fill: "var(--color-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              </Line>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
