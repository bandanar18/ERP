import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  FolderOpen,
  ArrowUpRight,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { projectService, financialService, costService, physicalProgressService } from "../api";
import type { FinancialValuation } from "../interfaces/financial.types";
import type { CostPlanning } from "../interfaces/cost.types";
import { ProjectCostChart } from "./ProjectCostChart";
import { ProjectReportModal } from "./ProjectReportModal";
import { usePermission } from "../hooks/usePermission";
import { PmAppShell } from "./PmAppShell";
import { ErpMetricStrip, type ErpMetric } from "./ErpMetricStrip";
import {
  PROJECT_STATUS_CONFIG,
  PROJECT_STATUS_OPTIONS,
} from "../interfaces/project.types";

export function ProjectDetailsView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canCreate, isDireccion, canViewPayables, isFinancialAdmin, canViewGallery, canPrintReport } = usePermission();
  const [project, setProject] = useState<any>(null);
  const [valuations, setValuations] = useState<FinancialValuation[]>([]);
  const [costs, setCosts] = useState<CostPlanning[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !project || newStatus === project.status) return;
    try {
      const updated = await projectService.update(id, { status: newStatus as any });
      setProject((prev: any) => ({ ...prev, status: updated.status || newStatus }));
    } catch (err) {
      console.error("Error al actualizar estado del proyecto:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [data, valData, costData, progData] = await Promise.all([
          projectService.getById(id),
          financialService.getByProjectId(id),
          costService.getByProjectId(id),
          physicalProgressService.getByProject(id).catch(() => ({ progress: [] })),
        ]);
        const resolvedProgress =
          (progData?.progress && progData.progress.length > 0 ? progData.progress : null) ||
          (data?.allProgress && data.allProgress.length > 0 ? data.allProgress : null) ||
          (data?.pm_physical_progress && data.pm_physical_progress.length > 0 ? data.pm_physical_progress : null) ||
          (data?.progress && data.progress.length > 0 ? data.progress : null) ||
          [];

        const latestFromList = resolvedProgress.length > 0 ? resolvedProgress[0] : null;
        const mergedLastProgress = data?.lastProgress || latestFromList || null;

        const enrichedProject = {
          ...data,
          lastProgress: mergedLastProgress,
          actualPhysicalProgress:
            data?.actualPhysicalProgress ||
            mergedLastProgress?.actualProgress ||
            null,
          plannedPhysicalProgress:
            data?.plannedPhysicalProgress ||
            mergedLastProgress?.plannedProgress ||
            null,
        };

        setProject(enrichedProject);
        setValuations(valData);
        setCosts(costData);
        setProgressList(resolvedProgress);
      } catch (err) {
        console.error("Error loading project details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleShowProgress = () => {
    navigate(`/project-management/detalle/${id}/avances`);
  };

  const handleShowFinancial = () => {
    navigate(`/project-management/detalle/${id}/financiero`);
  };

  const handleShowCostos = () => {
    navigate(`/project-management/detalle/${id}/costos`);
  };

  const handleShowPayables = () => {
    navigate(`/project-management/detalle/${id}/cuentas-por-pagar`);
  };

  const handleShowExpenses = () => {
    navigate(`/project-management/detalle/${id}/costo-real`);
  };

  const handleShowCollections = () => {
    navigate(`/project-management/detalle/${id}/cobros`);
  };

  const handleAssignPlanner = () => {
    navigate(`/project-management/detalle/${id}/asignar-planificador`);
  };

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Sincronizando detalles...</p>
          </div>
        </div>
      </PmAppShell>
    );
  }

  if (!project) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <AlertCircle className="mb-4 h-12 w-12 text-[#c85454]" />
          <h2 className="text-xl font-bold text-[#111416]">Proyecto no encontrado</h2>
          <Link to="/project-management/explorar" className="mt-4 text-[13px] font-bold text-[#b9561d] hover:underline">
            Volver al explorador
          </Link>
        </div>
      </PmAppShell>
    );
  }

  const porValuarTotal = valuations
    .filter((v) => v.status === "POR_VALUAR")
    .reduce((acc, val) => acc + (Number(val.amountUsd) || 0), 0);
  const porFacturarTotal = valuations
    .filter((v) => v.status === "POR_FACTURAR")
    .reduce((acc, val) => acc + (Number(val.amountUsd) || 0), 0);
  const facturadoTotal = valuations
    .filter((v) => v.status === "FACTURADO")
    .reduce((acc, val) => acc + (Number(val.amountUsd) || 0), 0);
  const totalValuado = valuations.reduce(
    (acc, val) => acc + (Number(val.amountUsd) || 0),
    0
  );
  const saldoPorValuar = Math.max(0, Number(project.offeredAmount || 0) - totalValuado);

  const totalCostos = costs.reduce((acc, c) => acc + Number(c.amountUsd), 0);
  const estimatedCost = Number(project.estimatedCost || 0);
  const costDeviation = totalCostos - estimatedCost;

  const formatARS = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);

  const plannerName = (() => {
    const mgrName = (project.manager?.managerName || "").trim();
    if (mgrName && !/^(null|undefined)\s*(null|undefined)?$/i.test(mgrName)) {
      return mgrName;
    }
    if (project.pm_users) {
      const pmName = `${project.pm_users.firstName || ""} ${project.pm_users.lastName || ""}`.trim();
      if (pmName) return pmName;
    }
    if (project.manager?.managerEmail) return project.manager.managerEmail;
    return "No asignado";
  })();

  const plannerPhone = (() => {
    if (plannerName === "No asignado") return "";
    return (
      project.manager?.phone ||
      project.manager?.managerPhone ||
      project.pm_users?.phone ||
      (project as any).plannerPhone ||
      (project as any).managerPhone ||
      ""
    );
  })();

  const plannerPhoneDisplay = (() => {
    if (plannerName === "No asignado") {
      return "Sin asignar";
    }
    if (plannerPhone) {
      return `Tel: ${plannerPhone}`;
    }
    return project.manager?.managerEmail || project.pm_users?.email || "Sin teléfono";
  })();

  const actualPhysicalProgress = (() => {
    const actual =
      project.lastProgress?.actualProgress ||
      project.actualPhysicalProgress ||
      project.actualProgress;
    if (actual === null || actual === undefined || String(actual).trim() === "") {
      return "0%";
    }
    const str = String(actual).trim();
    return str.endsWith("%") ? str : `${str}%`;
  })();

  const plannedPhysicalProgress = (() => {
    const planned =
      project.lastProgress?.plannedProgress ||
      project.plannedPhysicalProgress ||
      project.plannedProgress;
    if (planned === null || planned === undefined || String(planned).trim() === "") {
      return "Sin registros";
    }
    const str = String(planned).trim();
    const formatted = str.endsWith("%") ? str : `${str}%`;
    return `Programado: ${formatted}`;
  })();

  const projectStats: ErpMetric[] = isDireccion
    ? [
        {
          title: "Monto Ofertado",
          value: formatARS(project.offeredAmount || 0),
          change: "Monto contractual convenido",
          rail: "bg-[#d9772f]",
        },
        {
          title: "Monto Valuado",
          value: formatARS(totalValuado),
          change: `Facturado: ${formatARS(facturadoTotal)}`,
          rail: "bg-[#5e8fc2]",
        },
        {
          title: "Avance Físico Actual",
          value: actualPhysicalProgress,
          change: plannedPhysicalProgress,
          rail: "bg-[#4c9b7a]",
        },
        {
          title: "Monto por Valuar",
          value: formatARS(saldoPorValuar),
          change: "Saldo contractual pendiente",
          rail: "bg-[#df6e84]",
        },
        {
          title: "Fecha Fin",
          value: project.endDate
            ? new Date(project.endDate).toLocaleDateString()
            : "N/A",
          change: `Inicio: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}`,
          rail: "bg-[#b9cd48]",
        },
        {
          title: "Planificador",
          value: plannerName,
          valueClass: "text-[21px]",
          change: plannerPhoneDisplay,
          rail: "bg-[#b9561d]",
        },
      ]
    : [
        {
          title: "Monto Ofertado",
          value: formatARS(project.offeredAmount || 0),
          change: `P/Valuar ${formatARS(porValuarTotal)} · P/Facturar ${formatARS(porFacturarTotal)} · Facturado ${formatARS(facturadoTotal)}`,
          rail: "bg-[#d9772f]",
        },
        ...(!isDireccion
          ? [
              {
                title: "Formulación Presupuestaria",
                value: formatARS(estimatedCost),
                change: "Presupuesto formulado",
                rail: costDeviation > 0 ? "bg-[#c85454]" : "bg-[#4e5558]",
              },
            ]
          : []),
        ...(!isFinancialAdmin
          ? [
              {
                title: "Avance Físico Actual",
                value: actualPhysicalProgress,
                change: plannedPhysicalProgress,
                rail: "bg-[#4c9b7a]",
              },
              {
                title: "Planificador",
                value: plannerName,
                valueClass: "text-[21px]",
                change: plannerPhoneDisplay,
                rail: "bg-[#df6e84]",
              },
            ]
          : [
              {
                title: "Costo Real",
                value: formatARS(Number(project.actualCost ?? 0)),
                change: `Presupuesto: ${formatARS(estimatedCost)}`,
                rail: "bg-[#5e8fc2]",
              },
              {
                title: "Cuentas por Pagar",
                value: formatARS(project.cuentasPorPagar || 0),
                change: "Obligaciones pendientes",
                rail: "bg-[#c85454]",
              },
            ]),
        {
          title: "Fecha Estimada Fin",
          value: project.endDate
            ? new Date(project.endDate).toLocaleDateString()
            : "N/A",
          change: `Inicio: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}`,
          rail: "bg-[#5e8fc2]",
        },
      ];

  const clickActions = [
    ...(!isFinancialAdmin ? [{ onClick: handleShowFinancial, label: "Ver financiero" }] : []),
    ...(!isDireccion && !isFinancialAdmin
      ? [{ onClick: handleShowCostos, label: "Ver costos" }]
      : []),
    ...(canViewPayables
      ? [
          { onClick: handleShowPayables, label: "Cuentas por Pagar" },
          { onClick: handleShowExpenses, label: "Costo Real" },
          { onClick: handleShowCollections, label: "Cobros" },
        ]
      : []),
    ...(!isFinancialAdmin
      ? [{ onClick: handleShowProgress, label: "Ver avances" }]
      : []),
    ...(canCreate && !isFinancialAdmin
      ? [{ onClick: handleAssignPlanner, label: "Asignar planificador" }]
      : []),
    { onClick: () => window.history.back(), label: "Volver" },
  ];

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">{project.projectCode}</strong>
        </>
      }
    >
      {/* ===== Cabecera ===== */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 min-w-0">
          {/* Código + título */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-md border border-[#edb6a5] bg-[#fff0eb] px-2 py-0.5 text-[11px] font-bold text-[#a84730]">
              {project.projectCode}
            </Badge>
            <h1
              id="page-title"
              className="font-display text-[clamp(24px,3vw,38px)] font-normal leading-[0.9] tracking-[0.01em]"
            >
              {project.projectName || project.projectCode || "Sin nombre"}
            </h1>
          </div>

          {/* Info strip: empresa / ubicación / contacto */}
          <div className="mt-3 grid grid-cols-1 min-[480px]:grid-cols-[auto_1fr_auto_1fr_auto_1fr] items-center gap-3 rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] p-3 shadow-xs">
            {/* Empresa */}
            <div className="flex items-center gap-3 min-[480px]:col-span-1">
              {project.company?.logoUrl && !logoFailed ? (
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d8d0c4] bg-white p-1 shadow-2xs">
                  <img
                    src={project.company.logoUrl}
                    alt={`Logo ${project.company.name || "empresa"}`}
                    className="max-h-full max-w-full object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                </div>
              ) : (
                <div className="shrink-0 rounded-lg bg-[#d9772f]/10 p-2">
                  <Building2 className="h-5 w-5 text-[#d9772f]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#4e5558]">
                  Empresa
                </p>
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-[#111416]">
                    {project.company?.legalName || project.company?.name}
                  </p>
                  {canCreate && (
                    <Link
                      to={`/project-management/empresa/${project.companyId}`}
                      className="shrink-0 text-[11px] font-semibold text-[#b9561d] hover:underline"
                    >
                      (Ver perfil)
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="hidden min-[480px]:block min-[480px]:col-span-1 mx-2">
              <div className="h-8 w-px bg-[#d8d0c4]" />
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-3 min-[480px]:col-span-1">
              <div className="shrink-0 rounded-lg bg-[#5e8fc2]/10 p-2">
                <MapPin className="h-5 w-5 text-[#5e8fc2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#4e5558]">
                  Ubicación
                </p>
                <p
                  className="truncate text-sm font-bold text-[#111416]"
                  title={project.company?.address}
                >
                  {project.company?.address || "No especificada"}
                </p>
              </div>
            </div>

            {/* Divisor */}
            <div className="hidden min-[480px]:block min-[480px]:col-span-1 mx-2">
              <div className="h-8 w-px bg-[#d8d0c4]" />
            </div>

            {/* Contacto */}
            <div className="flex items-center gap-3 min-[480px]:col-span-1">
              <div className="shrink-0 rounded-lg bg-[#4c9b7a]/10 p-2">
                <Phone className="h-5 w-5 text-[#4c9b7a]" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#4e5558]">
                  Contacto
                </p>
                <p className="truncate text-sm font-bold text-[#111416]">
                  {project.company?.phone || "Sin teléfono"}{" "}
                  <span className="font-medium text-[#4e5558]">
                    ({project.company?.email || "Sin email"})
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones de cabecera y Estado */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-end">
          {canPrintReport && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#d8d0c4] bg-[#fffdf9] px-3 py-1.5 text-xs font-bold text-[#b9561d] shadow-2xs transition-colors hover:border-[#b9561d] hover:bg-[#fff0eb] hover:text-[#a84730]"
              title="Generar e imprimir reporte de avance físico"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Reporte</span>
            </button>
          )}

          {canCreate ? (
            <div>
              <label htmlFor="detail-project-status" className="sr-only">
                Estado del proyecto
              </label>
              <select
                id="detail-project-status"
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold shadow-none transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-[#d9772f]",
                  PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
                )}
                title="Cambiar estado del proyecto"
              >
                {PROJECT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-[#111416]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Badge
              className={cn(
                "rounded-md px-4 py-1.5 text-xs font-bold shadow-none",
                PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
              )}
            >
              {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
            </Badge>
          )}
        </div>
      </div>

      <ErpMetricStrip metrics={projectStats} />

      {/* ===== Accesos rápidos ===== */}
      <div className="mb-3 flex flex-wrap gap-2">
        {clickActions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-[10px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
          >
            {action.label}
            <ArrowUpRight className="h-[13px] w-[13px]" />
          </button>
        ))}
      </div>

      {/* ===== Grid principal: gráfico + sidebar ===== */}
      {/* ===== Grid principal: gráfico + sidebar ===== */}
      <div className={`grid grid-cols-1 ${canViewGallery ? "lg:grid-cols-3" : ""} gap-5`}>
        {/* GRÁFICO */}
        <div className={`${canViewGallery ? "lg:col-span-2" : "w-full"} space-y-8`}>
          <ProjectCostChart
            projectId={id}
            progress={progressList}
            lastProgress={project.lastProgress}
            plannedProgress={
              project.lastProgress?.plannedProgress ??
              project.plannedPhysicalProgress ??
              project.plannedProgress
            }
            actualProgress={
              project.lastProgress?.actualProgress ??
              project.actualPhysicalProgress ??
              project.actualProgress
            }
            projectStartDate={project.startDate}
            projectEndDate={project.endDate}
            costs={costs}
            estimatedCost={Number(project.estimatedCost || 0)}
          />
        </div>

        {/* SIDEBAR */}
        {canViewGallery && (
          <div className="space-y-5">
            {/* Card de Galería */}
            <div className="relative overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-5 sm:p-6 group shadow-xs">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <FolderOpen className="h-24 w-24 text-[#5e8fc2]" />
              </div>

              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#111416] sm:mb-4">
                <FolderOpen className="h-5 w-5 text-[#5e8fc2]" />
                Documentos y Archivos
              </h3>

              <p className="mb-5 text-sm text-[#4e5558] sm:mb-6">
                Gestioná todos los archivos adjuntos, planos, contratos y fotos de
                este proyecto en su galería dedicada.
              </p>

              <Link
                to={`/project-management/detalle/${id}/galeria`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5e8fc2]/10 py-3 text-xs font-bold text-[#5e8fc2] transition-colors hover:bg-[#5e8fc2]/20"
              >
                Abrir Galería Completa
                <ChevronLeft className="h-3 w-3 rotate-180" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <div className="flex min-w-[190px] items-center gap-[9px]">
          <span>Ejecución del proyecto</span>
          <span className="h-1 flex-1 rounded-full bg-[#d8d0c4]">
            <span
              className="block h-full w-[65%] rounded-full bg-[#111416]"
            />
          </span>
          <strong className="text-[#111416]">
            {project.lastProgress?.actualProgress || "0%"}
          </strong>
        </div>
      </div>

      {/* Modal de Reporte e Impresión */}
      <ProjectReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        project={project}
        progressList={progressList}
      />
    </PmAppShell>
  );
}
