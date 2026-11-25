import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { userApi } from "../api/user.api";
import { adminApi } from "../api/admin.api";
import { useQcAuthStore } from "../store/auth.store";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader, QcPrimaryButton, QcSecondaryButton } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";
import { QcPagination } from "../components/QcPagination";
import { cn } from "@/lib/utils";

const PERMISSION_LABELS: Record<string, string> = {
  QC_VIEW_DASHBOARD: "Ver dashboard principal",
  QC_SUBMIT_MEASUREMENT: "Cargar medición",
  QC_MANAGE_USERS: "Gestionar usuarios",
  QC_MANAGE_STRUCTURE: "Gestionar estructura organizacional",
  QC_MANAGE_INDICATORS: "Gestionar indicadores y metas",
  QC_MANAGE_PERIODS: "Gestionar períodos de medición",
  QC_REVIEW_MEASUREMENTS: "Revisar y aprobar mediciones",
  QC_VIEW_REPORTS: "Consultar informes consolidados",
  QC_VIEW_AUDIT_LOG: "Consultar bitácora de auditoría",
};

const ROLE_LABELS: Record<string, string> = {
  QC_ADMIN: "Administrador",
  QC_DIRECTOR: "Director",
  QC_OWNER: "Responsable de Proceso",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  QC_ADMIN: "Administrador del Sistema de Calidad con control total sobre configuración, usuarios y auditoría.",
  QC_DIRECTOR: "Supervisión ejecutiva, aprobación estratégica y consulta de informes consolidados.",
  QC_OWNER: "Gestión operativa, seguimiento y registro de mediciones en procesos asignados.",
};

const ROLE_CATEGORY_BADGES: Record<string, { label: string; className: string; dot: string }> = {
  QC_ADMIN: {
    label: "Administración",
    className: "border-[#a7f3d0] bg-[#f0faf5] text-[#047857]",
    dot: "bg-[#059669]",
  },
  QC_DIRECTOR: {
    label: "Dirección",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  QC_OWNER: {
    label: "Operativo",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
};

const ROLE_TONES: Record<string, { badge: string; dot: string }> = {
  QC_ADMIN: { badge: "border-[#a7f3d0] bg-[#f0faf5] text-[#047857]", dot: "bg-[#059669]" },
  QC_DIRECTOR: { badge: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  QC_OWNER: { badge: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};

const ROLE_AVATAR: Record<string, string> = {
  QC_ADMIN: "bg-[#047857] text-white",
  QC_DIRECTOR: "bg-blue-600 text-white",
  QC_OWNER: "bg-amber-500 text-white",
};
const ROLE_AVATAR_DEFAULT = "bg-[#0f2e22] text-[#a7f3d0]";

const PAGE_SIZE = 9;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function UserAvatar({
  firstName,
  lastName,
  email,
  roleCode,
}: {
  firstName: string | null;
  lastName: string | null;
  email: string;
  roleCode: string | null;
}) {
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((s) => s![0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || email.slice(0, 2).toUpperCase();
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold shadow-sm ring-2 ring-white",
        roleCode ? (ROLE_AVATAR[roleCode] ?? ROLE_AVATAR_DEFAULT) : ROLE_AVATAR_DEFAULT
      )}
    >
      {initials}
    </span>
  );
}

function RoleBadge({ code, label }: { code: string; label: string }) {
  const tone = ROLE_TONES[code];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        tone?.badge ?? "border-[#d8e6de] bg-[#f7faf8] text-[#5b7267]"
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone?.dot ?? "bg-[#9db0a5]")} />
      {label}
    </span>
  );
}

function StatusBadge({
  status,
  emailVerified,
  compact = false,
}: {
  status: string;
  emailVerified: boolean;
  compact?: boolean;
}) {
  const active = status === "ACTIVE";
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold",
          active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
        )}
      >
        <span className={cn("size-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
        {active ? "Activo" : status === "INACTIVE" ? "Inactivo" : status}
      </span>
      {!compact && !emailVerified && active ? (
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          Sin verificar
        </span>
      ) : null}
    </div>
  );
}

