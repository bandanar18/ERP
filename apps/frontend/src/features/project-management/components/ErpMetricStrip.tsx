import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export type ErpMetric = {
  title: string
  value: string
  change?: string
  /** Clase de la barra de progreso (ej. bg-[#d9772f]) */
  rail?: string
  /** Ancho de la barra de progreso (ej. 72%) */
  width?: string
  /** Clase extra para el valor (tamaño de fuente) */
  valueClass?: string
}

const RAIL_COLORS = ["bg-[#d9772f]", "bg-[#5e8fc2]", "bg-[#b9cd48]", "bg-[#df6e84]", "bg-[#4c9b7a]"]
const RAIL_WIDTHS = ["72%", "48%", "84%", "92%", "64%"]

const GRID_COLS_MAP: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
}

/**
 * Tira de métricas estilo Business ERP: números en Bebas Neue, tendencia con
 * ícono y barra de progreso de color. Mismo lenguaje visual que el dashboard.
 */
export function ErpMetricStrip({ metrics }: { metrics: ErpMetric[] }) {
  const trend = (change?: string) => {
    if (!change) return { Icon: Minus, tone: "text-[#4e5558]" }
    if (change.startsWith("+")) return { Icon: TrendingUp, tone: "text-[#4c9b7a]" }
    if (change.startsWith("-")) return { Icon: TrendingDown, tone: "text-[#c85454]" }
    return { Icon: Minus, tone: "text-[#4e5558]" }
  }

  const count = metrics.length
  const gridLayout = GRID_COLS_MAP[count] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

  return (
    <div className={cn("mb-3 grid gap-3 w-full", gridLayout)}>
      {metrics.map((kpi, i) => {
        const { Icon, tone } = trend(kpi.change)
        return (
          <article
            key={i}
            className="flex min-w-0 flex-col justify-between rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-[12px_14px_12px] shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[0.04em] text-[#4e5558]">
                <span className="truncate max-[520px]:text-[8px]">{kpi.title}</span>
                <span className="font-display text-[15px] tracking-[0.05em] text-[#d8d0c4]">0{i + 1}</span>
              </div>
              <div className="my-[4px] mb-2 flex items-baseline gap-2">
                <strong
                  className={cn(
                    "font-display min-w-0 truncate text-[24px] font-normal leading-[0.9] tracking-[0.02em] max-[520px]:text-[18px]",
                    kpi.valueClass
                  )}
                  title={kpi.value}
                >
                  {kpi.value}
                </strong>
              </div>
              {kpi.change && (
                <div className={cn("flex items-center gap-1.5 text-[10px] font-bold", tone)}>
                  <Icon className="h-3 w-3 shrink-0 stroke-2" />
                  <span className="truncate" title={kpi.change}>{kpi.change}</span>
                </div>
              )}
            </div>
            <div className="mt-3 h-[3px] rounded-full bg-[#ece6dc]">
              <span
                className={cn("block h-full rounded-full", kpi.rail ?? RAIL_COLORS[i % RAIL_COLORS.length])}
                style={{ width: kpi.width ?? RAIL_WIDTHS[i % RAIL_WIDTHS.length] }}
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}
