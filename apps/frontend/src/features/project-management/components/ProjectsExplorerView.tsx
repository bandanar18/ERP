import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, LayoutGrid, ListTodo, Search, ChevronLeft, ChevronRight, Table as TableIcon, ArrowUpRight } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjectsExplorer } from "../hooks/useProjectsExplorer";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermission } from "../hooks/usePermission";
import { PmAppShell } from "./PmAppShell";
import { ErpPageHeader } from "./ErpPageHeader";
import { ProjectCard } from "./ProjectCard";
import { ErpCreateFab } from "./ErpCreateFab";
import { PROJECT_STATUS_CONFIG } from "../interfaces/project.types";

const ITEMS_PER_PAGE = 8;

export function ProjectsExplorerView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewMode, setViewMode, projects, companies, loading } = useProjectsExplorer();
  const { canCreate } = usePermission();
  
  const searchQuery = searchParams.get("q") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const displayMode = (searchParams.get("view") as "grid" | "table") || "grid";

  const setSearchQuery = (q: string) => {
    setSearchParams(prev => {
      if (q) prev.set("q", q);
      else prev.delete("q");
      prev.set("page", "1");
      return prev;
    }, { replace: true });
  };

  const setCurrentPage = (page: number) => {
    setSearchParams(prev => {
      prev.set("page", page.toString());
      return prev;
    }, { replace: true });
  };

  const setDisplayMode = (mode: "grid" | "table") => {
    setSearchParams(prev => {
      prev.set("view", mode);
      return prev;
    }, { replace: true });
  };

  // 1. Filtrado dinámico real-time
  const filteredData = useMemo(() => {
    if (viewMode === "companies") {
      return companies.filter((c: any) => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return projects.filter((p: any) => {
      const name = p.fullName || "";
      const code = p.code || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             code.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [viewMode, companies, projects, searchQuery]);

  // 2. Lógica de Paginación
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Sincronizando explorador...</p>
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
          <strong className="text-[#111416]">{viewMode === "companies" ? "Explorador de Empresas" : "Listado de Proyectos"}</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Explorador / Directorio"
        title={viewMode === "companies" ? "Empresas Registradas" : "Todos los Proyectos"}
        copy={`${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} de ${filteredData.length} resultados`}
        action={
          <div className="flex w-full flex-col gap-3 max-[640px]:w-full sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            {/* Buscador */}
            <div className="relative w-full min-w-0 sm:w-72 md:w-80">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4e5558] sm:left-3" />
              <Input
                type="text"
                placeholder={viewMode === "companies" ? "Buscar empresa..." : "Buscar proyecto..."}
                className="h-10 w-full min-w-0 rounded-lg border-[#d8d0c4] bg-[#fffdf9] pl-8 pr-3 text-[13px] sm:pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Toggle tabs */}
            <div className="flex w-full items-stretch sm:w-auto">
              <div className="flex flex-1 items-stretch rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-1 sm:flex-none">
                <button
                  onClick={() => {
                      setViewMode("companies");
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-all duration-300 whitespace-nowrap sm:flex-none sm:px-4",
                    viewMode === "companies" ? "bg-[#111416] text-white" : "text-[#4e5558] hover:bg-[#f5f0e8]"
                  )}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="hidden min-[380px]:inline">Empresas</span>
                </button>

                <button
                  onClick={() => setViewMode("projects")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-all duration-300 whitespace-nowrap sm:flex-none sm:px-4",
                    viewMode === "projects" ? "bg-[#111416] text-white" : "text-[#4e5558] hover:bg-[#f5f0e8]"
                  )}
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                  <span className="hidden min-[380px]:inline">Proyectos</span>
                </button>
              </div>

              {/* Botón de Tabla — hermano del grupo de tabs, no hijo */}
              <div
                className={cn(
                  "ml-1 flex overflow-hidden transition-all duration-300",
                  viewMode === "projects"
                    ? "w-9 opacity-100"
                    : "w-0 opacity-0"
                )}
              >
                <button
                  onClick={() => setDisplayMode(displayMode === "table" ? "grid" : "table")}
                  className={cn(
                    "flex h-full min-h-[38px] w-9 items-center justify-center rounded-lg border border-[#d8d0c4] bg-[#fffdf9] transition-all duration-300",
                    displayMode === "table" ? "bg-[#111416] border-[#111416] text-white" : "text-[#4e5558] hover:bg-[#f5f0e8]"
                  )}
                  title="Ver como tabla"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        }
      />

      <div className="min-h-[550px]">
          {displayMode === "grid" ? (
              /* ===== VISTA GRID ===== */
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-500">
                  {paginatedData.map((item: any) =>
                    viewMode === "companies" ? (
                      <Link
                        key={item.id}
                        to={`/project-management/empresa/${item.id}`}
                        className="block h-full w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] transition-all group/card hover:border-[#b9561d]">
                          <div className="absolute inset-0 bg-gradient-to-br from-white to-[#f5f0e8] opacity-0 group-hover/card:opacity-100 transition-opacity" />
                          <div className="relative flex flex-1 items-center justify-center overflow-hidden border-b border-[#d8d0c4] bg-[#f5f0e8]/40 p-4 min-h-[96px]">
                            {item.logoUrl ? (
                              <img src={item.logoUrl} alt={item.name} className="max-h-[64px] max-w-[120px] object-contain transition-transform duration-500 group-hover/card:scale-105 drop-shadow-sm" />
                            ) : (
                              <div className="grid size-14 place-items-center rounded-xl bg-[#5e8fc2]/10 transition-transform duration-500 group-hover/card:scale-105">
                                <Building2 className="h-7 w-7 text-[#5e8fc2]" />
                              </div>
                            )}
                          </div>
                          <div className="relative z-10 bg-[#fffdf9] p-3">
                            <CardTitle className="mb-1.5 line-clamp-1 text-[13px] font-extrabold text-[#111416]">
                              {item.name}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4e5558]">
                              <ListTodo className="h-3.5 w-3.5 text-[#5e8fc2]" />
                              <span>{projects.filter((p: any) => p.companyId === item.id).length} Proyectos</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <ProjectCard key={item.id} project={item} />
                    )
                  )}
              </div>
          ) : (
              <>
              {/* ===== TABLA (solo desktop) ===== */}
              <div className="hidden lg:block overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] overflow-x-auto animate-in slide-in-from-bottom-4 duration-500">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                          <tr className="bg-[#f5f0e8] border-b border-[#111416]">
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Código</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Proyecto</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Compañía</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Estado</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Fecha Inicio</th>
                              <th className="px-6 py-4 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Monto</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8d0c4]/50">
                          {paginatedData.map((project: any) => (
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
                                      <div className="flex items-center gap-2">
                                          <Building2 className="h-3 w-3 text-[#8d918f]" />
                                          <span className="text-xs font-medium text-[#4e5558]">{project.company?.name}</span>
                                      </div>
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
                  {paginatedData.map((project: any) => (
                      <Link
                          key={project.id}
                          to={`/project-management/detalle/${project.id}`}
                          className="block border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-all hover:border-[#b9561d] hover:bg-[#f3ede3] active:scale-[0.99]"
                      >
                          <div className="flex items-start justify-between gap-3 mb-2">
                              <Badge variant="outline" className="text-[10px] font-bold border-[#a7c9b4] text-[#376850] bg-[#edf3ec]">
                                  {project.code}
                              </Badge>
                              <Badge className={cn(
                                  "text-[10px] shadow-none",
                                  PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
                              )}>
                                  {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
                              </Badge>
                          </div>

                          <p className="text-[14px] font-extrabold text-[#111416] mb-1">{project.fullName}</p>
                          <p className="text-[11px] text-[#4e5558] line-clamp-2 mb-3">{project.description || 'Sin descripción'}</p>

                          <div className="flex items-center justify-between gap-3 border-t border-[#d8d0c4]/60 pt-3">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4e5558]">
                                  <Building2 className="h-3 w-3 text-[#8d918f]" />
                                  <span className="truncate">{project.company?.name}</span>
                              </div>
                              <span className="text-[11px] text-[#8d918f] shrink-0">
                                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                              </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                              <span className="text-[13px] font-bold text-[#4c9b7a]">
                                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(project.offeredAmount || 0)}
                              </span>
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#b9561d]">
                                  Abrir <ArrowUpRight className="size-3" />
                              </span>
                          </div>
                      </Link>
                  ))}
              </div>
              </>
          )}

          {/* Estado vacío */}
          {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#d8d0c4] bg-[#fffdf9] mt-4">
              <Search className="h-12 w-12 text-[#d8d0c4] mb-4" />
              <h3 className="text-lg font-bold text-[#111416]">No encontramos resultados</h3>
              <p className="text-sm text-[#4e5558]">Intentá con otros términos de búsqueda</p>
          </div>
          )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 border-t border-[#d8d0c4]/60 pt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#111416] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#b9561d] disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "h-8 w-8 rounded-md text-xs font-bold transition-all",
                    currentPage === i + 1 
                      ? "border-b-2 border-[#b9561d] text-[#b9561d]" 
                      : "text-[#8d918f] hover:text-[#111416]"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#111416] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#b9561d] disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      )}

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <span className="inline-flex items-center gap-[5px] font-bold text-[#b9561d]">
          {viewMode === "companies" ? `${companies.length} empresas` : `${projects.length} proyectos`} registrados
          <ArrowUpRight className="h-[13px] w-[13px]" />
        </span>
      </div>

      {/* FAB Flotante */}
      {canCreate && (
        <ErpCreateFab
          fixed
          position="bottom-right"
          title="Crear en el sistema"
          actions={[
            {
              label: "Crear Proyecto",
              icon: <FolderPlus className="h-4 w-4" />,
              onClick: () => navigate("/project-management/create"),
            },
            {
              label: "Crear Empresa",
              icon: <Building2 className="h-4 w-4" />,
              onClick: () => navigate("/project-management/company/create"),
            },
          ]}
        />
      )}
    </PmAppShell>
  );
}
