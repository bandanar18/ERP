import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { projectService } from "../api";
import { costService } from "../api";
import type { CostPlanning } from "../interfaces/cost.types";
import { CreateCostModal } from "../components/CreateCostModal";
import { PmAppShell } from "../components/PmAppShell";
import { ErpPageHeader } from "../components/ErpPageHeader";
import { ErpMetricStrip, type ErpMetric } from "../components/ErpMetricStrip";
import { usePermission } from "../hooks/usePermission";

export function CostPlanningView() {
  const { id } = useParams<{ id: string }>();
  const { canCreateCost } = usePermission();
  const [project, setProject] = useState<any>(null);
  const [costs, setCosts] = useState<CostPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [projData, costData] = await Promise.all([
        projectService.getById(id),
        costService.getByProjectId(id)
      ]);
      setProject(projData);
      setCosts(costData);
    } catch (err) {
      console.error("Error loading cost planning:", err);
      setError("No se pudo cargar la información de costos. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4c9b7a] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando datos de costos...</p>
          </div>
        </div>
      </PmAppShell>
    );
  }

  if (error || !project) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 font-medium text-[#c85454]">{error || "Proyecto no encontrado"}</p>
            <button onClick={() => window.history.back()} className="font-bold text-[#4c9b7a] hover:underline">
              Volver
            </button>
          </div>
        </div>
      </PmAppShell>
    );
  }

  const totalCost = costs.reduce((acc, val) => acc + val.amountUsd, 0);
  const estimatedCost = Number(project.estimatedCost || 0);
  const deviation = totalCost - estimatedCost;
  const fmtARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const kpis: ErpMetric[] = [
    {
      title: "Formulación Presupuestaria",
      value: fmtARS(estimatedCost),
      change: "Presupuesto formulado",
      rail: "bg-[#5e8fc2]",
    },
    {
      title: "Costo Total Planificado",
      value: fmtARS(totalCost),
      change: `${costs.length} registros · promedio ${costs.length > 0 ? fmtARS(totalCost / costs.length) : '$0'}`,
      rail: "bg-[#4c9b7a]",
    },
    {
      title: "Desvío",
      value: fmtARS(deviation),
      change: deviation > 0 ? "Sobre presupuesto" : deviation < 0 ? "Bajo presupuesto" : "En línea",
      rail: deviation > 0 ? "bg-[#c85454]" : "bg-[#4c9b7a]",
    },
  ];

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <Link to={`/project-management/detalle/${id}`} className="font-semibold text-[#858178] transition-colors hover:text-[#b9561d]">
            {project.projectCode}
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Planificación de Costos</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Costos / Planificación"
        title="Planificación de Costos"
        copy="Gestiona los costos planificados del proyecto"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex min-h-10 items-center justify-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416] sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
            {canCreateCost && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex min-h-10 items-center justify-center gap-[9px] rounded-lg border border-[#4c9b7a] bg-[#4c9b7a] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#3d7f63] hover:bg-[#3d7f63] sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nuevo Costo
              </button>
            )}
          </div>
        }
      />

      <ErpMetricStrip metrics={kpis} />

      {/* ===== Tabla (desktop) ===== */}
      <div className="mt-5 rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] max-[1024px]:hidden">
        <div className="flex justify-between items-center border-b border-[#d8d0c4] bg-[#f5f0e8]/60 p-4">
          <h3 className="text-[14px] font-bold tracking-[-0.03em] text-[#111416]">Historial de Costos</h3>
          <Badge variant="secondary" className="rounded-md bg-[#edf3ec] text-[#376850]">
            {costs.length} Registros
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#111416] bg-[#f5f0e8]">
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Monto USD</th>
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Periodo</th>
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d0c4]/50">
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-[#4e5558]">
                    No hay costos registrados para este proyecto.
                  </td>
                </tr>
              ) : (
                costs.map((cost) => (
                  <tr key={cost.id} className="hover:bg-[#f3ede3] transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium text-[#4e5558]">
                      {fmtARS(cost.amountUsd)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4e5558]">
                      {new Date(cost.startDate).toLocaleDateString()} - {new Date(cost.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4e5558]">
                      {new Date(cost.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Cards (móvil + tablet) ===== */}
      <div className="mt-5 hidden max-[1024px]:block">
        <div className="flex justify-between items-center rounded-t-xl border border-[#d8d0c4] border-b-0 bg-[#f5f0e8]/60 p-4">
          <h3 className="text-[14px] font-bold tracking-[-0.03em] text-[#111416]">Historial de Costos</h3>
          <Badge variant="secondary" className="rounded-md bg-[#edf3ec] text-[#376850]">
            {costs.length} Registros
          </Badge>
        </div>

        {costs.length === 0 ? (
          <div className="rounded-b-xl border border-[#d8d0c4] bg-[#fffdf9] px-4 py-8 text-center text-sm text-[#4e5558]">
            No hay costos registrados para este proyecto.
          </div>
        ) : (
          <div className="grid gap-3">
            {costs.map((cost) => (
              <div
                key={cost.id}
                className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-colors hover:bg-[#f3ede3]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-[15px] font-bold text-[#111416]">{fmtARS(cost.amountUsd)}</p>
                  <p className="text-[11px] text-[#858178] shrink-0">
                    {new Date(cost.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-[12px] text-[#4e5558]">
                  <span className="font-semibold">Periodo:</span>{" "}
                  {new Date(cost.startDate).toLocaleDateString()} - {new Date(cost.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <span className="font-bold text-[#b9561d]">{costs.length} costos registrados</span>
      </div>

      <CreateCostModal 
        projectId={id!}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
        lastCostEndDate={
          costs.length > 0 
            ? costs.reduce((max, cost) => cost.endDate > max ? cost.endDate : max, "") 
            : undefined
        }
      />
    </PmAppShell>
  );
}
