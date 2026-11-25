"use client"

import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, ChevronRight } from "lucide-react"
import type { CostPlanning } from "../interfaces/cost.types"

interface ProjectCostChartProps {
  projectId?: string
  progress?: any[]
  lastProgress?: any
  plannedProgress?: string | number
  actualProgress?: string | number
  projectStartDate?: string
  projectEndDate?: string
  costs?: CostPlanning[]
  estimatedCost?: number
}

interface ChartData {
  name: string
  periodLabel: string
  dateLabel: string
  avanceProyectado: number
  avanceReal: number | null
  hasRecord?: boolean
  recordNote?: string
}

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
}

function parsePercent(val: any): number {
  if (val === null || val === undefined) return 0
  const str = String(val).replace("%", "").trim().replace(",", ".")
  const num = parseFloat(str)
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, num))
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-")
  return `${MONTH_LABELS[month] ?? month} ${year}`
}

/**
 * Función matemática de Curva S (SmootherStep sigmoidal de 5to orden)
 * S(0) = 0, S(1) = 1, con derivadas nulas en extremos para curvatura suave.
 */
function sCurveFactor(u: number): number {
  const clamped = Math.max(0, Math.min(1, u))
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10)
}

interface PeriodItem {
  key: string
  label: string
  startDate: Date
  endDate: Date
}

