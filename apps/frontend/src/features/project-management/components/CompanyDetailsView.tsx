import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowRight, LayoutGrid, ChevronLeft, Search, Table as TableIcon, ArrowUpRight, Building2, ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { projectService } from "../api";
import type { Project } from "../interfaces/project.types";
import { PROJECT_STATUS_CONFIG } from "../interfaces/project.types";
import { PmAppShell } from "./PmAppShell";
import { ErpPageHeader } from "./ErpPageHeader";
import { ErpModal } from "./ErpModal";
import { usePermission } from "../hooks/usePermission";
import { companyService } from "../services/company.service";

export function CompanyDetailsView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isGestion } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayMode, setDisplayMode] = useState<"grid" | "table">("grid");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { projects: projectsData, summary } = await projectService.getProjectsByCompany(id);
        setProjects(projectsData);
        
        if (summary?.companyName) {
          setCompanyName(summary.companyName);
        } else if (projectsData.length > 0) {
          setCompanyName(projectsData[0].company?.name || "Empresa");
        } else {
          const companies = await projectService.getCompanies();
          const company = companies.find((c: any) => c.id === id);
          setCompanyName(company?.name || "Empresa");
        }
      } catch (err) {
        console.error("Error loading company projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const filteredProjects = projects.filter(p => {
    const name = p.fullName || "";
    const code = p.code || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando proyectos de la empresa...</p>
          </div>
        </div>
      </PmAppShell>
    );
  }

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">{companyName}</strong>
        </>
      }
    >
      {/* Volver */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/project-management/explorar"
          className="flex items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al explorador
        </Link>
        {isGestion && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(`/project-management/empresa/${id}/editar`)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#d9772f] bg-[#d9772f] px-3 text-xs font-bold text-white transition-colors hover:border-[#b9561d] hover:bg-[#b9561d]"
          >
            <Pencil className="h-4 w-4" />
            Editar información de la empresa
          </button>
          <button
            type="button"
            onClick={() => navigate(`/project-management/empresa/${id}/transferir`)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#111416] px-3 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferir proyectos
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirmDelete(true);
            }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#c85454] bg-[#fffdf9] px-3 text-xs font-bold text-[#a84730] transition-colors hover:bg-[#fff0eb]"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar empresa
          </button>
        </div>
        )}
      </div>

      <ErpPageHeader
        eyebrow="Empresa / Perfil"
        title={companyName}
        copy={`${projects.length} ${projects.length === 1 ? 'proyecto asignado' : 'proyectos asignados'}`}
        action={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            {/* Logo (solo desktop) */}
            {projects.length > 0 && projects[0]?.company?.logoUrl && (
              <div className="hidden h-16 w-16 shrink-0 rounded-lg border border-[#d8d0c4] bg-white p-2 lg:block">
                <img
                  src={projects[0].company.logoUrl}
                  alt={`Logo ${companyName}`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* Buscador */}
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4e5558]" />
              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] pl-10 pr-3 text-sm text-[#111416] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[#8d918f] focus:border-[#d9772f] focus:shadow-[0_0_0_3px_rgba(217,119,47,0.12)]"
              />
            </div>

            {/* Toggle grid/table */}
            <div className="flex w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-1 sm:w-auto">
              <button
                onClick={() => setDisplayMode("grid")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all duration-300 sm:flex-none",
                  displayMode === "grid" ? "bg-[#111416] text-white" : "text-[#4e5558] hover:bg-[#f5f0e8]"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden min-[380px]:inline">Cuadrícula</span>
              </button>
              
              <button
                onClick={() => setDisplayMode("table")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all duration-300 sm:flex-none",
                  displayMode === "table" ? "bg-[#111416] text-white" : "text-[#4e5558] hover:bg-[#f5f0e8]"
                )}
              >
                <TableIcon className="h-4 w-4" />
                <span className="hidden min-[380px]:inline">Tabla</span>
              </button>
            </div>
          </div>
        }
      />

      {filteredProjects.length > 0 ? (
          displayMode === "grid" ? (
              /* ===== VISTA GRID ===== */
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
                  {filteredProjects.map((project) => (
                      <Link 
                          key={project.id} 
                          to={`/project-management/detalle/${project.id}`}
                          className="block h-full w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                          <div className="flex h-full flex-col rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] transition-all group/card relative hover:border-[#b9561d]">
                              {/* Barra de estado */}
                              <span
                                  className={cn(
                                      "absolute left-0 top-0 z-10 h-[3px] w-full",
                                      PROJECT_STATUS_CONFIG[project.status]?.barClass || "bg-[#4c9b7a]"
                                  )}
                              />
                              <div className="p-3 pb-2">
                                  <div className="flex justify-between items-start gap-2">
                                      <Badge variant="outline" className="rounded-md text-[9px] font-bold uppercase tracking-wider border-[#a7c9b4] text-[#376850] bg-[#edf3ec] px-1.5 py-0">
                                          {project.code}
                                      </Badge>
                                      <Badge className={cn(
                                          "rounded-md text-[9px] shadow-none px-1.5 py-0",
                                          PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
                                      )}>
                                          {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
                                      </Badge>
                                  </div>
                                  <CardTitle className="mt-2 text-[13px] font-bold text-[#111416] line-clamp-2 leading-tight min-h-[34px]">
                                      {project.fullName}
                                  </CardTitle>
                              </div>
                              <div className="mt-auto border-t border-[#d8d0c4]/50 p-3 pt-2">
                                  <div className="flex items-center justify-between gap-2">
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#4e5558] truncate">
                                          <Building2 className="h-3 w-3 shrink-0 text-[#5e8fc2]" />
                                          <span className="truncate">{companyName}</span>
                                      </span>
                                      <span className="text-[9px] font-medium text-[#4e5558] whitespace-nowrap">
                                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                                      </span>
                                  </div>
                                  <div className="mt-1.5 flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[#4c9b7a]">
                                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(project.offeredAmount || 0)}
                                      </span>
                                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#b9561d] opacity-0 transition-opacity group-hover/card:opacity-100">
                                          Abrir <ArrowRight className="size-3" />
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          ) : (
              <>
              {/* ===== TABLA (solo desktop) ===== */}
              <div className="hidden lg:block rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] overflow-x-auto animate-in slide-in-from-bottom-4 duration-500">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                          <tr className="bg-[#f5f0e8] border-b border-[#111416]">
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Código</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Proyecto</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Estado</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Fecha Inicio</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Monto</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8d0c4]/50">
                          {filteredProjects.map((project: any) => (
                              <tr 
                                  key={project.id} 
                                  onClick={() => navigate(`/project-management/detalle/${project.id}`)}
                                  className="hover:bg-[#f3ede3] transition-colors cursor-pointer group"
                              >
                                  <td className="px-6 py-4">
                                      <Badge variant="outline" className="text-[10px] font-bold border-[#a7c9b4] text-[#376850] bg-[#edf3ec]">
                                          {project.code}
                                      </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                      <p className="text-sm font-bold text-[#111416] group-hover:text-[#b9561d] transition-colors">{project.fullName}</p>
                                      <p className="text-[10px] text-[#4e5558] line-clamp-1 max-w-xs">{project.description || 'Sin descripción'}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <Badge className={cn(
                                          "text-[10px] shadow-none",
                                          PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
                                      )}>
                                          {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
                                      </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-[#4e5558]">
                                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-bold text-[#4c9b7a]">
                                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(project.offeredAmount || 0)}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* ===== CARDS (móvil + tablet) ===== */}
              <div className="grid gap-3 lg:hidden animate-in slide-in-from-bottom-4 duration-500">
                  {filteredProjects.map((project: any) => (
                      <Link
                          key={project.id}
                          to={`/project-management/detalle/${project.id}`}
                          className="block rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-all hover:border-[#b9561d] hover:bg-[#f3ede3] active:scale-[0.99]"
                      >
                          <div className="flex items-start justify-between gap-3 mb-2">
                              <Badge variant="outline" className="rounded-md text-[10px] font-bold border-[#a7c9b4] text-[#376850] bg-[#edf3ec]">
                                  {project.code}
                              </Badge>
                              <Badge className={cn(
                                  "rounded-md text-[10px] shadow-none",
                                  PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
                              )}>
                                  {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
                              </Badge>
                          </div>

                          <p className="text-[14px] font-extrabold text-[#111416] mb-1">{project.fullName}</p>
                          <p className="text-[11px] text-[#4e5558] line-clamp-2 mb-3">{project.description || 'Sin descripción'}</p>

                          <div className="flex items-center justify-between border-t border-[#d8d0c4]/60 pt-3">
                              <span className="text-[13px] font-bold text-[#4c9b7a]">
                                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(project.offeredAmount || 0)}
                              </span>
                              <span className="text-[11px] text-[#8d918f]">
                                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                              </span>
                          </div>
                      </Link>
                  ))}
              </div>
              </>
          )
      ) : (
          <div className="flex flex-col items-center justify-center rounded-xl py-20 border border-dashed border-[#d8d0c4] bg-[#fffdf9] mt-4">
              <Search className="h-12 w-12 text-[#d8d0c4] mb-4" />
              <h3 className="text-lg font-bold text-[#111416]">No hay proyectos</h3>
              <p className="text-sm text-[#4e5558]">Esta empresa no tiene proyectos que coincidan con tu búsqueda.</p>
          </div>
      )}

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <Link
          to="/project-management/explorar"
          className="inline-flex items-center gap-[5px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] hover:underline hover:underline-offset-[3px]"
        >
          Ir al explorador
          <ArrowUpRight className="h-[13px] w-[13px]" />
        </Link>
      </div>

      <ErpModal
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setConfirmDelete(false);
            setDeleteError(null);
          }
        }}
        eyebrow="Empresa / Confirmación"
        title="Eliminar empresa"
        description="Esta acción no se puede deshacer. La empresa desaparece del sistema."
        maxWidth="max-w-[420px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setConfirmDelete(false);
                setDeleteError(null);
              }}
              className="w-full rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416] sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleting || !id}
              onClick={async () => {
                if (!id) return;
                try {
                  setDeleting(true);
                  setDeleteError(null);
                  await companyService.delete(id);
                  navigate("/project-management/explorar");
                } catch (err: unknown) {
                  const message = err && typeof err === "object" && "error" in err
                    ? String((err as { error?: string }).error)
                    : "No se pudo eliminar la empresa";
                  setDeleteError(message);
                } finally {
                  setDeleting(false);
                }
              }}
              className="w-full rounded-lg border border-[#c85454] bg-[#c85454] text-white hover:border-[#a83e3e] hover:bg-[#a83e3e] sm:w-auto"
            >
              {deleting ? "Eliminando..." : "Eliminar empresa"}
            </Button>
          </>
        }
      >
        <div className="rounded-lg border border-[#d8d0c4] bg-[#f5f0e8]/40 p-3.5">
          <p className="text-sm font-semibold text-[#111416]">{companyName}</p>
          <p className="mt-1 text-xs leading-5 text-[#4e5558]">
            Si tiene proyectos, transfiérelos antes. Si tiene usuarios, asígnalos a otra empresa.
          </p>
          {deleteError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-[#a84730]">
              {deleteError}
            </p>
          )}
        </div>
      </ErpModal>
    </PmAppShell>
  );
}