/* Acciones compactas de un usuario (compartidas entre tabla y tarjetas) */
function UserActions({
  user,
  currentUserId,
  togglingId,
  onToggle,
  onRoles,
  onScopes,
  onEdit,
  onReset,
  onRemove,
}: {
  user: { id: string; status: string; email: string };
  currentUserId: string | undefined;
  togglingId: string | null;
  onToggle: () => void;
  onRoles: () => void;
  onScopes: () => void;
  onEdit: () => void;
  onReset: () => void;
  onRemove: () => void;
}) {
  const actionBtn =
    "grid size-8 shrink-0 place-items-center rounded-lg border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={onRoles}
        title="Editar roles"
        aria-label="Editar roles"
        className={cn(actionBtn, "border-[#d8e6de] text-[#047857] hover:border-[#059669] hover:bg-[#f0faf5]")}
      >
        <ShieldCheck className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onScopes}
        title="Editar alcance por procesos"
        aria-label="Editar alcance"
        className={cn(actionBtn, "border-[#d8e6de] text-[#047857] hover:border-[#059669] hover:bg-[#f0faf5]")}
      >
        <SlidersHorizontal className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Editar perfil"
        aria-label="Editar perfil"
        className={cn(actionBtn, "border-[#d8e6de] text-[#047857] hover:border-[#059669] hover:bg-[#f0faf5]")}
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        disabled={togglingId === user.id || user.id === currentUserId}
        title={
          user.id === currentUserId
            ? "No puedes desactivar tu propia cuenta"
            : user.status === "ACTIVE"
              ? "Desactivar usuario (bloqueará su acceso)"
              : "Activar usuario"
        }
        aria-label={user.status === "ACTIVE" ? "Desactivar usuario" : "Activar usuario"}
        onClick={onToggle}
        className={cn(
          actionBtn,
          user.status === "ACTIVE"
            ? "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
            : "border-emerald-200 text-emerald-700 hover:border-[#059669] hover:bg-emerald-50"
        )}
      >
        {togglingId === user.id ? <Loader2 className="size-3.5 animate-spin" /> : <Power className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={onReset}
        title="Resetear contraseña"
        aria-label="Resetear contraseña"
        className={cn(actionBtn, "border-[#d8e6de] text-[#047857] hover:border-[#059669] hover:bg-[#f0faf5]")}
      >
        <RotateCcw className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Eliminar usuario"
        aria-label="Eliminar usuario"
        className={cn(actionBtn, "border-red-100 text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600")}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

/* ============================================================================
   Modal: crear usuario del módulo (solo QC_ADMIN)
============================================================================ */
function CreateUserDialog({
  roles,
  processes,
  onClose,
}: {
  roles: { id: string; code: string; description: string | null }[];
  processes: { id: string; code: string; name: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [processIds, setProcessIds] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      userApi.create({
        email,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
        roleCodes: roles.filter((r) => roleIds.includes(r.id)).map((r) => r.code),
        processIds,
      }),
    onSuccess: () => {
      toast.success("Usuario creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword &&
    roleIds.length > 0;

  const inputClass =
    "h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Nuevo usuario</h2>
            <p className="text-[12px] text-[#5b7267]">Crea un usuario del sistema de calidad</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Email *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Nombre</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="María"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Apellido</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez"
              className={inputClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Usuario (username)</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mperez"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Contraseña *</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Confirmar contraseña *</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className={cn(inputClass, password !== confirmPassword && confirmPassword ? "border-red-300" : "")}
            />
          </label>
        </div>

        {/* Roles */}
        <div className="mt-4">
          <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Roles *</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {roles.map((role) => {
              const active = roleIds.includes(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    setRoleIds((prev) => (active ? prev.filter((id) => id !== role.id) : [...prev, role.id]))
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                    active ? "border-[#a7f3d0] bg-[#f0faf5]" : "border-[#d8e6de] bg-white hover:border-[#059669]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4.5 shrink-0 place-items-center rounded-md border",
                      active ? "border-[#059669] bg-[#059669] text-white" : "border-[#d8e6de] bg-white text-transparent"
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-[12px] font-bold text-[#101f19]">{ROLE_LABELS[role.code] ?? role.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Procesos asignados */}
        <div className="mt-4">
          <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Procesos asignados</span>
          <div className="grid max-h-[150px] gap-2 overflow-y-auto rounded-lg border border-[#e2ece6] bg-[#f7faf8] p-3 sm:grid-cols-2">
            {processes.length === 0 ? (
              <p className="text-[11px] text-[#9db0a5]">No hay procesos disponibles.</p>
            ) : (
              processes.map((process) => {
                const active = processIds.includes(process.id);
                return (
                  <button
                    key={process.id}
                    type="button"
                    onClick={() =>
                      setProcessIds((prev) => (active ? prev.filter((id) => id !== process.id) : [...prev, process.id]))
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                      active ? "border-[#a7f3d0] bg-[#f0faf5]" : "border-[#d8e6de] bg-white hover:border-[#059669]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-md border",
                        active ? "border-[#059669] bg-[#059669] text-white" : "border-[#d8e6de] bg-white text-transparent"
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                      {process.code}
                    </span>
                    <span className="min-w-0 truncate text-[11px] font-semibold text-[#101f19]">{process.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {password !== confirmPassword && confirmPassword ? (
          <p className="mt-2 text-[11px] font-semibold text-red-600">Las contraseñas no coinciden.</p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#eef4f0] pt-4 sm:flex-row sm:justify-end">
          <QcSecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </QcSecondaryButton>
          <QcPrimaryButton type="button" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()} className="w-full sm:w-auto">
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Crear usuario
          </QcPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Modal: editar perfil (nombre, apellido, username)
============================================================================ */
function EditProfileDialog({
  user,
  onClose,
}: {
  user: { id: string; email: string; firstName: string | null; lastName: string | null; username: string | null };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [username, setUsername] = useState(user.username ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      userApi.updateProfile(user.id, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        username: username.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const inputClass =
    "h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Editar perfil</h2>
            <p className="text-[12px] text-[#5b7267]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Nombre</span>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Apellido</span>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Usuario (username)</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef4f0] pt-4">
          <QcSecondaryButton type="button" onClick={onClose}>
            Cancelar
          </QcSecondaryButton>
          <QcPrimaryButton type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar perfil
          </QcPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Modal: resetear contraseña (el admin escribe la nueva)
============================================================================ */
function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: { id: string; email: string };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => userApi.resetPassword(user.id, newPassword),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword;

  const inputClass =
    "h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Resetear contraseña</h2>
            <p className="text-[12px] text-[#5b7267]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-4 rounded-lg bg-[#f0faf5] px-3 py-2 text-[11px] font-medium text-[#047857]">
          El administrador define la nueva contraseña. Compártela de forma segura con el usuario.
        </p>

        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Nueva contraseña *</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5b7267]">Confirmar contraseña *</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className={cn(inputClass, newPassword !== confirmPassword && confirmPassword ? "border-red-300" : "")}
            />
          </label>
        </div>

        {newPassword !== confirmPassword && confirmPassword ? (
          <p className="mt-2 text-[11px] font-semibold text-red-600">Las contraseñas no coinciden.</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef4f0] pt-4">
          <QcSecondaryButton type="button" onClick={onClose}>
            Cancelar
          </QcSecondaryButton>
          <QcPrimaryButton type="button" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Actualizar contraseña
          </QcPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Modal: confirmar eliminación (soft delete)
============================================================================ */
function RemoveUserDialog({
  user,
  onClose,
}: {
  user: { id: string; email: string };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => userApi.remove(user.id),
    onSuccess: () => {
      toast.success("Usuario desactivado y eliminado");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-600">
            <Trash2 className="size-5" />
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Eliminar usuario</h2>
            <p className="text-[12px] text-[#5b7267]">{user.email}</p>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-[#5b7267]">
          El usuario quedará <strong className="text-[#101f19]">desactivado</strong> y marcado como eliminado. Su
          historial de mediciones se conserva (borrado lógico).
        </p>

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef4f0] pt-4">
          <QcSecondaryButton type="button" onClick={onClose}>
            Cancelar
          </QcSecondaryButton>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Eliminar usuario
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Modal: roles de un usuario (multi-select checkboxes)
============================================================================ */
function UserRolesDialog({
  userId,
  userEmail,
  currentRoles,
  roles,
  onClose,
}: {
  userId: string;
  userEmail: string;
  currentRoles: string[];
  roles: { id: string; code: string; description: string | null }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(currentRoles);

  useEffect(() => {
    setSelected(currentRoles);
  }, [currentRoles]);

  const mutation = useMutation({
    mutationFn: () => userApi.updateUserRoles(userId, selected),
    onSuccess: () => {
      toast.success("Roles actualizados");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Roles de usuario</h2>
            <p className="text-[12px] text-[#5b7267]">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-2">
          {roles.map((role) => {
            const active = selected.includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() =>
                  setSelected((prev) => (active ? prev.filter((id) => id !== role.id) : [...prev, role.id]))
                }
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-[#a7f3d0] bg-[#f0faf5]"
                    : "border-[#d8e6de] bg-white hover:border-[#059669]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                    active ? "border-[#059669] bg-[#059669] text-white" : "border-[#d8e6de] bg-white text-transparent"
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-[#101f19]">
                    {ROLE_LABELS[role.code] ?? role.code}
                  </span>
                  <span className="block text-[11px] text-[#7c9186]">{ROLE_DESCRIPTIONS[role.code] ?? role.description ?? role.code}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef4f0] pt-4">
          <QcSecondaryButton type="button" onClick={onClose}>
            Cancelar
          </QcSecondaryButton>
          <QcPrimaryButton type="button" disabled={mutation.isPending || selected.length === 0} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar roles
          </QcPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Modal: alcances (procesos asignados) de un usuario
============================================================================ */
function UserScopesDialog({
  userId,
  userEmail,
  currentProcessIds,
  processes,
  onClose,
}: {
  userId: string;
  userEmail: string;
  currentProcessIds: string[];
  processes: { id: string; code: string; name: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(currentProcessIds);

  useEffect(() => {
    setSelected(currentProcessIds);
  }, [currentProcessIds]);

  const mutation = useMutation({
    mutationFn: () => userApi.updateUserScopes(userId, selected),
    onSuccess: () => {
      toast.success("Alcances actualizados");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Alcance por procesos</h2>
            <p className="text-[12px] text-[#5b7267]">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-3 rounded-lg bg-[#f0faf5] px-3 py-2 text-[11px] font-medium text-[#047857]">
          Los responsables de proceso solo podrán medir indicadores de los procesos asignados.
        </p>

        <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
          {processes.map((process) => {
            const active = selected.includes(process.id);
            return (
              <button
                key={process.id}
                type="button"
                onClick={() =>
                  setSelected((prev) => (active ? prev.filter((id) => id !== process.id) : [...prev, process.id]))
                }
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                  active ? "border-[#a7f3d0] bg-[#f0faf5]" : "border-[#d8e6de] bg-white hover:border-[#059669]"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                    active ? "border-[#059669] bg-[#059669] text-white" : "border-[#d8e6de] bg-white text-transparent"
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                  {process.code}
                </span>
                <span className="min-w-0 truncate text-[12px] font-semibold text-[#101f19]">{process.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef4f0] pt-4">
          <QcSecondaryButton type="button" onClick={onClose}>
            Cancelar
          </QcSecondaryButton>
          <QcPrimaryButton type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar alcances
          </QcPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Modal: permisos de un rol
============================================================================ */
function RolePermissionsDialog({
  roleId,
  roleCode,
  currentPermissionIds,
  permissions,
  onClose,
}: {
  roleId: string;
  roleCode: string;
  currentPermissionIds: string[];
  permissions: { id: string; code: string; description: string | null }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(currentPermissionIds);

  useEffect(() => {
    setSelected(currentPermissionIds);
  }, [currentPermissionIds]);

  const mutation = useMutation({
    mutationFn: () => userApi.updateRolePermissions(roleId, selected),
    onSuccess: () => {
      toast.success("Permisos del rol actualizados");
      queryClient.invalidateQueries({ queryKey: ["qc-roles"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Permisos de rol</h2>
            <p className="text-[12px] text-[#5b7267]">{ROLE_LABELS[roleCode] ?? roleCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid max-h-[440px] gap-2 overflow-y-auto pr-1">
          {permissions.map((permission) => {
            const active = selected.includes(permission.id);
            return (
              <button
                key={permission.id}
                type="button"
                onClick={() =>
                  setSelected((prev) => (active ? prev.filter((id) => id !== permission.id) : [...prev, permission.id]))
                }
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                  active ? "border-[#a7f3d0] bg-[#f0faf5]" : "border-[#d8e6de] bg-white hover:border-[#059669]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                    active ? "border-[#059669] bg-[#059669] text-white" : "border-[#d8e6de] bg-white text-transparent"
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold text-[#101f19]">{PERMISSION_LABELS[permission.code] ?? permission.code}</span>
                  <span className="block text-[11px] text-[#7c9186]">{permission.description ?? ""}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef4f0] pt-4">
          <QcSecondaryButton type="button" onClick={onClose}>
            Cancelar
          </QcSecondaryButton>
          <QcPrimaryButton type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar permisos
          </QcPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Página: usuarios y roles (solo QC_ADMIN)
============================================================================ */
export const UsersPage = () => {
  const currentUserId = useQcAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [rolesTarget, setRolesTarget] = useState<{
    user: { id: string; email: string; roleIds: string[] };
  } | null>(null);
  const [scopesTarget, setScopesTarget] = useState<{
    user: { id: string; email: string; processIds: string[] };
  } | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<{
    role: { id: string; code: string; permissionIds: string[] };
  } | null>(null);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  } | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; email: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "cards">(
    () =>
      typeof window !== "undefined" && window.localStorage.getItem("qc-users-view") === "cards" ? "cards" : "table"
  );

  const changeView = (next: "table" | "cards") => {
    setView(next);
    setPage(1);
    try {
      window.localStorage.setItem("qc-users-view", next);
    } catch {
      /* noop */
    }
  };

  const [page, setPage] = useState(1);

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: string) => userApi.toggleActive(userId),
    onMutate: (userId) => setTogglingId(userId),
    onSuccess: (data) => {
      toast.success(data.status === "ACTIVE" ? "Usuario activado" : "Usuario desactivado");
      queryClient.invalidateQueries({ queryKey: ["qc-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setTogglingId(null),
  });

  const users = useQuery({ queryKey: ["qc-users"], queryFn: userApi.list });
  const roles = useQuery({ queryKey: ["qc-roles"], queryFn: userApi.roles });
  const permissions = useQuery({ queryKey: ["qc-permissions"], queryFn: userApi.permissions });
  const processes = useQuery({ queryKey: ["qc-admin-processes"], queryFn: adminApi.listProcesses });

  const filtered = useMemo(() => {
    // Recién registrados primero (para que el admin vea los usuarios nuevos).
    const sorted = [...(users.data ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        user.organization.name.toLowerCase().includes(q) ||
        user.firstName?.toLowerCase().includes(q) ||
        user.lastName?.toLowerCase().includes(q)
    );
  }, [users.data, query]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // Mantener la página dentro de rango cuando cambia el listado (búsqueda / datos).
  useEffect(() => {
    setPage((current) => {
      const max = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      return Math.min(current, max);
    });
  }, [filtered.length]);

  const allProcesses = useMemo(() => {
    const flat: { id: string; code: string; name: string }[] = [];
    const walk = (list: { id: string; code: string; name: string; children?: unknown[] }[]) => {
      for (const item of list) {
        flat.push({ id: item.id, code: item.code, name: item.name });
        if (item.children?.length) walk(item.children as never);
      }
    };
    walk(processes.data ?? []);
    return flat;
  }, [processes.data]);

  return (
    <QcAppShell active="Usuarios y roles" crumb={<>Inicio / <strong>Usuarios y roles</strong></>}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <QcPageHeader
          title="Usuarios y roles"
          subtitle="Gestión de accesos: usuarios del sistema, roles, permisos y alcance por procesos"
          className="mb-0"
        />
        <QcPrimaryButton type="button" onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
          <Plus className="size-4" />
          Nuevo usuario
        </QcPrimaryButton>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9db0a5]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por correo, nombre u organización…"
            className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white pl-9 pr-3.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
          />
        </div>

        {/* Alternar vista tabla / tarjetas */}
        <div className="flex items-center gap-1 rounded-xl border border-[#d8e6de] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => changeView("table")}
            aria-pressed={view === "table"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
              view === "table"
                ? "bg-[#059669] text-white shadow-sm"
                : "text-[#5b7267] hover:bg-[#f2f7f4] hover:text-[#101f19]"
            )}
          >
            <Table2 className="size-3.5" />
            Tabla
          </button>
          <button
            type="button"
            onClick={() => changeView("cards")}
            aria-pressed={view === "cards"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
              view === "cards"
                ? "bg-[#059669] text-white shadow-sm"
                : "text-[#5b7267] hover:bg-[#f2f7f4] hover:text-[#101f19]"
            )}
          >
            <LayoutGrid className="size-3.5" />
            Tarjetas
          </button>
        </div>

        <span className="ml-auto text-[12px] font-semibold text-[#7c9186]">
          {filtered.length} {filtered.length === 1 ? "usuario" : "usuarios"}
        </span>
      </div>

      {/* Usuarios */}
      {users.isLoading ? (
        <div className="h-[320px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : filtered.length > 0 ? (
        <>
          {view === "table" ? (
            <QcCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4f0] bg-[#f7faf8] px-5 py-3">
              <h2 className="flex items-center gap-2 text-[12px] font-bold text-[#101f19]">
                <ShieldCheck className="size-4 text-[#047857]" />
                Usuarios del sistema
              </h2>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#9db0a5] sm:block">
                {filtered.length} registro{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e2ece6] bg-[#f7faf8]">
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Usuario
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Roles
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Procesos
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Estado
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Registro
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((user) => {
                    const roleCodes = user.qc_user_roles.map(({ role }) => role.code);
                    return (
                      <tr
                        key={user.id}
                        className="group border-b border-[#eef4f0] transition-colors last:border-0 hover:bg-[#f7fcf9]"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              firstName={user.firstName}
                              lastName={user.lastName}
                              email={user.email}
                              roleCode={roleCodes[0] ?? null}
                            />
                            <div className="min-w-0">
                              <span className="block text-[13px] font-semibold text-[#101f19]">
                                {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                              </span>
                              {user.username ? (
                                <span className="block truncate text-[11px] font-bold text-[#047857]">
                                  @{user.username}
                                </span>
                              ) : null}
                              <span className="block truncate text-[11px] text-[#7c9186]">{user.email}</span>
                              <span className="block text-[10px] font-medium text-[#9db0a5]">
                                {user.organization.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {user.qc_user_roles.map(({ role }) => (
                              <RoleBadge key={role.id} code={role.code} label={ROLE_LABELS[role.code] ?? role.code} />
                            ))}
                            {user.qc_user_roles.length === 0 ? (
                              <span className="text-[11px] font-medium text-[#9db0a5]">Sin rol</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex max-w-[220px] flex-wrap gap-1">
                            {user.processAssignments.map(({ process }) => (
                              <span
                                key={process.id}
                                className="inline-flex rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]"
                              >
                                {process.code}
                              </span>
                            ))}
                            {user.processAssignments.length === 0 ? (
                              <span className="text-[11px] font-medium text-[#9db0a5]">Sin procesos</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={user.status} emailVerified={user.emailVerified} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-semibold text-[#5b7267]">{formatDate(user.createdAt)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <UserActions
                              user={user}
                              currentUserId={currentUserId}
                              togglingId={togglingId}
                              onToggle={() => toggleActiveMutation.mutate(user.id)}
                              onRoles={() =>
                                setRolesTarget({
                                  user: {
                                    id: user.id,
                                    email: user.email,
                                    roleIds: user.qc_user_roles.map(({ role }) => role.id),
                                  },
                                })
                              }
                              onScopes={() =>
                                setScopesTarget({
                                  user: {
                                    id: user.id,
                                    email: user.email,
                                    processIds: user.processAssignments.map(({ process }) => process.id),
                                  },
                                })
                              }
                              onEdit={() =>
                                setEditTarget({
                                  id: user.id,
                                  email: user.email,
                                  firstName: user.firstName,
                                  lastName: user.lastName,
                                  username: user.username,
                                })
                              }
                              onReset={() => setResetTarget({ id: user.id, email: user.email })}
                              onRemove={() => setRemoveTarget({ id: user.id, email: user.email })}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </QcCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((user) => {
              const roleCodes = user.qc_user_roles.map(({ role }) => role.code);
              return (
                <QcCard key={user.id} className="relative flex flex-col overflow-hidden p-0">
                  <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#047857] via-[#10b981] to-[#34d399]" />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        firstName={user.firstName}
                        lastName={user.lastName}
                        email={user.email}
                        roleCode={roleCodes[0] ?? null}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#101f19]">
                          {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                        </span>
                        {user.username ? (
                          <span className="block truncate text-[11px] font-bold text-[#047857]">
                            @{user.username}
                          </span>
                        ) : null}
                        <span className="block truncate text-[11px] text-[#7c9186]">{user.email}</span>
                        <span className="block truncate text-[10px] font-medium text-[#9db0a5]">
                          {user.organization.name}
                        </span>
                      </div>
                      <StatusBadge status={user.status} emailVerified={user.emailVerified} compact />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {user.qc_user_roles.map(({ role }) => (
                        <RoleBadge key={role.id} code={role.code} label={ROLE_LABELS[role.code] ?? role.code} />
                      ))}
                      {user.qc_user_roles.length === 0 ? (
                        <span className="text-[11px] font-medium text-[#9db0a5]">Sin rol asignado</span>
                      ) : null}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {user.processAssignments.map(({ process }) => (
                        <span
                          key={process.id}
                          className="inline-flex rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]"
                        >
                          {process.code}
                        </span>
                      ))}
                      {user.processAssignments.length === 0 ? (
                        <span className="text-[11px] font-medium text-[#9db0a5]">Sin procesos asignados</span>
                      ) : null}
                    </div>

                    <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9db0a5]">
                      Registrado el {formatDate(user.createdAt)}
                    </span>

                    <div className="mt-auto flex items-center gap-1.5 border-t border-[#eef4f0] pt-3">
                      <UserActions
                        user={user}
                        currentUserId={currentUserId}
                        togglingId={togglingId}
                        onToggle={() => toggleActiveMutation.mutate(user.id)}
                        onRoles={() =>
                          setRolesTarget({
                            user: {
                              id: user.id,
                              email: user.email,
                              roleIds: user.qc_user_roles.map(({ role }) => role.id),
                            },
                          })
                        }
                        onScopes={() =>
                          setScopesTarget({
                            user: {
                              id: user.id,
                              email: user.email,
                              processIds: user.processAssignments.map(({ process }) => process.id),
                            },
                          })
                        }
                        onEdit={() =>
                          setEditTarget({
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            username: user.username,
                          })
                        }
                        onReset={() => setResetTarget({ id: user.id, email: user.email })}
                        onRemove={() => setRemoveTarget({ id: user.id, email: user.email })}
                      />
                    </div>
                  </div>
                </QcCard>
              );
            })}
          </div>
          )}
          <div className="mt-3 overflow-hidden rounded-xl border border-[#dce8e0] bg-white">
            <QcPagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <QcEmptyState title="Sin usuarios" description="No hay usuarios registrados en el sistema de calidad." />
      )}

      {/* Roles y permisos */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-[#101f19]">Roles y permisos</h2>
            <p className="text-[11px] text-[#7c9186]">
              Perfiles y capacidades asignadas dentro del Sistema de Gestión de Calidad
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#5b7267]">
            {roles.data?.length ?? 0} roles configurados
          </span>
        </div>
        {roles.isLoading ? (
          <div className="h-[120px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
        ) : roles.data && roles.data.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {roles.data.map((role) => {
              const roleBadge = ROLE_CATEGORY_BADGES[role.code] ?? {
                label: "Rol del sistema",
                className: "border-[#d8e6de] bg-[#f7faf8] text-[#5b7267]",
                dot: "bg-[#9db0a5]",
              };
              return (
                <QcCard key={role.id} className="flex flex-col justify-between p-4.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[14px] font-bold text-[#101f19]">
                        {ROLE_LABELS[role.code] ?? role.code}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs",
                          roleBadge.className
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", roleBadge.dot)} />
                        {roleBadge.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#7c9186]">
                      {ROLE_DESCRIPTIONS[role.code] ?? role.description ?? ""}
                    </p>
                    <div className="mt-3.5">
                      <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5b7267]">
                        <span>Permisos asignados</span>
                        <span className="rounded bg-[#f0f5f2] px-1.5 py-0.5 text-[9px] font-semibold text-[#374940]">
                          {role.qc_role_permissions.length}
                        </span>
                      </div>
                      <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-lg border border-[#eef4f0] bg-[#fcfdfc] p-2">
                        {role.qc_role_permissions.length > 0 ? (
                          role.qc_role_permissions.map(({ permission }) => (
                            <span
                              key={permission.id}
                              className="inline-flex items-center rounded-md border border-[#d8e6de] bg-white px-2 py-0.5 text-[9.5px] font-medium text-[#374940] shadow-2xs"
                            >
                              {PERMISSION_LABELS[permission.code] ?? permission.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] italic text-[#9db0a5]">
                            Sin permisos específicos asignados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-[#f0f5f2] pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPermissionsTarget({
                          role: {
                            id: role.id,
                            code: role.code,
                            permissionIds: role.qc_role_permissions.map(({ permission }) => permission.id),
                          },
                        })
                      }
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d8e6de] bg-white px-3 py-2 text-[11px] font-bold text-[#047857] shadow-2xs transition-colors hover:border-[#059669] hover:bg-[#f0faf5]"
                    >
                      <SlidersHorizontal className="size-3.5" />
                      Editar permisos
                    </button>
                  </div>
                </QcCard>
              );
            })}
          </div>
        ) : null}
      </div>

      {showCreate ? (
        <CreateUserDialog
          roles={(roles.data ?? []).map((r) => ({ id: r.id, code: r.code, description: r.description }))}
          processes={allProcesses}
          onClose={() => setShowCreate(false)}
        />
      ) : null}

      {rolesTarget ? (
        <UserRolesDialog
          userId={rolesTarget.user.id}
          userEmail={rolesTarget.user.email}
          currentRoles={rolesTarget.user.roleIds}
          roles={(roles.data ?? []).map((r) => ({ id: r.id, code: r.code, description: r.description }))}
          onClose={() => setRolesTarget(null)}
        />
      ) : null}

      {scopesTarget ? (
        <UserScopesDialog
          userId={scopesTarget.user.id}
          userEmail={scopesTarget.user.email}
          currentProcessIds={scopesTarget.user.processIds}
          processes={allProcesses}
          onClose={() => setScopesTarget(null)}
        />
      ) : null}

      {permissionsTarget ? (
        <RolePermissionsDialog
          roleId={permissionsTarget.role.id}
          roleCode={permissionsTarget.role.code}
          currentPermissionIds={permissionsTarget.role.permissionIds}
          permissions={permissions.data ?? []}
          onClose={() => setPermissionsTarget(null)}
        />
      ) : null}

      {editTarget ? (
        <EditProfileDialog user={editTarget} onClose={() => setEditTarget(null)} />
      ) : null}

      {resetTarget ? (
        <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
      ) : null}

      {removeTarget ? (
        <RemoveUserDialog user={removeTarget} onClose={() => setRemoveTarget(null)} />
      ) : null}
    </QcAppShell>
  );
};
