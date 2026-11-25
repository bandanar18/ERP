import { CheckCircle2, CircleDashed, Gauge, MinusCircle, TriangleAlert } from "lucide-react";
import type { QcSummary } from "../types";
import { QcKpiCard } from "./QcKpiCard";

export function QcSummaryCards({ summary }: { summary: QcSummary }) {
  const pct = summary.total > 0 ? Math.round((summary.green / summary.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      <QcKpiCard
        label="Indicadores"
        value={summary.total}
        hint="Total en el alcance"
        icon={Gauge}
        accent="slate"
      />
      <QcKpiCard
        label="Cumplen"
        value={summary.green}
        hint={`${pct}% del total`}
        icon={CheckCircle2}
        accent="green"
      />
      <QcKpiCard
        label="No cumplen"
        value={summary.red}
        hint="Requieren acción"
        icon={MinusCircle}
        accent="red"
      />
      <QcKpiCard
        label="En alerta"
        value={summary.yellow}
        hint="Seguimiento"
        icon={TriangleAlert}
        accent="yellow"
      />
      <QcKpiCard
        label="Sin medir"
        value={summary.gray}
        hint="Sin dato reciente"
        icon={CircleDashed}
        accent="gray"
      />
    </div>
  );
}
