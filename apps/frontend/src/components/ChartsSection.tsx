"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartData {
  name: string
  costoProyecto: number
  costoReal: number
}

interface PieData {
  name: string
  value: number
  color: string
}

interface ChartsSectionProps {
  dataMensual: ChartData[]
  dataSemanal: ChartData[]
  pieData: PieData[]
  className?: string
  showPie?: boolean
}

export function ChartsSection({ 
  dataMensual, 
  dataSemanal, 
  pieData, 
  className,
  showPie = true
}: ChartsSectionProps) {
  const [timeframe, setTimeframe] = useState<"semanal" | "mensual">("mensual")
  const currentData = timeframe === "mensual" ? dataMensual : dataSemanal

  return (
    <div className={cn(
      "grid grid-cols-1 gap-6 mb-8", 
      showPie ? "lg:grid-cols-3" : "lg:grid-cols-1",
      className
    )}>
      {/* Gráfica de Líneas tipo Binance */}
      <Card className={cn("shadow-sm border-border/50", showPie ? "lg:col-span-2" : "lg:col-span-1")}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Evolución de Costos de Proyecto</CardTitle>
            <p className="text-xs text-green-500 font-medium mt-1">+18% este año</p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setTimeframe("semanal")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors", 
                timeframe === "semanal" ? "bg-white shadow-sm text-slate-800" : "text-muted-foreground"
              )}
            >
              Semanal
            </button>
            <button
              onClick={() => setTimeframe("mensual")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors", 
                timeframe === "mensual" ? "bg-orange-500 shadow-sm text-white" : "text-muted-foreground"
              )}
            >
              Mensual
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={100} minHeight={1} minWidth={1}>
              <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProyecto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any, name: any) => [`$${value}`, name === "costoProyecto" ? "Costo Proyectado" : "Costo Real"]}
                />
                <Area type="monotone" dataKey="costoProyecto" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorProyecto)" />
                <Area type="monotone" dataKey="costoReal" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> Costo Proyectado
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Costo Real
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfica Circular */}
      {showPie && (
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-lg font-bold text-slate-800">Estado Comercial</CardTitle>
            <span className="text-xs text-orange-500 cursor-pointer hover:underline">Ver detalles</span>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <div className="h-[200px] w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={100} minHeight={1} minWidth={1}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              {/* Etiquetas flotantes */}
              {pieData.map((item, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "absolute text-xs font-medium",
                    i === 0 ? "top-4 right-4 text-blue-500" : 
                    i === 1 ? "bottom-8 left-4 text-emerald-500" : 
                    "bottom-16 right-4 text-amber-500"
                  )}
                >
                  {item.name} {item.value}%
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6 text-xs text-muted-foreground">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  {item.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
