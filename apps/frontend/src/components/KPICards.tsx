import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface KPIData {
  title: string
  value: React.ReactNode | string
  change: string
  icon: LucideIcon
  iconColor: string
  bg: string
  onClick?: () => void
  details?: React.ReactNode
}

interface KPICardsProps {
  kpis: KPIData[]
  columns?: 2 | 3 | 4 | 5 | 6
}

export function KPICards({ kpis, columns = 4 }: KPICardsProps) {
  const gridColsMap = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  };
  
  return (
    <div className={cn("grid grid-cols-1 gap-4 mb-8", gridColsMap[columns])}>
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full"
          >
            <Card 
              className={cn(
                "rounded-2xl shadow-md border-border/60 bg-card h-full transition-all duration-300",
                kpi.onClick ? "cursor-pointer hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 active:scale-[0.99]" : ""
              )}
              onClick={kpi.onClick}
            >
              <CardContent className="p-3 flex flex-col justify-between h-full gap-1.5">
                <div className="flex justify-between items-start w-full gap-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">{kpi.title}</p>
                  <div className={cn("p-1 rounded-md shrink-0", kpi.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", kpi.iconColor)} />
                  </div>
                </div>
                <div className="flex flex-col gap-0 w-full">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none truncate" title={typeof kpi.value === 'string' ? kpi.value : undefined}>{kpi.value}</h3>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[9px] text-slate-400 font-medium truncate" title={kpi.change}>{kpi.change}</p>
                  </div>
                  {kpi.details && (
                    <div className="mt-2 w-full">
                      {kpi.details}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
