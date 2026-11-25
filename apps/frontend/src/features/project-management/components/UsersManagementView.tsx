import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../api";
import type { User } from "../api";
import { companyService } from "../api";
import type { Company } from "../api";
import { projectService } from "../api";
import type { Project } from "../interfaces/project.types";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Power,
  PowerOff,
  UserRoundCog,
  FolderKanban,
  Check,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErpModal } from "./ErpModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PmAppShell } from "./PmAppShell";
import { ErpPageHeader } from "./ErpPageHeader";
import { cn } from "@/lib/utils";
import { usePermission } from "../hooks/usePermission";

function CompanyFact({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-[#4e5558]">{label}</dt>
      <dd className="mt-0.5 text-[12px] font-medium text-[#111416]">{value?.trim() ? value : "Sin registrar"}</dd>
    </div>
  );
}

export function UsersManagementView() {
  const navigate = useNavigate();
  const { isGestion } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, limit: 12 });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<string>("none");
  const [editCompany, setEditCompany] = useState<string>("none");
  const [editProjects, setEditProjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [companiesData, rolesData, projectsData] = await Promise.all([
          companyService.getAll(),
          userService.getModuleRoles(),
          projectService.getAll().catch(() => []),
        ]);
        setCompanies(companiesData);
        setRoles(rolesData);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err: any) {
        setError(err.message || "Error al cargar datos auxiliares");
      }
    };
    fetchAuxData();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getModuleUsers(companies.map(c => ({ id: c.id, name: c.name })));
      // Filtrado local por búsqueda
      let filtered = allUsers;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = allUsers.filter(
          (u) =>
            u.firstName.toLowerCase().includes(q) ||
            u.lastName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
      }
      // Paginación local
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIdx = (page - 1) * limit;
      const paged = filtered.slice(startIdx, startIdx + limit);
      setUsers(paged);
      setMeta({ total, page, totalPages, limit });
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, companies]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role?.id || "none");
    setEditCompany(user.company?.id || "none");
    setEditProjects(user.projectIds || []);
    setModalError(null);
    setIsDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      setModalError(null);
      setError(null);
      setSuccessMsg(null);
      
      const newRoleCode = editRole === "none" || editRole === "" ? null : editRole;
      const newCompanyId = editCompany === "none" || editCompany === "" ? null : editCompany;

      const errors: string[] = [];

      // Actualizar rol si cambió
      if (newRoleCode && newRoleCode !== selectedUser.role?.id) {
        try {
          await userService.updateModuleUserRole(selectedUser.id, newRoleCode);
        } catch (err: any) {
          errors.push("Rol: " + (err.message || err));
        }
      }

      // Actualizar empresa y proyectos (scopes)
      try {
        await userService.updateModuleUserScopes(selectedUser.id, newCompanyId, editProjects);
      } catch (err: any) {
        errors.push("Asignaciones: " + (err.message || err));
      }

      if (errors.length > 0) {
        setModalError(errors.join(" | "));
      } else {
        setSuccessMsg("Usuario actualizado correctamente");
      }
      fetchUsers();
      setIsDialogOpen(false);
    } catch (err: any) {
      setModalError(err.message || "Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleToggleActive = async (userId: string) => {
    try {
      setError(null);
      setSuccessMsg(null);
      await userService.toggleModuleUserActive(userId);
      setSuccessMsg("Estado del usuario actualizado correctamente");
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Error al cambiar estado del usuario");
    }
  };

  const selectedCompany = companies.find((c) => c.id === editCompany);
  const filteredProjects =
    editCompany && editCompany !== "none"
      ? projects.filter((p) => p.companyId === editCompany || editProjects.includes(p.id))
      : projects;

  return (
    <PmAppShell
      active="Usuarios"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Gestión de Usuarios</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Sistema / Accesos"
        title="Gestión de Usuarios"
        copy="Administra los roles y empresas asignadas a los usuarios del sistema."
        action={
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4e5558]" />
              <Input
                type="text"
                placeholder="Buscar por nombre o email..."
                className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-[#a84730]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-[#a7c9b4] bg-[#edf3ec] p-3 text-[#376850]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#d9772f]"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] py-20 text-center text-[#4e5558]">
            No se encontraron usuarios.
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] transition-all hover:border-[#b9561d] hover:shadow-md"
              >
                {/* Barra de estado */}
                <span
                  className={cn(
                    "absolute left-0 top-0 z-10 h-[3px] w-full",
                    user.isActive ? "bg-[#4c9b7a]" : "bg-[#c85454]"
                  )}
                />

                {/* Header: avatar + nombre + estado */}
                <div className="flex items-center gap-3 border-b border-[#d8d0c4]/50 p-3 pb-2.5">
                  <div
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-lg text-[15px] font-bold transition-transform duration-300 group-hover:scale-105",
                      user.isActive
                        ? "border border-[#d9772f] bg-[#d9772f]/15 text-[#b9561d]"
                        : "border border-[#d8d0c4] bg-[#ece6dc] text-[#8d918f]"
                    )}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-bold text-[#111416]">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="truncate text-[10px] font-medium text-[#4e5558]">{user.email}</p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-none",
                      user.isActive
                        ? "bg-[#4c9b7a] text-white"
                        : "bg-[#ece6dc] text-[#4e5558]"
                    )}
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                {/* Cuerpo: rol, empresa y alcance */}
                <div className="flex flex-grow flex-col px-3 py-1">
                  <div className="flex items-center gap-2 border-b border-[#d8d0c4]/40 py-2">
                    <UserRoundCog className="h-3.5 w-3.5 shrink-0 text-[#5e8fc2]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#111416]">
                      {user.role?.name || "Sin Rol"}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8d918f]">Rol</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-[#d8d0c4]/40 py-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[#d9772f]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#111416]">
                      {user.company?.name || "Sin Empresa"}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8d918f]">Empresa</span>
                  </div>
                  <div className="flex items-center gap-2 py-2">
                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-[#b9561d]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#111416]">
                      {user.projectIds && user.projectIds.length > 0
                        ? `${user.projectIds.length} proyecto(s)`
                        : "Acceso total"}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8d918f]">Alcance</span>
                  </div>
                </div>

                {/* Footer: acciones */}
                <div className="flex items-center justify-between border-t border-[#d8d0c4] bg-[#f5f0e8]/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-md text-[10px] font-bold uppercase tracking-wider",
                      user.isActive
                        ? "text-[#4c9b7a] hover:bg-[#edf3ec] hover:text-[#3d7f63]"
                        : "text-[#a84730] hover:bg-[#fff0eb] hover:text-[#8a3a24]"
                    )}
                    onClick={() => handleToggleActive(user.id)}
                    title={user.isActive ? "Desactivar usuario" : "Activar usuario"}
                  >
                    {user.isActive ? <Power className="h-3.5 w-3.5 mr-1.5" /> : <PowerOff className="h-3.5 w-3.5 mr-1.5" />}
                    {user.isActive ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-md text-[10px] font-bold uppercase tracking-wider text-[#b9561d] hover:bg-[#fff0eb] hover:text-[#8a3a24]"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Gestionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && meta.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#d8d0c4] bg-[#fffdf9] px-4 py-3 sm:flex-row sm:px-6">
            <p className="text-xs text-[#4e5558] sm:text-sm">
              Página <span className="font-medium text-[#111416]">{meta.page}</span> de{" "}
              <span className="font-medium text-[#111416]">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#111416] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#b9561d]"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#111416] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#b9561d]"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Nota inferior */}
        <div className="flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
          <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
          <span className="inline-flex items-center gap-[5px] font-bold text-[#b9561d]">
            {meta.total} usuarios en el sistema
            <UserRoundCog className="h-[13px] w-[13px]" />
          </span>
        </div>
      </div>

      <ErpModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        eyebrow="Sistema / Accesos"
        title="Gestionar Usuario"
        description="Modifica el rol y la empresa asignada a este usuario."
        headerExtra={
          selectedUser && (
            <div className="flex items-center gap-3 border-b border-[#d8d0c4] bg-[#f5f0e8]/40 px-4 py-3 sm:px-5 sm:py-3.5">
              <div
                className={cn(
                  "grid size-11 shrink-0 place-items-center text-[14px] font-bold",
                  selectedUser.isActive
                    ? "border border-[#d9772f] bg-[#d9772f]/15 text-[#b9561d]"
                    : "border border-[#d8d0c4] bg-[#ece6dc] text-[#8d918f]"
                )}
              >
                {getInitials(selectedUser.firstName, selectedUser.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#111416]">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="truncate text-[10px] font-medium text-[#4e5558]">{selectedUser.email}</p>
              </div>
              <Badge
                className={cn(
                  "shrink-0 rounded-none text-[9px] font-bold uppercase tracking-wider shadow-none",
                  selectedUser.isActive
                    ? "bg-[#4c9b7a] text-white"
                    : "bg-[#ece6dc] text-[#4e5558]"
                )}
              >
                {selectedUser.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          )
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
              className="w-full rounded-none border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416] sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={saving}
              className="w-full rounded-none border border-[#d9772f] bg-[#d9772f] text-white hover:border-[#b9561d] hover:bg-[#b9561d] sm:w-auto"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </>
        }
      >
        {modalError && (
          <div className="flex items-center gap-2 border border-[#edb6a5] bg-[#fff0eb] px-3 py-2.5 text-[#a84730]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[12px] font-semibold">{modalError}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-user-role" className="text-[12px] font-semibold text-[#111416]">
            Rol del Usuario
          </label>
          <Select value={editRole} onValueChange={setEditRole}>
            <SelectTrigger
              id="edit-user-role"
              className="h-10 w-full rounded-none border-[#d8d0c4] bg-[#fffdf9] py-2 pr-2 pl-3 text-[13px] text-[#111416] shadow-none data-placeholder:text-[#8d918f] data-[size=default]:h-10 focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
            >
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent className="rounded-none border border-[#d8d0c4] bg-[#fffdf9] text-[#111416] shadow-[0_24px_50px_rgba(17,20,22,0.22)]">
              <SelectItem value="none" className="rounded-none py-1.5 text-[12px] focus:bg-[#fff0eb] focus:text-[#111416]">
                Sin Rol
              </SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id} className="rounded-none py-1.5 text-[12px] focus:bg-[#fff0eb] focus:text-[#111416]">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-user-company" className="text-[12px] font-semibold text-[#111416]">
            Empresa Asignada
          </label>
          <Select value={editCompany} onValueChange={setEditCompany}>
            <SelectTrigger
              id="edit-user-company"
              className="h-10 w-full rounded-none border-[#d8d0c4] bg-[#fffdf9] py-2 pr-2 pl-3 text-[13px] text-[#111416] shadow-none data-placeholder:text-[#8d918f] data-[size=default]:h-10 focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
            >
              <SelectValue placeholder="Seleccionar empresa" />
            </SelectTrigger>
            <SelectContent className="rounded-none border border-[#d8d0c4] bg-[#fffdf9] text-[#111416] shadow-[0_24px_50px_rgba(17,20,22,0.22)]">
              <SelectItem value="none" className="rounded-none py-1.5 text-[12px] focus:bg-[#fff0eb] focus:text-[#111416]">
                Sin Empresa
              </SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id} className="rounded-none py-1.5 text-[12px] focus:bg-[#fff0eb] focus:text-[#111416]">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCompany ? (
            <div className="border border-[#d8d0c4] bg-[#fffdf9]">
              <div className="flex items-center gap-3 border-b border-[#d8d0c4] px-3 py-3">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden border border-[#d8d0c4] bg-[#f5f0e8]/50">
                  {selectedCompany.logoUrl ? (
                    <img
                      src={selectedCompany.logoUrl}
                      alt={`Logo de ${selectedCompany.name}`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-[#8d918f]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[#111416]">{selectedCompany.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#b9561d]">Empresa asignada</p>
                </div>
              </div>
              <dl className="grid gap-2 px-3 py-3 sm:grid-cols-2">
                <CompanyFact label="Razón social" value={selectedCompany.legalName} />
                <CompanyFact label="Identificación fiscal" value={selectedCompany.taxId} />
                <CompanyFact label="Correo" value={selectedCompany.email} />
                <CompanyFact label="Teléfono" value={selectedCompany.phone} />
                <CompanyFact label="Dirección" value={selectedCompany.address} className="sm:col-span-2" />
              </dl>
              {isGestion && (
                <div className="border-t border-[#d8d0c4] px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDialogOpen(false);
                      navigate(`/project-management/empresa/${selectedCompany.id}/editar`);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 text-[11px] font-bold text-[#b9561d] hover:text-[#111416]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar información de la empresa
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 border border-dashed border-[#d8d0c4] px-3 py-4 text-[#8d918f]">
              <Building2 className="h-5 w-5 shrink-0 text-[#d9772f]/50" />
              <p className="text-[12px] font-semibold">Sin empresa asignada</p>
            </div>
          )}
        </div>

        {/* Selector de proyectos asignados */}
        <div className="flex min-w-0 flex-col gap-1.5 pt-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <label className="text-[12px] font-semibold text-[#111416]">
              Proyectos asignados
            </label>
            <span className="text-[10px] font-semibold text-[#b9561d]">
              {editProjects.length === 0
                ? "Todos los proyectos"
                : `${editProjects.length} seleccionado(s)`}
            </span>
          </div>
          <p className="text-[11px] leading-5 text-[#4e5558]">
            {editRole === "PM_ADMIN_FINANCIERO"
              ? "Selecciona los proyectos específicos que este Administrador Financiero gestionará. Si no seleccionas ninguno, tendrá acceso a todos los proyectos."
              : "Asigna proyectos específicos para restringir el alcance del usuario. Si no seleccionas ninguno, tendrá acceso según su rol y empresa."}
          </p>

          <div className="max-h-44 min-w-0 space-y-1 overflow-y-auto rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-2">
            {filteredProjects.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-[#8d918f]">
                No hay proyectos registrados para asignar.
              </p>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = editProjects.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setEditProjects(editProjects.filter((id) => id !== p.id));
                      } else {
                        setEditProjects([...editProjects, p.id]);
                      }
                    }}
                    className={cn(
                      "flex min-w-0 items-start gap-2.5 rounded-md border px-2.5 py-1.5 text-[12px] cursor-pointer select-none transition-colors",
                      isSelected
                        ? "border-[#d9772f] bg-[#fff0eb] text-[#b9561d] font-semibold"
                        : "border-transparent hover:bg-[#f5f0e8]/70 text-[#111416]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors",
                        isSelected
                          ? "border-[#d9772f] bg-[#d9772f] text-white"
                          : "border-[#d8d0c4] bg-[#fffdf9]"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] leading-4">{p.shortName || p.fullName}</p>
                      <p className="truncate text-[10px] font-medium leading-4 text-[#4e5558]">
                        {p.code}
                        {p.company?.name ? ` · ${p.company.name}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {editProjects.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditProjects([])}
                className="text-[10px] font-bold uppercase tracking-wider text-[#b9561d] hover:underline cursor-pointer"
              >
                Limpiar selección (Acceso total)
              </button>
            </div>
          )}
        </div>
      </ErpModal>
    </PmAppShell>
  );
}
