import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  AlertCircle,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { physicalProgressService, projectService } from "../api";
import { cn, formatLocalDate } from "@/lib/utils";
import { usePermission } from "../hooks/usePermission";
import { usePmAuthStore } from "../store/auth.store";
import { PmAppShell } from "./PmAppShell";
import { ErpPageHeader } from "./ErpPageHeader";
import { ErpCreateFab } from "./ErpCreateFab";
import { EditPhysicalProgressModal } from "./EditPhysicalProgressModal";

export function ProjectPhysicalProgressView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canCreateProgress, isPlanner, isGestion } = usePermission();
  const userId = usePmAuthStore((s) => s.user?.id);
  const [project, setProject] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [progressToEdit, setProgressToEdit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projData, progData] = await Promise.all([
        projectService.getById(id),
        physicalProgressService.getByProject(id)
      ]);
      setProject(projData);
      setProgress(progData.progress || []);
    } catch (err) {
      console.error("Error loading progress data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const totalPages = Math.ceil(progress.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = progress.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando historial...</p>
          </div>
        </div>
      </PmAppShell>
    );
  }

  if (!project) return null;

  // El planificador solo registra/edita avances de SUS proyectos (la API
  // rechaza con 403 los ajenos): gestión/admin ven todo; el planificador
  // ve el botón y las acciones solo si este proyecto le fue asignado.
  const isAssignedPlanner = !!project.managerId && project.managerId === userId;
  const canActOnProgress = canCreateProgress && (!isPlanner || isGestion || isAssignedPlanner);

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
          <strong className="text-[#111416]">Historial de Avances</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Avance físico / Historial"
        title="Historial de Avances"
        copy={`${project.projectName} • ${project.projectCode}`}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex min-h-10 items-center justify-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416] sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
          </div>
        }
      />

      {/* ===== Tabla (desktop) ===== */}
      <div className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] max-[1024px]:hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#111416] bg-[#f5f0e8]">
                <th className="px-5 py-3 text-left text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Fecha de Emisión</th>
                <th className="px-5 py-3 text-left text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Fecha Inicio</th>
                <th className="px-5 py-3 text-left text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Fecha Fin</th>
                <th className="px-5 py-3 text-center text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Avance Real</th>
                <th className="px-5 py-3 text-center text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Programado</th>
                <th className="px-5 py-3 text-left text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Puntos de Atención</th>
                {canActOnProgress && <th className="px-5 py-3 text-center text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d0c4]/50">
              {currentItems.length > 0 ? (
                currentItems.map((p) => (
                  <tr key={p.id} className="group hover:bg-[#f3ede3] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-bold text-[#111416]">{formatLocalDate(p.date)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-[#4e5558]">{formatLocalDate(p.startDate)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-[#4e5558]">{formatLocalDate(p.endDate)}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge className="bg-[#4c9b7a] hover:bg-[#4c9b7a] shadow-none border-none text-[11px] font-bold px-3 py-1 rounded-full text-white">
                        {p.actualProgress}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant="outline" className="border-[#d8d0c4] text-[#4e5558] text-[11px] font-bold px-3 py-1 rounded-full">
                        {p.plannedProgress}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-[#4e5558] leading-relaxed italic max-w-md">
                        {p.attentionPoints ? `"${p.attentionPoints}"` : "Sin observaciones"}
                      </p>
                    </td>
                    {canActOnProgress && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setProgressToEdit(p)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#4e5558] hover:text-[#b9561d] transition-colors"
                          title="Editar avance"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canActOnProgress ? 7 : 6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-12 w-12 text-[#d8d0c4] mb-4" />
                      <p className="font-bold text-[#4e5558]">No hay registros de avance disponibles</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Cards (móvil + tablet) ===== */}
      <div className="hidden max-[1024px]:block">
        <div className="flex justify-between items-center rounded-t-xl border border-[#d8d0c4] border-b-0 bg-[#f5f0e8]/60 p-4">
          <h3 className="text-[14px] font-bold tracking-[-0.03em] text-[#111416]">Historial de Avances</h3>
          <Badge variant="secondary" className="rounded-md bg-[#edf3ec] text-[#376850]">
            {progress.length} Registros
          </Badge>
        </div>

        {currentItems.length === 0 ? (
          <div className="rounded-b-xl border border-[#d8d0c4] bg-[#fffdf9] px-4 py-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-[#d8d0c4] mb-3" />
            <p className="text-sm font-bold text-[#4e5558]">No hay registros de avance disponibles</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {currentItems.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-colors hover:bg-[#f3ede3]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#111416]">{formatLocalDate(p.date)}</p>
                    <p className="mt-0.5 text-[11px] text-[#4e5558]">
                      {formatLocalDate(p.startDate)} — {formatLocalDate(p.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-[#4c9b7a] hover:bg-[#4c9b7a] shadow-none border-none text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white">
                      {p.actualProgress}
                    </Badge>
                    <Badge variant="outline" className="border-[#d8d0c4] text-[#4e5558] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {p.plannedProgress}
                    </Badge>
                  </div>
                </div>

                {p.attentionPoints && (
                  <p className="mb-3 text-[12px] italic text-[#4e5558] leading-relaxed">
                    "{p.attentionPoints}"
                  </p>
                )}

                {canActOnProgress && (
                  <div className="border-t border-[#d8d0c4]/60 pt-3">
                    <button
                      onClick={() => setProgressToEdit(p)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#4e5558] hover:text-[#b9561d] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-b-xl border border-[#d8d0c4] border-t-0 bg-[#f5f0e8]/60 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4e5558]">
            Página <span className="text-[#111416]">{currentPage}</span> de <span className="text-[#111416]">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-2 text-[#4e5558] transition-colors hover:border-[#d9772f] hover:text-[#b9561d] disabled:opacity-30 disabled:hover:border-[#d8d0c4] disabled:hover:text-[#4e5558]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={cn(
                    "h-8 w-8 rounded-md text-xs font-bold transition-all sm:h-9 sm:w-9",
                    currentPage === i + 1 
                      ? "bg-[#d9772f] text-white shadow-md" 
                      : "text-[#4e5558] border border-transparent hover:border-[#d8d0c4] hover:bg-[#fffdf9] hover:text-[#111416]"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-2 text-[#4e5558] transition-colors hover:border-[#d9772f] hover:text-[#b9561d] disabled:opacity-30 disabled:hover:border-[#d8d0c4] disabled:hover:text-[#4e5558]"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <span className="inline-flex items-center gap-[5px] font-bold text-[#b9561d]">
          {progress.length} registros de avance
          <TrendingUp className="h-[13px] w-[13px]" />
        </span>
      </div>

      <EditPhysicalProgressModal
        progress={progressToEdit}
        isOpen={!!progressToEdit}
        onClose={() => setProgressToEdit(null)}
        onSuccess={fetchData}
      />

      {canActOnProgress && (
        <ErpCreateFab
          fixed
          position="bottom-right"
          title="Avance físico"
          actions={[
            {
              label: "Registrar Avance",
              icon: <TrendingUp className="h-4 w-4" />,
              onClick: () => navigate(`/project-management/detalle/${id}/crear-avance`),
            },
          ]}
        />
      )}
    </PmAppShell>
  );
}
