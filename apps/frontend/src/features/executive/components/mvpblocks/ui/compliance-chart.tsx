'use client';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/features/executive/components/ui/chart';
import { CheckCircle2, XCircle, Minus } from 'lucide-react';

interface ComplianceChartProps {
  /** The raw matrix data from useConsolidatedMatrix */
  matrix?: any[];
  /** Whether data is still loading */
  loading?: boolean;
}

export default function ComplianceChart({ matrix, loading }: ComplianceChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const chartData = useMemo(() => {
    if (!matrix || matrix.length === 0) return [];

    const green = matrix.filter((r: any) => r.complianceStatus === 'GREEN').length;
    const red = matrix.filter((r: any) => r.complianceStatus === 'RED').length;
    const gray = matrix.filter((r: any) =>
      !r.complianceStatus || r.complianceStatus === 'GRAY',
    ).length;

    const total = green + red + gray;

    const items = [
      { name: 'Cumplen', value: green, fill: '#10b981' },
      { name: 'No Cumplen', value: red, fill: '#ef4444' },
    ];

    // Solo incluir 'Sin Dato' si tiene al menos 1
    if (gray > 0) items.push({ name: 'Sin Dato', value: gray, fill: '#6b7280' });

    return items.map((item) => ({
      ...item,
      pct: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [matrix]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <Card className="from-secondary/30 rounded-lg bg-gradient-to-t shadow-none">
        <CardHeader>
          <CardTitle>Distribución de Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[15rem] md:h-[20rem] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs text-muted-foreground">Cargando datos...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="from-secondary/30 rounded-lg bg-gradient-to-t shadow-none">
        <CardHeader>
          <CardTitle>Distribución de Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[15rem] md:h-[20rem] flex items-center justify-center text-muted-foreground text-sm">
            Sin datos de indicadores disponibles.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="from-secondary/30 rounded-lg bg-gradient-to-t shadow-none">
      <CardHeader className="flex flex-col items-center justify-between gap-3 md:flex-row">
        <CardTitle>Distribución de Cumplimiento</CardTitle>
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-green-500" />
            <span className="text-xs">{chartData[0]!.value} Cumplen</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="size-3 text-red-500" />
            <span className="text-xs">{chartData[1]!.value} No Cumplen</span>
          </div>
          {chartData.find((d) => d.name === 'Sin Dato') && (
            <div className="flex items-center gap-1">
              <Minus className="size-3 text-gray-400" />
              <span className="text-xs">{chartData.find((d) => d.name === 'Sin Dato')!.value} Sin Dato</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 min-w-0">
        <ChartContainer
          config={{
            value: { label: 'Indicadores' },
          }}
          className="min-w-0 h-[15rem] w-full md:h-[20rem] aspect-auto"
        >
          {mounted && <BarChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(_value: any, _name: any, props: any) => {
                    const item = props?.payload;
                    if (!item) return ['', ''];
                    return [`${item.value} indicadores (${item.pct}%)`, item.name];
                  }}
                />
              }
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              barSize={80}
              maxBarSize={120}
              isAnimationActive={true}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>}
        </ChartContainer>

        {/* Summary below the chart */}
        <div className="flex items-center justify-center gap-6 border-t border-border/30 pt-4 mt-2 px-4">
          {chartData.map((item) => (
            <div key={item.name} className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: item.fill }}
              >
                {item.value}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {item.name}
              </div>
              <div className="text-xs font-semibold" style={{ color: item.fill }}>
                {item.pct}%
              </div>
            </div>
          ))}
          <div className="text-center border-l border-border/30 pl-6">
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Total
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
