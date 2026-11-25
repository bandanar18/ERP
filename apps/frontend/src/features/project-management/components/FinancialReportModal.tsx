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
  Building2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PayablesOverview, PayablesSnapshot } from "../interfaces/payables.types"

interface FinancialReportModalProps {
  isOpen: boolean
  onClose: () => void
  /** Modo global: resumen de todos los proyectos (desde FinancialDashboardView) */
  globalData?: PayablesOverview | null
  /** Modo específico: proyecto individual (desde PayablesView) */
  project?: any
  projectSnapshot?: PayablesSnapshot | null
}

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0))

export function FinancialReportModal({
  isOpen,
  onClose,
  globalData,
  project,
  projectSnapshot,
}: FinancialReportModalProps) {
  const isProjectMode = Boolean(projectSnapshot && project)

  const emissionDateStr = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Métricas consolidadas
  const summary = useMemo(() => {
    if (isProjectMode && projectSnapshot) {
      const snap = projectSnapshot.summary
      const totalDebt = snap.totalDebt || 0
      const totalPaid = snap.totalPaid || 0
      const totalPending = snap.totalPending || 0
      const paidPct = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0
      const pendingPct = totalDebt > 0 ? Math.round((totalPending / totalDebt) * 100) : 0

      return {
        totalDebt,
        totalPaid,
        totalPending,
        paidPct,
        pendingPct,
        totalActualCost: Number(project?.actualCost || 0),
        totalCollected: Number(project?.totalCollected || 0),
        advancePayment: Number(projectSnapshot.advance?.advanceAmount || 0),
        amortizedAdvance: Number(projectSnapshot.advance?.amortizedAmount || 0),
        pendingAdvance: Number(projectSnapshot.advance?.pendingAmortization || 0),
        totalItems: projectSnapshot.items.length,
      }
    }

    if (globalData) {
      const g = globalData.globalSummary
      const totalDebt = g.totalDebt || 0
      const totalPaid = g.totalPaid || 0
      const totalPending = g.totalPending || 0
      const paidPct = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0
      const pendingPct = totalDebt > 0 ? Math.round((totalPending / totalDebt) * 100) : 0

      return {
        totalDebt,
        totalPaid,
        totalPending,
        paidPct,
        pendingPct,
        totalActualCost: Number(g.totalActualCost || 0),
        totalCollected: Number(g.totalCollected || 0),
        advancePayment: 0,
        amortizedAdvance: 0,
        pendingAdvance: 0,
        totalItems: globalData.projects.length,
      }
    }

    return {
      totalDebt: 0,
      totalPaid: 0,
      totalPending: 0,
      paidPct: 0,
      pendingPct: 0,
      totalActualCost: 0,
      totalCollected: 0,
      advancePayment: 0,
      amortizedAdvance: 0,
      pendingAdvance: 0,
      totalItems: 0,
    }
  }, [isProjectMode, projectSnapshot, project, globalData])

  const reportCode = isProjectMode
    ? project?.projectCode || "PROYECTO"
    : "GLOBAL"

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true)
      const res = await fetchWithRefresh("/api/reports/financial/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isProjectMode,
          project,
          projectSnapshot,
          globalData,
          summary,
        }),
      })

      if (!res.ok) {
        throw new Error("No se pudo generar el reporte financiero en el servidor")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const dateStr = new Date().toISOString().split("T")[0]
      a.download = `Reporte_Financiero_Pagos_${reportCode}_${dateStr}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error al generar PDF:", err)
      // Fallback a exportador local si el servidor tiene un fallo de red
      const reportElem = document.getElementById("printable-financial-report")
      if (reportElem) {
        const dateStr = new Date().toISOString().split("T")[0]
        await downloadElementAsPdf(
          reportElem,
          `Reporte_Financiero_Pagos_${reportCode}_${dateStr}.pdf`
        )
      }
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[98vw] sm:w-[94vw] max-w-[98vw] sm:max-w-5xl lg:max-w-6xl max-h-[94vh] flex flex-col p-0 border border-[#d8d0c4] bg-[#f4efe6] text-[#111416] shadow-[0_24px_50px_rgba(17,20,22,0.22)] overflow-hidden"
      >
        {/* Barra superior de acciones */}
        <div className="no-print shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#d8d0c4] bg-[#fffdf9] px-4 py-3 sm:px-7">
          <DialogHeader className="p-0 gap-0 text-left">
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-6 bg-[#d9772f]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b9561d]">
                Módulo Financiero
              </span>
            </div>
            <DialogTitle className="font-display text-lg sm:text-2xl font-normal leading-tight tracking-[0.01em] text-[#111416] mt-0.5">
              {isProjectMode
                ? `Resumen de Pagos y Cuentas por Pagar: ${project?.projectName || project?.projectCode}`
                : "Informe Financiero de Pagos y Obligaciones"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#4e5558] mt-0.5">
              Control financiero: detalle consolidado de pagos y cuentas por pagar
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
            id="printable-financial-report"
            className="mx-auto max-w-[850px] w-full rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 sm:p-8 md:p-10 shadow-[0_10px_30px_rgba(17,20,22,0.06)] text-[#111416] print:m-0 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none print:bg-white"
          >
            {/* 1. Membrete Institucional Oficial */}
            <header className="border-b border-[#d8d0c4] pb-5 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl sm:text-[30px] font-normal leading-[1.05] tracking-[0.01em] text-[#111416]">
                    INFORME DE PAGOS Y CUENTAS POR PAGAR
                  </h1>
                  <p className="mt-1.5 text-xs font-medium text-[#4e5558]">
                    {isProjectMode
                      ? `Proyecto: ${project?.projectName || project?.projectCode} · Control de compromisos y cuentas por pagar`
                      : "Informe consolidado de compromisos contractuales y cuentas por pagar"}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 shrink-0">
                  <span className="font-mono text-xs font-black tracking-wider bg-[#111416] text-[#fffdf9] px-2.5 py-1 rounded inline-block">
                    {isProjectMode ? project?.projectCode : "CONSOLIDADO"}
                  </span>
                  <span className="text-[10px] font-semibold text-[#8d918f]">
                    Emisión: {emissionDateStr}
                  </span>
                </div>
              </div>

              {/* Acento estético bicolor */}
              <div className="mt-4 sm:mt-5 h-[3px] w-full rounded-full bg-[#111416] flex overflow-hidden">
                <span className="h-full w-24 bg-[#4c9b7a]" />
                <span className="h-full w-16 bg-[#d9772f]" />
              </div>
            </header>

            {/* 2. Ficha Técnica / Contexto */}
            {isProjectMode && project && (
              <section className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-3.5 w-3.5 text-[#b9561d]" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                    1. Ficha del Proyecto
                  </h2>
                </div>

                <div className="rounded-lg border border-[#d8d0c4] bg-[#fbf9f5] p-3 sm:p-4 text-xs w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                        Proyecto
                      </span>
                      <p className="mt-0.5 font-bold text-[#111416] truncate" title={project.projectName || project.fullName || project.projectCode}>
                        {project.projectName || project.fullName || project.projectCode}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                        Empresa Contratante
                      </span>
                      <p className="mt-0.5 font-semibold text-[#111416] truncate" title={project.company?.legalName || project.company?.name}>
                        {project.company?.legalName || project.company?.name || "Sin empresa"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d918f] block">
                        Anticipo Otorgado / Pendiente
                      </span>
                      <p className="mt-0.5 font-semibold text-[#111416]">
                        {fmt(summary.advancePayment)} (Pendiente: {fmt(summary.pendingAdvance)})
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Panel de Resumen de Pagos y Deudas */}
            <section className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-[#b9561d]" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                    {isProjectMode ? "2. Resumen de Deuda y Pagos" : "1. Resumen Global de Obligaciones"}
                  </h2>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#4e5558] bg-[#f5f0e8] border border-[#d8d0c4] px-2 py-0.5 rounded inline-block">
                    Valores expresados en USD
                  </span>
                </div>
              </div>

              {/* Grid responsivo de Tarjetas KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                {/* Total Deuda Comprometida */}
                <div className="rounded-xl border border-[#d8d0c4] bg-[#fbf9f5] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#4e5558]">
                      Deuda Total Comprometida
                    </span>
                    <DollarSign className="h-4 w-4 text-[#4e5558]" />
                  </div>
                  <div className="mt-2">
                    <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal leading-none text-[#111416]">
                      {fmt(summary.totalDebt)}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-[#4e5558]">
                    {isProjectMode
                      ? `${summary.totalItems} obligaciones registradas`
                      : `${globalData?.globalSummary.totalProjects || 0} proyectos con deuda`}
                  </p>
                </div>

                {/* Lo que ya se canceló */}
                <div className="rounded-xl border border-[#a3d4bb] bg-[#f0f7f3] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#236343]">
                      Total Cancelado
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-[#236343]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal leading-none text-[#1b5e20]">
                      {fmt(summary.totalPaid)}
                    </span>
                    <span className="text-xs font-bold text-[#236343]">
                      ({summary.paidPct}%)
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-[#2e7d32]">
                    Desembolsos efectivos liquidados
                  </p>
                </div>

                {/* Lo que se adeuda (Por Pagar) */}
                <div
                  className={cn(
                    "rounded-xl border p-3.5 sm:p-4",
                    summary.totalPending > 0
                      ? "border-[#edb6a5] bg-[#fff0eb]"
                      : "border-[#d8d0c4] bg-[#fbf9f5]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.14em]",
                        summary.totalPending > 0 ? "text-[#c85454]" : "text-[#236343]"
                      )}
                    >
                      Total Por Pagar
                    </span>
                    {summary.totalPending > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-[#c85454]" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-[#236343]" />
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        "font-display text-2xl sm:text-3xl lg:text-4xl font-normal leading-none",
                        summary.totalPending > 0 ? "text-[#c85454]" : "text-[#236343]"
                      )}
                    >
                      {fmt(summary.totalPending)}
                    </span>
                    <span className="text-xs font-bold text-[#4e5558]">
                      ({summary.pendingPct}%)
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-[10px] font-bold",
                      summary.totalPending > 0 ? "text-[#a84730]" : "text-[#2e7d32]"
                    )}
                  >
                    {summary.totalPending > 0
                      ? "Obligaciones pendientes de pago"
                      : "Sin obligaciones pendientes"}
                  </p>
                </div>
              </div>

              {/* Barra de progreso de amortización y pago */}
              <div className="mt-4 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] font-bold text-[#4e5558] mb-1.5">
                  <span>Proporción de Liquidación de Deuda</span>
                  <div className="flex items-center gap-3">
                    <span>
                      <span className="inline-block h-2 w-2 rounded-full bg-[#236343] mr-1 align-middle" />
                      <span className="text-[#236343] align-middle">Cancelado ({summary.paidPct}%)</span>
                    </span>
                    <span>
                      <span className="inline-block h-2 w-2 rounded-full bg-[#c85454] mr-1 align-middle" />
                      <span className="text-[#c85454] align-middle">Por Pagar ({summary.pendingPct}%)</span>
                    </span>
                  </div>
                </div>
                <div className="relative h-3 w-full rounded-full bg-[#ece6dc] overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-[#236343]"
                    style={{ width: `${summary.paidPct}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-[#c85454]"
                    style={{ width: `${summary.pendingPct}%` }}
                  />
                </div>
              </div>
            </section>

            {/* 4. Tabla Detallada */}
            <section className="mt-6 block w-full clear-both">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#b9561d]" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#111416]">
                    {isProjectMode
                      ? "3. Detalle de Obligaciones y Cuentas por Pagar"
                      : "2. Detalle de Cuentas por Pagar por Proyecto"}
                  </h2>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#8d918f]">
                    {isProjectMode
                      ? `${projectSnapshot?.items.length || 0} registros`
                      : `${globalData?.projects.length || 0} proyectos`}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#d8d0c4] bg-white">
                {isProjectMode ? (
                  // Tabla de obligaciones del proyecto
                  <table className="w-full text-left text-xs border-collapse table-fixed min-w-[580px] sm:min-w-full">
                    <colgroup>
                      <col className="w-[36%]" />
                      <col className="w-[16%]" />
                      <col className="w-[16%]" />
                      <col className="w-[16%]" />
                      <col className="w-[16%]" />
                    </colgroup>
                    <thead className="border-b border-[#d8d0c4] bg-[#f5f0e8] text-[9.5px] font-black uppercase tracking-[0.14em] text-[#4e5558]">
                      <tr>
                        <th className="py-2.5 px-3">Proveedor / Concepto</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Monto Original</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Cancelado</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Por Pagar</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece6dc]">
                      {projectSnapshot?.items.map((item) => (
                        <tr key={item.id} className="hover:bg-[#fbf9f5] transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-[#111416] block text-xs">
                              {item.supplier || item.description}
                            </span>
                            {item.supplier && (
                              <span className="text-[10px] text-[#4e5558] block mt-0.5 leading-tight">
                                {item.description}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium text-[#111416] whitespace-nowrap tabular-nums">
                            {fmt(item.amountUsd)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-[#1b5e20] whitespace-nowrap tabular-nums">
                            {fmt(item.paidUsd)}
                          </td>
                          <td
                            className={cn(
                              "py-2.5 px-3 text-center font-black whitespace-nowrap tabular-nums",
                              item.pendingUsd > 0 ? "text-[#c85454]" : "text-[#4e5558]"
                            )}
                          >
                            {fmt(item.pendingUsd)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-block rounded px-2 py-0.5 text-[10px] font-bold border",
                                item.status === "PAGADO"
                                  ? "bg-[#edf3ec] text-[#376850] border-[#a7c9b4]"
                                  : item.status === "PARCIAL"
                                  ? "bg-[#fdf4dc] text-[#8a6a12] border-[#e6d28f]"
                                  : "bg-[#fff0eb] text-[#a84730] border-[#edb6a5]"
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // Tabla de portafolio global
                  <table className="w-full text-left text-xs border-collapse table-fixed min-w-[620px] sm:min-w-full">
                    <colgroup>
                      <col className="w-[24%]" />
                      <col className="w-[24%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                    </colgroup>
                    <thead className="border-b border-[#d8d0c4] bg-[#f5f0e8] text-[9.5px] font-black uppercase tracking-[0.14em] text-[#4e5558]">
                      <tr>
                        <th className="py-2.5 px-3">Proyecto</th>
                        <th className="py-2.5 px-3">Empresa</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Deuda Total</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Cancelado</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Por Pagar</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">% Saldado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece6dc]">
                      {globalData?.projects.map((p) => {
                        const paid = p.summary.totalPaid
                        const debt = p.summary.totalDebt
                        const pending = p.summary.totalPending
                        const pct = debt > 0 ? Math.round((paid / debt) * 100) : 0

                        return (
                          <tr key={p.id} className="hover:bg-[#fbf9f5] transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-[#111416] block text-xs">
                                {p.code}
                              </span>
                              <span className="text-[10px] text-[#4e5558] block mt-0.5 leading-tight">
                                {p.fullName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#4e5558] font-medium text-xs">
                              {p.company?.name || "Sin empresa"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-[#111416] whitespace-nowrap tabular-nums">
                              {fmt(debt)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-[#1b5e20] whitespace-nowrap tabular-nums">
                              {fmt(paid)}
                            </td>
                            <td
                              className={cn(
                                "py-2.5 px-3 text-center font-black whitespace-nowrap tabular-nums",
                                pending > 0 ? "text-[#c85454]" : "text-[#4e5558]"
                              )}
                            >
                              {fmt(pending)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#111416] whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-block rounded px-2 py-0.5 text-[10px] font-bold",
                                  pct >= 100
                                    ? "bg-[#edf3ec] text-[#376850]"
                                    : pct > 0
                                    ? "bg-[#fdf4dc] text-[#8a6a12]"
                                    : "bg-[#fff0eb] text-[#a84730]"
                                )}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Pie de página institucional */}
            <footer className="mt-8 border-t border-[#ece6dc] pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] font-medium text-[#8d918f]">
              <span>Registros conciliados con módulo bancario y proveedores</span>
              <span>Página 1 de 1</span>
            </footer>
          </article>
        </div>

        {/* Estilos para impresión nativa */}
        <style>{`
          @media print {
            body {
              background: white !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-financial-report,
            #printable-financial-report * {
              visibility: visible !important;
            }
            #printable-financial-report {
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