function getAllPeriods(
  startDate: Date,
  endDate: Date,
  timeframe: "semanal" | "mensual"
): PeriodItem[] {
  const periods: PeriodItem[] = []
  const current = new Date(startDate)
  const finalEndDate = new Date(endDate)
  finalEndDate.setHours(23, 59, 59, 999)

  if (timeframe === "semanal") {
    let weekIndex = 1
    while (current <= finalEndDate) {
      const pStart = new Date(current)
      const pEnd = new Date(current)
      pEnd.setDate(pEnd.getDate() + 6)
      pEnd.setHours(23, 59, 59, 999)

      const weekNum = getISOWeek(current)
      const year = current.getFullYear()
      const key = `${year}-W${String(weekNum).padStart(2, "0")}`

      periods.push({
        key,
        label: `Sem ${weekIndex}`,
        startDate: pStart,
        endDate: pEnd > finalEndDate ? new Date(finalEndDate) : pEnd,
      })

      current.setDate(current.getDate() + 7)
      weekIndex++
    }
  } else {
    while (current <= finalEndDate) {
      const pStart = new Date(current.getFullYear(), current.getMonth(), 1)
      const pEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999)

      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`
      periods.push({
        key,
        label: formatMonthLabel(key),
        startDate: pStart,
        endDate: pEnd > finalEndDate ? new Date(finalEndDate) : pEnd,
      })

      current.setMonth(current.getMonth() + 1)
      current.setDate(1)
    }
  }

  return periods
}

function findPeriodIndex(periods: PeriodItem[], date: Date): number {
  if (periods.length === 0) return 0
  const time = date.getTime()
  if (time <= periods[0].startDate.getTime()) return 0
  if (time >= periods[periods.length - 1].endDate.getTime()) return periods.length - 1

  const idx = periods.findIndex((p) => time >= p.startDate.getTime() && time <= p.endDate.getTime())
  if (idx !== -1) return idx

  const afterIdx = periods.findIndex((p) => p.endDate.getTime() >= time)
  return afterIdx !== -1 ? afterIdx : periods.length - 1
}

type Timeframe = "semanal" | "mensual" | "registro"

export function ProjectCostChart({
  projectId,
  progress = [],
  lastProgress,
  plannedProgress,
  actualProgress,
  projectStartDate,
  projectEndDate,
}: ProjectCostChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("semanal")

  // Normalizar historial real de avances físicos certificados
  const normalizedReports = useMemo(() => {
    return (progress || [])
      .map((p) => {
        const rawDate = p.date || p.endDate || p.startDate || p.createdAt
        const date = rawDate ? new Date(rawDate) : null
        if (!date || isNaN(date.getTime())) return null
        return {
          id: p.id,
          date,
          actual: parsePercent(p.actualProgress),
          planned: parsePercent(p.plannedProgress),
          attentionPoints: p.attentionPoints,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [progress])

  // Último valor registrado para el encabezado
  const currentSnapshot = useMemo(() => {
    if (normalizedReports.length > 0) {
      const last = normalizedReports[normalizedReports.length - 1]
      return { actual: last.actual, planned: last.planned }
    }
    const propActual = parsePercent(lastProgress?.actualProgress ?? actualProgress)
    const propPlanned = parsePercent(lastProgress?.plannedProgress ?? plannedProgress)
    return { actual: propActual, planned: propPlanned }
  }, [normalizedReports, lastProgress, actualProgress, plannedProgress])

  const chartData = useMemo(() => {
    if (normalizedReports.length === 0) return []

    // 1. Vista por registro individual (cada certificación en su respectiva fecha)
    if (timeframe === "registro") {
      const result: ChartData[] = []

      // Punto de inicio de obra (0%) si tiene fecha previa al primer reporte
      if (projectStartDate) {
        const pStart = new Date(projectStartDate)
        if (!isNaN(pStart.getTime()) && pStart.getTime() < normalizedReports[0].date.getTime()) {
          result.push({
            name: "Inicio",
            periodLabel: "Inicio de obra",
            dateLabel: pStart.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
            avanceProyectado: 0,
            avanceReal: 0,
          })
        }
      }

      const dateCountMap = new Map<string, number>()
      normalizedReports.forEach((rep) => {
        const rawKey = rep.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
        dateCountMap.set(rawKey, (dateCountMap.get(rawKey) || 0) + 1)
      })

      const dateSeenMap = new Map<string, number>()
      normalizedReports.forEach((rep) => {
        const rawKey = rep.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
        const total = dateCountMap.get(rawKey) || 1
        let displayName = rawKey
        if (total > 1) {
          const seen = (dateSeenMap.get(rawKey) || 0) + 1
          dateSeenMap.set(rawKey, seen)
          displayName = `${rawKey} (${seen})`
        }

        const fullDate = rep.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
        result.push({
          name: displayName,
          periodLabel: `Registro: ${fullDate}`,
          dateLabel: fullDate,
          avanceProyectado: rep.planned,
          avanceReal: rep.actual,
          hasRecord: true,
          recordNote: rep.attentionPoints,
        })
      })

      return result
    }

    // 2. Vista agregada semanal o mensual con modelado de Curva S
    const reportDates = normalizedReports.map((r) => r.date.getTime())
    const minReportDate = Math.min(...reportDates)
    const maxReportDate = Math.max(...reportDates)

    let start = projectStartDate ? new Date(projectStartDate) : new Date(minReportDate)
    let end = projectEndDate ? new Date(projectEndDate) : new Date(maxReportDate)

    if (isNaN(start.getTime())) start = new Date(minReportDate)
    if (isNaN(end.getTime())) end = new Date(maxReportDate)

    if (minReportDate < start.getTime()) start = new Date(minReportDate)

    // Extender el horizonte final si la fecha planificada quedó atrás pero la obra sigue en ejecución
    const lastReport = normalizedReports[normalizedReports.length - 1]
    const currentMaxPlanned = Math.max(...normalizedReports.map((r) => r.planned))
    if (end.getTime() <= maxReportDate && currentMaxPlanned < 100) {
      const elapsedMs = Math.max(86400000 * 7, maxReportDate - start.getTime())
      const remainingRatio = (100 - currentMaxPlanned) / Math.max(1, currentMaxPlanned)
      const remainingMs = Math.min(86400000 * 90, Math.max(86400000 * 21, elapsedMs * remainingRatio))
      end = new Date(maxReportDate + remainingMs)
    } else if (maxReportDate > end.getTime()) {
      end = new Date(maxReportDate)
    }

    const periods = getAllPeriods(start, end, timeframe)
    if (periods.length === 0) return []

    const totalPeriods = periods.length
    const lastReportPeriodIdx = findPeriodIndex(periods, lastReport.date)

    // Mapeo de hitos conocidos: [índice, planificado, real]
    const milestoneMap = new Map<number, { planned: number; actual: number }>()
    for (const report of normalizedReports) {
      const idx = findPeriodIndex(periods, report.date)
      milestoneMap.set(idx, { planned: report.planned, actual: report.actual })
    }
    // Asegurar que el período de corte oficial refleje exactamente el último hito
    milestoneMap.set(lastReportPeriodIdx, { planned: lastReport.planned, actual: lastReport.actual })

    const knownPoints: { idx: number; planned: number; actual: number }[] = [
      { idx: -1, planned: 0, actual: 0 },
    ]
    const sortedIndices = Array.from(milestoneMap.keys()).sort((a, b) => a - b)
    for (const idx of sortedIndices) {
      if (idx <= lastReportPeriodIdx) {
        knownPoints.push({ idx, ...milestoneMap.get(idx)! })
      }
    }

    return periods.map((period, i) => {
      const matchingReport = normalizedReports.find((r) => r.date >= period.startDate && r.date <= period.endDate)

      let avanceReal: number | null = null
      let avanceProyectado = 0

      if (i <= lastReportPeriodIdx) {
        if (milestoneMap.has(i)) {
          const direct = milestoneMap.get(i)!
          avanceProyectado = direct.planned
          avanceReal = direct.actual
        } else {
          // Interpolar Curva S sigmoidal entre hitos certificados
          let prevPoint = knownPoints[0]
          let nextPoint = knownPoints[knownPoints.length - 1]

          for (let k = 0; k < knownPoints.length; k++) {
            if (knownPoints[k].idx <= i) prevPoint = knownPoints[k]
            if (knownPoints[k].idx >= i) {
              nextPoint = knownPoints[k]
              break
            }
          }

          const span = nextPoint.idx - prevPoint.idx
          if (span > 0) {
            const u = (i - prevPoint.idx) / span
            const sFactor = sCurveFactor(u)
            avanceProyectado = Math.round(prevPoint.planned + (nextPoint.planned - prevPoint.planned) * sFactor)
            avanceReal = Math.round(prevPoint.actual + (nextPoint.actual - prevPoint.actual) * sFactor)
          } else {
            avanceProyectado = nextPoint.planned
            avanceReal = nextPoint.actual
          }
        }
      } else {
        // Tramo futuro: Culminación en Curva S hacia el 100%
        avanceReal = null
        const remainingSteps = totalPeriods - 1 - lastReportPeriodIdx
        const currentStep = i - lastReportPeriodIdx
        if (remainingSteps > 0) {
          const u = currentStep / remainingSteps
          const sFactor = sCurveFactor(u)
          avanceProyectado = Math.min(100, Math.round(lastReport.planned + (100 - lastReport.planned) * sFactor))
        } else {
          avanceProyectado = 100
        }
      }

      return {
        name: period.label,
        periodLabel: period.label,
        dateLabel: `${period.startDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} - ${period.endDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`,
        avanceProyectado: Math.min(100, Math.max(0, avanceProyectado)),
        avanceReal: avanceReal !== null ? Math.min(100, Math.max(0, avanceReal)) : null,
        hasRecord: !!matchingReport,
        recordNote: matchingReport?.attentionPoints,
      }
    })
  }, [normalizedReports, projectStartDate, projectEndDate, timeframe])

  return (
    <Card className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-[15px] font-bold text-[#111416]">
              Evolución de Avance Físico
            </CardTitle>
            {normalizedReports.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className="bg-[#d9772f]/15 text-[#b9561d] hover:bg-[#d9772f]/20 border-0 text-[10px] font-bold px-2 py-0.5 shadow-none">
                  Plan: {currentSnapshot.planned}%
                </Badge>
                <Badge className="bg-[#4c9b7a]/15 text-[#376850] hover:bg-[#4c9b7a]/20 border-0 text-[10px] font-bold px-2 py-0.5 shadow-none">
                  Real: {currentSnapshot.actual}%
                </Badge>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#4e5558] mt-0.5">
            Avance físico proyectado versus avance real
          </p>
        </div>
        {normalizedReports.length > 0 && (
          <div className="flex w-full md:w-auto items-center rounded-lg border border-[#d8d0c4] bg-[#f5f0e8] p-1 shrink-0">
            <button
              onClick={() => setTimeframe("semanal")}
              className={cn(
                "flex-1 md:flex-initial rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors text-center whitespace-nowrap",
                timeframe === "semanal"
                  ? "bg-[#111416] text-white shadow-xs"
                  : "text-[#4e5558] hover:bg-[#ece6dc]"
              )}
            >
              Semanal
            </button>
            <button
              onClick={() => setTimeframe("mensual")}
              className={cn(
                "flex-1 md:flex-initial rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors text-center whitespace-nowrap",
                timeframe === "mensual"
                  ? "bg-[#111416] text-white shadow-xs"
                  : "text-[#4e5558] hover:bg-[#ece6dc]"
              )}
            >
              Mensual
            </button>
            <button
              onClick={() => setTimeframe("registro")}
              className={cn(
                "flex-1 md:flex-initial rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors text-center whitespace-nowrap",
                timeframe === "registro"
                  ? "bg-[#111416] text-white shadow-xs"
                  : "text-[#4e5558] hover:bg-[#ece6dc]"
              )}
            >
              Por Registro
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {normalizedReports.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-[#f5f0e8] p-3 text-[#b9561d]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111416]">
                No hay registros de avance disponibles
              </p>
              <p className="mt-1 text-xs text-[#4e5558]">
                Este proyecto aún no cuenta con certificaciones ni avances físicos reportados.
              </p>
            </div>
            {projectId && (
              <Link
                to={`/project-management/detalle/${projectId}/avances`}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-xs font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
              >
                Registrar primer avance
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="h-[250px] sm:h-[280px] md:h-[320px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="colorProyectado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d9772f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#d9772f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4c9b7a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4c9b7a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8d0c4" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#8d918f" }}
                    interval="preserveStartEnd"
                    minTickGap={16}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#8d918f" }}
                    tickFormatter={(v) => `${v}%`}
                    width={38}
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip
                    wrapperStyle={{ outline: "none" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #d8d0c4",
                      backgroundColor: "#fffdf9",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: any) => {
                      if (value === null || value === undefined) {
                        return ["Pendiente de certificar", name === "avanceProyectado" ? "Avance Proyectado" : "Avance Real"]
                      }
                      return [
                        `${Math.round(Number(value))}%`,
                        name === "avanceProyectado" ? "Avance Proyectado" : "Avance Real",
                      ]
                    }}
                    labelFormatter={(label: any, items: readonly any[]) => {
                      const payload = items?.[0]?.payload
                      const base = payload?.dateLabel ? `${label} (${payload.dateLabel})` : label
                      if (payload?.recordNote && payload.recordNote !== "Sin observaciones") {
                        return `${base} · "${payload.recordNote}"`
                      }
                      return base
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avanceProyectado"
                    stroke="#d9772f"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorProyectado)"
                    name="avanceProyectado"
                  />
                  <Area
                    type="monotone"
                    dataKey="avanceReal"
                    stroke="#4c9b7a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReal)"
                    name="avanceReal"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4e5558]">
                <div className="h-3 w-3 rounded-full bg-[#d9772f]"></div>
                Avance Proyectado
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4e5558]">
                <div className="h-3 w-3 rounded-full bg-[#4c9b7a]"></div>
                Avance Real
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const ProjectProgressChart = ProjectCostChart
