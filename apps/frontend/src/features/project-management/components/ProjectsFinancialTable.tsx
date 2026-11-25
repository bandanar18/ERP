import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "../interfaces/project.types";

interface ProjectsFinancialTableProps {
  projects: any[];
}

export function ProjectsFinancialTable({ projects }: ProjectsFinancialTableProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Mapeo seguro de columnas financieras y operativas por proyecto
  const processedProjects = useMemo(() => {
    return projects.map((p) => {
      const planPresupuesto = Number(p.estimatedCost || p.offeredAmount || 0);

      // Costo real: enviado directamente desde el backend (suma de gastos reales)
      const costoReal = Number(p.actualCost ?? 0);

      // Avance físico del último corte: Planificado (arriba) y Real (abajo)
      const rawActual =
        p.lastProgress?.actualProgress ??
        p.actualPhysicalProgress ??
        p.actualProgress;
      const rawPlanned =
        p.lastProgress?.plannedProgress ??
        p.plannedPhysicalProgress ??
        p.plannedProgress;

      const formatProgressPercent = (val: any, fallback = "0%") => {
        if (val === null || val === undefined || String(val).trim() === "") return fallback;
        const str = String(val).trim();
        return str.endsWith("%") ? str : `${str}%`;
      };

      const planificadoAvance = formatProgressPercent(rawPlanned, "0%");
      const realAvance = formatProgressPercent(rawActual, "0%");
      const progressNum = parseInt(String(realAvance).replace("%", "")) || 0;

      // Facturado / Valuado: suma exclusiva de valuaciones en estado FACTURADO calculadas en el servidor
      const facturadoValuado = Number(p.billedAmount ?? 0);

      // Monto Pagado / Cobrado: suma de cobros recibidos calculada en el servidor
      const montoCobrado = Number(p.collectedAmount ?? 0);

      // Cuentas por Pagar: Carga administrativa / dato directo del servidor
      const cuentasPorPagar = Number(p.cuentasPorPagar ?? p.accountsPayable ?? 0);

      // Anticipo / Amortización
      const anticipo = Number(p.advanceAmount ?? 0);
      const amortizacion = Number(p.amortizedAmount ?? 0);

      // Fecha de Culminación: Real si existe, sino estimada
      const fechaReal = p.actualEndDate || p.closedAt;
      const fechaEstimada = p.endDate;
      const fechaCulminacion = fechaReal
        ? {
            label: new Date(fechaReal).toLocaleDateString("es-ES"),
            isReal: true,
          }
        : fechaEstimada
        ? {
            label: new Date(fechaEstimada).toLocaleDateString("es-ES"),
            isReal: false,
          }
        : {
            label: "Sin fecha",
            isReal: false,
          };

      return {
        ...p,
        planPresupuesto,
        costoReal,
        planificadoAvance,
        realAvance,
        rawProgress: realAvance,
        progressNum,
        facturadoValuado,
        montoCobrado,
        cuentasPorPagar,
        anticipo,
        amortizacion,
        fechaCulminacion,
      };
    });
  }, [projects]);

  const handleRowClick = (project: any) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  const th =
    "py-3 px-3 text-[10px] font-bold text-[#4e5558] uppercase tracking-[0.05em] whitespace-nowrap";

  return (
    <Card className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#d8d0c4] p-[10px_16px]">
        <div>
          <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
            Vista Financiera y Operativa
          </div>
          <CardTitle className="text-[15px] font-bold tracking-[-0.02em] text-[#111416]">
            Seguimiento de Proyectos
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-md border-[#d8d0c4] bg-[#f5f0e8] px-2 py-0.5 text-[10px] font-bold text-[#4e5558]"
          >
            {projects.length} {projects.length === 1 ? "proyecto" : "proyectos"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Vista Móvil y Tablet: Tarjetas Ejecutivas Simétricas (1 col en móvil, 2 cols en tablet) */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-[#fffdf9]">
            {processedProjects.map((p, index) => {
              const statusConfig =
                PROJECT_STATUS_CONFIG[p.status] || PROJECT_STATUS_CONFIG.IN_PROGRESS;
              const projectName = p.projectName || p.fullName || p.name || p.shortName || p.code || "Proyecto";
              const projectCode = p.projectCode || p.code || "";

              return (
                <motion.div
                  key={p.id}
                  initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    shouldReduceMotion ? { duration: 0 } : { duration: 0.2, delay: index * 0.03 }
                  }
                  className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-3.5 shadow-xs hover:border-[#b9561d]/50 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cabecera de la tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/project-management/detalle/${p.id}`}
                          className="group inline-flex items-center gap-1 font-bold text-sm text-[#111416] hover:text-[#b9561d] transition-colors"
                          title={`Ver ficha completa de ${projectName}`}
                        >
                          <span className="truncate underline decoration-[#d8d0c4] group-hover:decoration-[#b9561d]">
                            {projectName}
                          </span>
                          <ExternalLink className="h-3 w-3 text-[#b9561d] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </Link>
                        {projectCode && (
                          <span className="text-[11px] font-bold text-[#b9561d] block truncate mt-0.5">
                            {projectCode}
                          </span>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "rounded-md text-[9px] shadow-none font-bold px-2 py-0.5 shrink-0 whitespace-nowrap",
                          statusConfig.badgeClass
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Grid 2x2 de métricas financieras y operativas */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {/* Presupuesto / Real */}
                      <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block">
                          Presupuesto / Real
                        </span>
                        <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                          <span className="font-bold text-[#111416] truncate">
                            <strong className="text-[9px] font-bold text-[#4e5558] uppercase mr-1">FP:</strong>
                            {formatCurrency(p.planPresupuesto)}
                          </span>
                          <span className="font-bold text-[#5e8fc2] truncate mt-0.5">
                            <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Real:</strong>
                            {formatCurrency(p.costoReal)}
                          </span>
                        </div>
                      </div>

                      {/* Avance Físico */}
                      <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block">
                          Avance Físico
                        </span>
                        <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                          <span className="font-semibold text-[#111416]">
                            <strong className="text-[9px] font-bold text-[#4e5558] uppercase mr-1">Plan:</strong>
                            {p.planificadoAvance}
                          </span>
                          <span className="font-bold text-[#4c9b7a] mt-0.5">
                            <strong className="text-[9px] font-bold text-[#4c9b7a] uppercase mr-1">Real:</strong>
                            {p.realAvance}
                          </span>
                        </div>
                      </div>

                      {/* Facturado / Cobrado */}
                      <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block">
                          Facturado / Cobrado
                        </span>
                        <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                          <span className="font-semibold text-[#111416] truncate">
                            <strong className="text-[9px] font-bold text-[#4e5558] uppercase mr-1">Fact:</strong>
                            {formatCurrency(p.facturadoValuado)}
                          </span>
                          <span className="font-bold text-[#4c9b7a] truncate mt-0.5">
                            <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Cob:</strong>
                            {formatCurrency(p.montoCobrado)}
                          </span>
                        </div>
                      </div>

                      {/* Cuentas por Pagar */}
                      <div className="rounded-md border border-[#d8d0c4]/60 bg-[#fffdf9] p-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8d918f] block">
                          Cuentas por Pagar
                        </span>
                        <div className="mt-1 flex flex-col leading-tight whitespace-nowrap tabular-nums">
                          <span className={cn("font-bold truncate", p.cuentasPorPagar > 0 ? "text-[#c85454]" : "text-[#111416]")}>
                            <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Por Pagar:</strong>
                            {formatCurrency(p.cuentasPorPagar)}
                          </span>
                          <span className={cn("text-[10px] font-bold mt-0.5", p.cuentasPorPagar > 0 ? "text-[#c85454]" : "text-[#376850]")}>
                            {p.cuentasPorPagar > 0 ? "Saldo pendiente" : "Sin deuda"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pie de tarjeta */}
                  <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#d8d0c4]/40 text-xs">
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-[#4e5558]">
                      <span className="font-medium">Culminación:</span>
                      <span className="font-bold text-[#111416]">{p.fechaCulminacion.label}</span>
                      <span
                        className={cn(
                          "whitespace-nowrap text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          p.fechaCulminacion.isReal ? "bg-[#edf3ec] text-[#4c9b7a]" : "bg-[#ece6dc] text-[#8d918f]"
                        )}
                      >
                        {p.fechaCulminacion.isReal ? "Real" : "Est."}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs font-semibold gap-1 border-[#d8d0c4] bg-[#fffdf9] text-[#111416] hover:bg-[#ece6dc]"
                      onClick={() => handleRowClick(p)}
                    >
                      <span>Ficha rápida</span>
                      <ChevronRight className="h-3 w-3 text-[#4e5558]" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {processedProjects.length === 0 && (
              <div className="col-span-full py-10 text-center text-[#4e5558]">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <AlertCircle className="h-7 w-7 text-[#d8d0c4]" />
                  <p className="text-xs font-bold text-[#111416]">
                    No hay proyectos registrados en el workspace
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista Escritorio: Tabla Panorámica con anchos protegidos */}
        <div
          role="region"
          aria-label="Tabla de seguimiento de proyectos"
          tabIndex={0}
          className="hidden lg:block overflow-x-auto scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9772f]"
        >
          <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
            <caption className="sr-only">
              Tabla de proyectos con formulación presupuestaria (FP), costo real, avance físico,
              facturación, cobros, cuentas por pagar y fechas de culminación.
            </caption>
            <colgroup>
              <col className="w-[20%] min-w-[180px]" />
              <col className="w-[15%] min-w-[145px]" />
              <col className="w-[11%] min-w-[110px]" />
              <col className="w-[16%] min-w-[160px]" />
              <col className="w-[16%] min-w-[155px]" />
              <col className="w-[11%] min-w-[110px]" />
              <col className="w-[8%] min-w-[95px]" />
              <col className="w-[3%] min-w-[45px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#d8d0c4] bg-[#f5f0e8]/50">
                <th scope="col" className={`${th} text-left pl-4`}>
                  Proyecto
                </th>
                <th scope="col" className={`${th} text-left`}>
                  FP / Costo Real
                </th>
                <th scope="col" className={`${th} text-left`}>
                  Avance
                </th>
                <th scope="col" className={`${th} text-left`}>
                  Facturado / Cobrado
                </th>
                <th scope="col" className={`${th} text-left`}>
                  Cuentas por Pagar
                </th>
                <th scope="col" className={`${th} text-left`}>
                  Culminación
                </th>
                <th scope="col" className={`${th} text-left`}>
                  Estado
                </th>
                <th scope="col" className={`${th} text-center pr-4`}>
                  <span className="sr-only">Detalles</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {processedProjects.map((p, index) => {
                const statusConfig =
                  PROJECT_STATUS_CONFIG[p.status] || PROJECT_STATUS_CONFIG.IN_PROGRESS;
                const projectName = p.projectName || p.fullName || p.name || p.shortName || p.code || "Proyecto";
                const projectCode = p.projectCode || p.code || "";

                return (
                  <motion.tr
                    key={p.id}
                    initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={
                      shouldReduceMotion ? { duration: 0 } : { duration: 0.2, delay: index * 0.03 }
                    }
                    className="border-b border-[#d8d0c4]/60 transition-colors last:border-b-0 hover:bg-[#f5f0e8]/60"
                  >
                    {/* 1. Proyecto: Arriba Nombre Completo (enlace), Abajo código */}
                    <th scope="row" className="px-3.5 py-3 pl-4 text-left font-normal">
                      <div className="flex flex-col leading-tight min-w-0">
                        <Link
                          to={`/project-management/detalle/${p.id}`}
                          className="group inline-flex items-center gap-1 font-bold text-[12px] text-[#111416] hover:text-[#b9561d] transition-colors"
                          title={`Ver ficha completa de ${projectName}`}
                        >
                          <span className="truncate underline decoration-[#d8d0c4] group-hover:decoration-[#b9561d]">
                            {projectName}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5 text-[#b9561d] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </Link>
                        {projectCode && (
                          <span className="text-[10px] text-[#4e5558] truncate mt-0.5">
                            {projectCode}
                          </span>
                        )}
                      </div>
                    </th>

                    {/* 2. FP / Costo Real: Arriba FP, Debajo Real (en una sola línea) */}
                    <td className="px-3.5 py-3 text-left tabular-nums whitespace-nowrap">
                      <div className="flex flex-col text-xs leading-tight">
                        <span className="font-bold text-[#111416] whitespace-nowrap">
                          <strong className="text-[9px] font-bold text-[#4e5558] uppercase mr-1">FP:</strong>
                          {formatCurrency(p.planPresupuesto)}
                        </span>
                        <span className="font-bold text-[#5e8fc2] whitespace-nowrap">
                          <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Real:</strong>
                          {formatCurrency(p.costoReal)}
                        </span>
                      </div>
                    </td>

                    {/* 3. Avance Físico: Planificado arriba y Real abajo */}
                    <td className="px-3.5 py-3 text-left tabular-nums whitespace-nowrap">
                      <div className="flex flex-col text-xs leading-tight">
                        <span className="font-semibold text-[#111416] whitespace-nowrap">
                          <strong className="text-[9px] font-bold text-[#4e5558] uppercase mr-1">Plan:</strong>
                          {p.planificadoAvance}
                        </span>
                        <span className="font-bold text-[#4c9b7a] whitespace-nowrap">
                          <strong className="text-[9px] font-bold text-[#4c9b7a] uppercase mr-1">Real:</strong>
                          {p.realAvance}
                        </span>
                      </div>
                    </td>

                    {/* 4. Facturado / Cobrado: Arriba Facturado, Debajo Cobrado */}
                    <td className="px-3.5 py-3 text-left tabular-nums whitespace-nowrap">
                      <div className="flex flex-col text-xs leading-tight">
                        <span className="font-semibold text-[#111416] whitespace-nowrap">
                          <strong className="text-[9px] font-bold text-[#4e5558] uppercase mr-1">Fact:</strong>
                          {formatCurrency(p.facturadoValuado)}
                        </span>
                        <span className="font-bold text-[#4c9b7a] whitespace-nowrap">
                          <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Cob:</strong>
                          {formatCurrency(p.montoCobrado)}
                        </span>
                      </div>
                    </td>

                    {/* 5. Cuentas por Pagar: Deuda pendiente e indicador de estado */}
                    <td className="px-3.5 py-3 text-left tabular-nums whitespace-nowrap">
                      <div className="flex flex-col text-xs leading-tight">
                        <span className={cn("font-bold whitespace-nowrap", p.cuentasPorPagar > 0 ? "text-[#c85454]" : "text-[#111416]")}>
                          <strong className="text-[9px] font-bold text-[#8d918f] uppercase mr-1">Por Pagar:</strong>
                          {formatCurrency(p.cuentasPorPagar)}
                        </span>
                        <span className={cn("text-[10px] font-medium whitespace-nowrap", p.cuentasPorPagar > 0 ? "text-[#c85454]" : "text-[#4c9b7a]")}>
                          {p.cuentasPorPagar > 0 ? "Saldo pendiente" : "Sin deuda"}
                        </span>
                      </div>
                    </td>

                    {/* 6. Fecha Culminación */}
                    <td className="px-3.5 py-3 text-left whitespace-nowrap">
                      <div className="inline-flex flex-col leading-tight whitespace-nowrap">
                        <span className="text-xs font-medium text-[#111416]">
                          {p.fechaCulminacion.label}
                        </span>
                        <span className="text-[10px] text-[#8d918f]">
                          {p.fechaCulminacion.isReal ? "Real" : "Estimada"}
                        </span>
                      </div>
                    </td>

                    {/* 7. Estado */}
                    <td className="px-3.5 py-3 text-left whitespace-nowrap">
                      <Badge
                        className={cn(
                          "rounded-md text-[9px] shadow-none font-bold px-2 py-0.5 whitespace-nowrap inline-block",
                          statusConfig.badgeClass
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                    </td>

                    {/* 8. Botón de inspección rápida */}
                    <td className="px-2 py-3 pr-4 text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-[#4e5558] hover:bg-[#ece6dc] hover:text-[#111416]"
                        onClick={() => handleRowClick(p)}
                        aria-label={`Ver resumen de ${projectName}`}
                        title="Ver ficha rápida"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}

              {processedProjects.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#4e5558]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="h-7 w-7 text-[#d8d0c4]" />
                      <p className="text-xs font-bold text-[#111416]">
                        No hay proyectos registrados en el workspace
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Modal de Vista Rápida del Proyecto */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && setIsDetailsOpen(false)}>
        <DialogContent className="max-w-lg rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-5 text-[#111416]">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f0e8] text-[#b9561d]">
                    <Building2 className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 text-left">
                    <DialogTitle className="text-base font-bold text-[#111416]">
                      {selectedProject.shortName || selectedProject.code}
                    </DialogTitle>
                    <DialogDescription className="truncate text-xs text-[#4e5558]">
                      {selectedProject.fullName}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Indicadores principales */}
              <div className="mt-3.5 grid grid-cols-2 gap-3 border-b border-[#d8d0c4]/60 pb-3.5">
                <div className="rounded-xl border border-[#d8d0c4]/60 bg-[#f5f0e8]/50 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#4e5558]">
                    FP (Formulación Presupuestaria)
                  </span>
                  <div className="mt-1 text-lg font-bold tabular-nums text-[#111416]">
                    {formatCurrency(selectedProject.planPresupuesto)}
                  </div>
                </div>
                <div className="rounded-xl border border-[#d8d0c4]/60 bg-[#f5f0e8]/50 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#4e5558]">
                    Avance Físico (Último corte)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-[#4e5558]">
                      Plan: <strong className="text-[#111416]">{selectedProject.planificadoAvance}</strong>
                    </span>
                    <span className="font-bold text-[#4c9b7a]">
                      Real: <strong>{selectedProject.realAvance}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen de datos clave */}
              <dl className="mt-3.5 grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Avance Planificado</dt>
                  <dd className="mt-1 font-bold tabular-nums text-xs text-[#111416]">
                    {selectedProject.planificadoAvance}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Avance Real</dt>
                  <dd className="mt-1 font-bold tabular-nums text-xs text-[#4c9b7a]">
                    {selectedProject.realAvance}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Costo Real Gastado</dt>
                  <dd className="mt-1 font-bold tabular-nums text-xs text-[#5e8fc2]">
                    {formatCurrency(selectedProject.costoReal)}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Facturado / Valuado</dt>
                  <dd className="mt-1 font-bold tabular-nums text-xs text-[#111416]">
                    {formatCurrency(selectedProject.facturadoValuado)}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Monto Pagado / Cobrado</dt>
                  <dd className="mt-1 font-bold tabular-nums text-xs text-[#4c9b7a]">
                    {formatCurrency(selectedProject.montoCobrado)}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Cuentas por Pagar</dt>
                  <dd className={cn("mt-1 font-bold tabular-nums text-xs", selectedProject.cuentasPorPagar > 0 ? "text-[#c85454]" : "text-[#111416]")}>
                    {formatCurrency(selectedProject.cuentasPorPagar)}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Fecha de Culminación</dt>
                  <dd className="mt-1 font-bold text-xs text-[#111416]">
                    {selectedProject.fechaCulminacion.label}{" "}
                    <span className="text-[10px] font-normal text-[#8d918f]">
                      ({selectedProject.fechaCulminacion.isReal ? "Real" : "Estimada"})
                    </span>
                  </dd>
                </div>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] p-2.5">
                  <dt className="text-[#8d918f] font-bold text-[10px] uppercase tracking-wider">Estado Operativo</dt>
                  <dd className="mt-1">
                    <Badge
                      className={cn(
                        "rounded-md text-[9px] font-bold px-2 py-0.5 shadow-none",
                        PROJECT_STATUS_CONFIG[selectedProject.status]?.badgeClass
                      )}
                    >
                      {PROJECT_STATUS_CONFIG[selectedProject.status]?.label || selectedProject.status}
                    </Badge>
                  </dd>
                </div>
              </dl>

              {/* Botón de acción hacia la ficha del proyecto */}
              <div className="mt-5 flex justify-end gap-2 border-t border-[#d8d0c4]/60 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-lg border-[#d8d0c4] text-xs font-bold text-[#4e5558]"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    navigate(`/project-management/detalle/${selectedProject.id}`);
                  }}
                  className="rounded-lg bg-[#d9772f] hover:bg-[#b9561d] text-white text-xs font-bold gap-1.5"
                >
                  Ir a la ficha del proyecto
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
