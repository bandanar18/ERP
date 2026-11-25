"use client"

import { useState, useMemo } from "react"
import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh"
import { downloadElementAsPdf } from "../utils/exportPdf"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Download,
  X,
  Calendar,
  TrendingUp,
  CheckCircle2,
  FileText,
  Clock,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { PROJECT_STATUS_CONFIG } from "../interfaces/project.types"

interface ProjectReportModalProps {
  isOpen: boolean
  onClose: () => void
  project: any
  progressList?: any[]
}

function parsePercent(val: any): number {
  if (val === null || val === undefined) return 0
  const str = String(val).replace("%", "").trim().replace(",", ".")
  const num = parseFloat(str)
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, num))
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "N/A"
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatFullDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "N/A"
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function ProjectReportModal({
  isOpen,
  onClose,
  project,
  progressList = [],
}: ProjectReportModalProps) {
  // Historial ordenado cronológicamente
  const normalizedReports = useMemo(() => {
    return (progressList || [])
      .map((p) => {
        const rawDate = p.date || p.endDate || p.startDate || p.createdAt
        const date = rawDate ? new Date(rawDate) : null
        if (!date || isNaN(date.getTime())) return null
        return {
          id: p.id,
          date,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          actual: parsePercent(p.actualProgress),
          planned: parsePercent(p.plannedProgress),
          attentionPoints: p.attentionPoints || "Sin observaciones",
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [progressList])

  // Valores de último corte
  const latestReport =
    normalizedReports.length > 0
      ? normalizedReports[normalizedReports.length - 1]
      : null

  const actualPercent =
    latestReport?.actual ??
    parsePercent(
      project?.lastProgress?.actualProgress ?? project?.actualPhysicalProgress
    )

  const plannedPercent =
    latestReport?.planned ??
    parsePercent(
      project?.lastProgress?.plannedProgress ?? project?.plannedPhysicalProgress
    )

  // Generación de puntos para la gráfica ejecutiva
  const chartData = useMemo(() => {
    if (normalizedReports.length === 0) return []

    const result: {
      name: string
      dateLabel: string
      avanceProyectado: number
      avanceReal: number | null
    }[] = []

    // Inicio de obra (0%)
    if (project?.startDate) {
      const pStart = new Date(project.startDate)
      if (!isNaN(pStart.getTime()) && pStart.getTime() < normalizedReports[0].date.getTime()) {
        result.push({
          name: "Inicio",
          dateLabel: formatDate(pStart),
          avanceProyectado: 0,
          avanceReal: 0,
        })
      }
    }

    normalizedReports.forEach((rep, idx) => {
      const shortName = rep.date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      })
      result.push({
        name: `Corte ${idx + 1}`,
        dateLabel: shortName,
        avanceProyectado: rep.planned,
        avanceReal: rep.actual,
      })
    })

    // Meta final si la fecha de fin está por delante
    if (project?.endDate) {
      const pEnd = new Date(project.endDate)
      const lastRep = normalizedReports[normalizedReports.length - 1]
      if (!isNaN(pEnd.getTime()) && pEnd.getTime() > lastRep.date.getTime()) {
        result.push({
          name: "Culminación",
          dateLabel: formatDate(pEnd),
          avanceProyectado: 100,
          avanceReal: null,
        })
      }
    }

    return result
  }, [normalizedReports, project?.startDate, project?.endDate])

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true)
      const res = await fetchWithRefresh("/api/reports/project-progress/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          progressList,
          chartData,
        }),
      })

      if (!res.ok) {
        throw new Error("No se pudo generar el reporte PDF en el servidor")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const reportCode = project?.projectCode || "PROYECTO"
      const dateStr = new Date().toISOString().split("T")[0]
      a.download = `Reporte_Avance_Fisico_${reportCode}_${dateStr}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error al generar PDF:", err)
      // Fallback a exportador local si el servidor tiene un fallo de red
      const reportElem = document.getElementById("printable-project-report")
      if (reportElem) {
        const reportCode = project?.projectCode || "PROYECTO"
        const dateStr = new Date().toISOString().split("T")[0]
        await downloadElementAsPdf(
          reportElem,
          `Reporte_Avance_Fisico_${reportCode}_${dateStr}.pdf`
        )
      }
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (!project) return null

  const emissionDateStr = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const managerName = (() => {
    const mgr = (project.manager?.managerName || "").trim()
    if (mgr && !/^(null|undefined)\s*(null|undefined)?$/i.test(mgr)) {
      return mgr
    }
    if (project.manager?.managerEmail) return project.manager.managerEmail
    if (project.pm_users) {
      const name = `${project.pm_users.firstName || ""} ${project.pm_users.lastName || ""}`.trim()
      return name || project.pm_users.email || "Planificador Asignado"
    }
    return "Planificador Responsable"
  })()

  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || {
    label: project.status,
    badgeClass: "bg-[#ece6dc] text-[#4e5558]",
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[98vw] sm:w-[94vw] max-w-[98vw] sm:max-w-5xl lg:max-w-6xl max-h-[94vh] flex flex-col p-0 border border-[#d8d0c4] bg-[#f4efe6] text-[#111416] shadow-[0_24px_50px_rgba(17,20,22,0.22)] overflow-hidden"
      >
        {/* Barra superior de acciones (Oculta al imprimir) */}
        <div className="no-print shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#d8d0c4] bg-[#fffdf9] px-4 py-3 sm:px-7">
          <DialogHeader className="p-0 gap-0 text-left">
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-6 bg-[#d9772f]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b9561d]">
                Control de Obra
              </span>
            </div>
            <DialogTitle className="font-display text-lg sm:text-2xl font-normal leading-tight tracking-[0.01em] text-[#111416] mt-0.5">
              Ficha Oficial de Avance Físico: {project.projectName || project.fullName || project.projectCode}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#4e5558] mt-0.5">
              Certificación periódica oficial de avance proyectado vs. avance real en obra
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto">
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#111416] text-[#fffdf9] hover:bg-[#2b3135] text-xs font-bold gap-2 px-3.5 sm:px-4 py-2 h-9 shadow-xs transition-colors"
            >
              <Download className="h-4 w-4 text-[#d9772f]" />
              <span>{isGeneratingPdf ? "Generando PDF..." : "Descargar PDF"}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 border-[#d8d0c4] bg-white text-[#4e5558] hover:bg-[#ece6dc] hover:text-[#111416]"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </div>

        {/* Visor tipo papel con scroll (En pantalla) y limpio (En impresión) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-5 md:p-7 bg-[#ece6dc]/60">
          <article
            id="printable-project-report"
            className="mx-auto max-w-[840px] w-full rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 sm:p-8 md:p-10 shadow-[0_10px_30px_rgba(17,20,22,0.06)] text-[#111416] print:m-0 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none print:bg-white"
          >
            {/* 1. Membrete Institucional Oficial */}
            <header className="border-b border-[#d8d0c4] pb-5 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl sm:text-[30px] font-normal leading-[1.05] tracking-[0.01em] text-[#111416]">
                    FICHA OFICIAL DE AVANCE FÍSICO
                  </h1>
                  <p className="mt-1.5 text-xs font-medium text-[#4e5558]">
                    Control de planificación, ejecución física y seguimiento de cronograma
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 shrink-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs font-black tracking-wider bg-[#111416] text-[#fffdf9] px-2.5 py-1 rounded">
                      {project.projectCode}
                    </span>
                    <span className={cn("inline-flex items-center rounded-full text-[11px] font-bold px-2.5 py-1", statusConfig.badgeClass)}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#8d918f]">
                    Emisión: {emissionDateStr}
                  </span>
                </div>
              </div>

              {/* Acento estético bicolor */}
              <div className="mt-4 sm:mt-5 h-[3px] w-full rounded-full bg-[#111416] flex overflow-hidden">
                <span className="h-full w-24 bg-[#d9772f]" />
                <span className="h-full w-12 bg-[#4c9b7a]" />
              </div>
            </header>

            {/* 2. Ficha Técnica del Proyecto */}
            <section className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-3.5 w-3.5 text-[#b9561d]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                  1. Ficha Técnica General del Proyecto
                </h2>
              </div>

              <div className="rounded-lg border border-[#d8d0c4] bg-[#fbf9f5] p-3 sm:p-4 text-xs w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                      Nombre del Proyecto
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-[#111416] truncate" title={project.projectName || project.fullName || project.projectCode}>
                      {project.projectName || project.fullName || project.projectCode}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                      Empresa Mandante / Cliente
                    </span>
                    <p className="mt-0.5 font-semibold text-[#111416] truncate" title={project.company?.legalName || project.company?.name}>
                      {project.company?.legalName || project.company?.name || "Sin empresa asignada"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                      Planificador Responsable
                    </span>
                    <p className="mt-0.5 font-semibold text-[#111416] truncate" title={managerName}>
                      {managerName}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#ece6dc] mt-3 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                      Código del Proyecto
                    </span>
                    <p className="mt-0.5 font-semibold text-[#111416] font-mono">
                      {project.projectCode}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                      Fecha de Inicio
                    </span>
                    <p className="mt-0.5 font-semibold text-[#111416]">
                      {formatFullDate(project.startDate)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                      Fecha Fin
                    </span>
                    <p className="mt-0.5 font-semibold text-[#111416]">
                      {formatFullDate(project.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Panel de Métricas de Avance Físico Actual */}
            <section className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[#b9561d]" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                    2. Estado del Avance Físico (Último Corte)
                  </h2>
                </div>
                <div>
                  {latestReport && (
                    <span className="text-[10px] font-bold text-[#4e5558] bg-[#f5f0e8] border border-[#d8d0c4] px-2 py-0.5 rounded inline-block">
                      Corte al {formatDate(latestReport.date)}
                    </span>
                  )}
                </div>
              </div>

              {/* Strip de Tarjetas KPI: Avance Real y Avance Programado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2">
                {/* Avance Real */}
                <div className="rounded-xl border border-[#a3d4bb] bg-[#f0f7f3] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#236343]">
                      Avance Real Ejecutado
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-[#236343]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal leading-none text-[#1b5e20]">
                      {actualPercent}%
                    </span>
                    <span className="text-xs font-bold text-[#236343]">ejecutado</span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-[#2e7d32]">
                    Total certificado y verificado en obra
                  </p>
                </div>

                {/* Avance Programado */}
                <div className="rounded-xl border border-[#f5c6a5] bg-[#fdf6f0] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b9561d]">
                      Avance Programado
                    </span>
                    <Clock className="h-4 w-4 text-[#b9561d]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal leading-none text-[#b9561d]">
                      {plannedPercent}%
                    </span>
                    <span className="text-xs font-bold text-[#b9561d]">meta</span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-[#a84730]">
                    Objetivo planificado para este corte
                  </p>
                </div>
              </div>

              {/* Barra comparativa visual */}
              <div className="mt-4 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] font-bold text-[#4e5558] mb-1.5">
                  <span>Comparativa Gráfica de Cumplimiento</span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[#236343]">
                      <span className="h-2 w-2 rounded-full bg-[#236343]" />
                      <span>Real ({actualPercent}%)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#d9772f]">
                      <span className="h-2 w-2 rounded-full bg-[#d9772f]" />
                      <span>Programado ({plannedPercent}%)</span>
                    </span>
                  </div>
                </div>
                <div className="relative h-3 w-full rounded-full bg-[#ece6dc] overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-[#236343] rounded-full z-10"
                    style={{ width: `${Math.min(100, Math.max(0, actualPercent))}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 left-0 border-r-2 border-[#d9772f] bg-[#d9772f]/20 z-20 pointer-events-none"
                    style={{ width: `${Math.min(100, Math.max(0, plannedPercent))}%` }}
                  />
                </div>
              </div>

              {/* Bloque de Observaciones del Último Corte */}
              <div className="mt-3.5 rounded-lg border border-[#d8d0c4] bg-[#fdfbf7] p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#b9561d] block">
                  Puntos de Atención y Observaciones del Último Corte:
                </span>
                <p className="mt-1 text-xs font-semibold text-[#111416] italic leading-relaxed">
                  "{latestReport?.attentionPoints || project.lastProgress?.attentionPoints || "Sin observaciones registradas para este período."}"
                </p>
              </div>
            </section>

            {/* 4. Gráfica Ejecutiva de Evolución de Avance Físico */}
            <section className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[#b9561d]" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                    3. Evolución del Avance Físico (Curva de Progreso)
                  </h2>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#8d918f]">
                    Escala porcentual (0% - 100%)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[#d8d0c4] bg-white p-3 sm:p-5">
                {chartData.length === 0 ? (
                  <div className="flex h-52 flex-col items-center justify-center gap-2 text-xs font-semibold text-[#8d918f]">
                    <Clock className="h-6 w-6 text-[#d8d0c4]" />
                    <span>No hay registros suficientes de avance físico para graficar</span>
                  </div>
                ) : (
                  <div className="h-[220px] sm:h-[260px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="execColorProyectado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d9772f" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#d9772f" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="execColorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#236343" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#236343" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5ded3"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 9, fill: "#4e5558", fontWeight: 600 }}
                          axisLine={{ stroke: "#d8d0c4" }}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#4e5558", fontWeight: 600 }}
                          tickFormatter={(v) => `${v}%`}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          width={32}
                          axisLine={{ stroke: "#d8d0c4" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #d8d0c4",
                            backgroundColor: "#fffdf9",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                          formatter={(value: any, name: any) => [
                            value !== null ? `${Math.round(Number(value))}%` : "Pendiente",
                            name === "avanceProyectado" ? "Avance Programado" : "Avance Real",
                          ]}
                          labelFormatter={(label: any, items: readonly any[]) => {
                            const dateLbl = items?.[0]?.payload?.dateLabel
                            return dateLbl ? `${label} (${dateLbl})` : label
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="avanceProyectado"
                          stroke="#d9772f"
                          strokeWidth={2.5}
                          fill="url(#execColorProyectado)"
                          name="avanceProyectado"
                        />
                        <Area
                          type="monotone"
                          dataKey="avanceReal"
                          stroke="#236343"
                          strokeWidth={2.5}
                          fill="url(#execColorReal)"
                          name="avanceReal"
                          connectNulls={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6 border-t border-[#ece6dc] pt-3 text-[11px] font-bold text-[#4e5558]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d9772f]" />
                    <span>Avance Programado (Meta)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#236343]" />
                    <span>Avance Real (Ejecutado)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Historial de Certificaciones Registradas */}
            {normalizedReports.length > 0 && (
              <section className="mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#b9561d]" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                      4. Historial Detallado de Certificaciones ({normalizedReports.length})
                    </h2>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#8d918f]">
                      Orden cronológico descendente
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#d8d0c4] bg-white">
                  <table className="w-full text-left text-xs border-collapse table-fixed min-w-[560px] sm:min-w-full">
                    <colgroup>
                      <col className="w-[16%]" />
                      <col className="w-[28%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[32%]" />
                    </colgroup>
                    <thead className="border-b border-[#d8d0c4] bg-[#f5f0e8] text-[9.5px] font-black uppercase tracking-[0.14em] text-[#4e5558]">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Fecha Emisión</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Período de Medición</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Real</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Programado</th>
                        <th className="py-2.5 px-3">Puntos de Atención</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece6dc]">
                      {normalizedReports
                        .slice()
                        .reverse()
                        .map((rep, idx) => (
                          <tr
                            key={rep.id || idx}
                            className="hover:bg-[#fbf9f5] transition-colors"
                          >
                            <td className="py-2.5 px-3 font-bold text-[#111416] whitespace-nowrap">
                              {formatDate(rep.date)}
                            </td>
                            <td className="py-2.5 px-3 text-[#4e5558] font-medium">
                              {rep.startDate && rep.endDate
                                ? `${formatDate(rep.startDate)} al ${formatDate(rep.endDate)}`
                                : "Corte periódico"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-[#1b5e20] whitespace-nowrap">
                              {rep.actual}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-[#b9561d] whitespace-nowrap">
                              {rep.planned}%
                            </td>
                            <td className="py-2.5 px-3 text-[#4e5558]">
                              <span className="block text-[11px] italic leading-tight text-[#4e5558]">
                                "{rep.attentionPoints}"
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Pie de página institucional */}
            <footer className="mt-8 border-t border-[#ece6dc] pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] font-medium text-[#8d918f]">
              <span>Certificación de avance físico</span>
              <span>Página 1 de 1</span>
            </footer>
          </article>
        </div>

        {/* Estilos para impresión nativa (A4 / PDF) */}
        <style>{`
          @media print {
            body {
              background: white !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-project-report,
            #printable-project-report * {
              visibility: visible !important;
            }
            #printable-project-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: portrait;
              margin: 10mm;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
