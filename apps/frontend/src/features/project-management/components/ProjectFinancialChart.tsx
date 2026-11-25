import { useMemo } from "react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { FinancialValuation } from "../interfaces/financial.types"

interface ProjectFinancialChartProps {
  valuations: FinancialValuation[]
  offeredAmount: number
}

const COLORS = {
  POR_VALUAR: "#8d918f", // gris ERP
  POR_FACTURAR: "#d9772f", // naranja ERP
  FACTURADO: "#4c9b7a", // verde ERP
  REMANENTE: "#ece6dc" // papel oscuro
}

export function ProjectFinancialChart({ valuations, offeredAmount }: ProjectFinancialChartProps) {
  const chartData = useMemo(() => {
    const porValuarTotal = valuations.filter(v => v.status === 'POR_VALUAR').reduce((acc, val) => acc + val.amountUsd, 0)
    const porFacturarTotal = valuations.filter(v => v.status === 'POR_FACTURAR').reduce((acc, val) => acc + val.amountUsd, 0)
    const facturadoTotal = valuations.filter(v => v.status === 'FACTURADO').reduce((acc, val) => acc + val.amountUsd, 0)
    
    const totalRegistrado = porValuarTotal + porFacturarTotal + facturadoTotal
    const remanente = Math.max(0, offeredAmount - totalRegistrado)

    return [
      { name: "Por Valuar", value: porValuarTotal, color: COLORS.POR_VALUAR },
      { name: "Por Facturar", value: porFacturarTotal, color: COLORS.POR_FACTURAR },
      { name: "Facturado", value: facturadoTotal, color: COLORS.FACTURADO },
      ...(remanente > 0 ? [{ name: "Saldo Remanente", value: remanente, color: COLORS.REMANENTE }] : [])
    ].filter(item => item.value > 0)
  }, [valuations, offeredAmount])

  const formatARS = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-3 shadow-xl">
          <p className="text-sm font-bold text-[#111416]">{payload[0].name}</p>
          <p className="mt-1 font-bold text-[#d9772f]">
            {formatARS(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="h-full overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
      <CardHeader className="border-b border-[#d8d0c4] bg-[#f5f0e8]/40 pb-3">
        <CardTitle className="text-[15px] font-bold text-[#111416]">Estado Financiero</CardTitle>
        <CardDescription className="text-[11px] text-[#4e5558]">
          Distribución de los montos ofertados según su estado de facturación.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="mt-4 h-[350px] w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-[#8d918f]">
              <p>No hay registros financieros</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartData[index].color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, _entry: any) => (
                    <span className="ml-1 text-sm font-medium text-[#4e5558]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
