import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileClock, History, ChevronLeft, ChevronRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { auditApi, type AuditFilters, type PaginatedAuditResult } from "../api/audit.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";
import { cn } from "@/lib/utils";

function getActionBadge(entry: any): { label: string; className: string } {
  const action = (entry.action || "").toUpperCase();

  if (action === "REVIEW") {
    const status = (entry.after?.status || entry.before?.status || "").toUpperCase();
    if (status === "APPROVED") {
      return { label: "Aprobada", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    }
    if (status === "REJECTED") {
      return { label: "Rechazada", className: "border-red-200 bg-red-50 text-red-700" };
    }
    return { label: "Revisión", className: "border-sky-200 bg-sky-50 text-sky-700" };
  }

  const map: Record<string, { label: string; className: string }> = {
    CREATE: { label: "Crear", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    UPDATE: { label: "Actualizar", className: "border-amber-200 bg-amber-50 text-amber-700" },
    DELETE: { label: "Eliminar", className: "border-red-200 bg-red-50 text-red-700" },
    SUBMIT: { label: "Enviar", className: "border-purple-200 bg-purple-50 text-purple-700" },
    APPROVE: { label: "Aprobada", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    REJECT: { label: "Rechazada", className: "border-red-200 bg-red-50 text-red-700" },
  };

  return map[action] ?? { label: action, className: "border-slate-200 bg-slate-50 text-slate-600" };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEntity(entityType: string): string {
  if (!entityType) return "";
  const normalized = entityType.toUpperCase();
  const map: Record<string, string> = {
    PROCESS: "Proceso",
    INDICATOR: "Indicador",
    MEASUREMENT: "Medición",
    USER: "Usuario",
    ROLE: "Rol",
  };
  return map[normalized] ?? (map[entityType] ?? entityType);
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "(vacío)";
  if (typeof val === "boolean") return val ? "Sí" : "No";
  if (typeof val === "string") {
    const statusMap: Record<string, string> = {
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
      SUBMITTED: "Enviado",
      PENDING: "Pendiente",
      ACTIVE: "Activo",
      INACTIVE: "Inactivo",
    };
    if (statusMap[val]) return statusMap[val];
  }
  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(", ");
  }
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

const IGNORED_KEYS = ["id", "processId", "projectId", "subprocessId", "organizationId", "password", "userId"];
const KEY_LABELS: Record<string, string> = {
  code: "Código",
  name: "Nombre",
  description: "Descripción",
  chartType: "Tipo de gráfica",
  frequency: "Frecuencia",
  direction: "Dirección",
  formula: "Fórmula",
  inputMode: "Modo de entrada",
  targetValue: "Meta",
  unit: "Unidad",
  displayAsPercent: "Porcentaje",
  aggregation: "Agregación",
  email: "Correo electrónico",
  qcRole: "Rol",
  value: "Valor",
  trafficLight: "Semáforo",
  observation: "Observación",
  analysisInternal: "Análisis Interno",
  analysisExternal: "Análisis Externo",
  status: "Estado",
  role: "Rol",
  roleCodes: "Roles",
  roles: "Roles",
};

function ObjectList({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([k]) => !IGNORED_KEYS.includes(k)
  );
  if (entries.length === 0) return <div className="text-[10px] italic text-[#6f8a7c]">Sin cambios relevantes</div>;

  return (
    <ul className="space-y-1 text-[11px] leading-[1.5] text-[#cfe6da]">
      {entries.map(([k, v]) => (
        <li key={k}>
          <strong className="font-semibold text-[#8eb09e]">{KEY_LABELS[k] || k}:</strong>{" "}
          <span className="text-white break-all">{formatValue(v)}</span>
        </li>
      ))}
    </ul>
  );
}

function AuditDiff({ before, after }: { before: unknown; after: unknown }) {
  const [open, setOpen] = useState(false);
  const hasData = (before && JSON.stringify(before) !== "{}") || (after && JSON.stringify(after) !== "{}");

  if (!hasData) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-bold text-[#047857] hover:underline"
      >
        {open ? "Ocultar detalle" : "Ver cambios"}
      </button>
      {open ? (
        <div className="mt-2 grid gap-2 rounded-lg bg-[#0b1f16] p-3 sm:grid-cols-2">
          {before && JSON.stringify(before) !== "{}" ? (
            <div>
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6f8a7c]">Antes</p>
              <div className="max-h-[160px] overflow-auto">
                <ObjectList data={before} />
              </div>
            </div>
          ) : null}
          {after && JSON.stringify(after) !== "{}" ? (
            <div>
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6f8a7c]">Después</p>
              <div className="max-h-[160px] overflow-auto">
                <ObjectList data={after} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-[#d8e6de] bg-white text-[12px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]";
const labelClass = "mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#5b7267]";

export const AuditLogPage = () => {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, limit: 20 });
  const [showFilters, setShowFilters] = useState(false);

  const logs = useQuery<PaginatedAuditResult>({
    queryKey: ["qc-audit-logs", filters],
    queryFn: () => auditApi.filtered(filters),
  });

  const data = logs.data;
  const hasActiveFilters = !!(filters.startsAt || filters.endsAt || filters.action || filters.entityType);

  return (
    <QcAppShell active="Auditoría" crumb={<>Inicio / <strong>Auditoría</strong></>}>
      <QcPageHeader
        title="Auditoría"
        subtitle="Registro de acciones sobre procesos, indicadores, usuarios y roles"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8e6de] bg-white px-3 py-1.5 text-[11px] font-bold text-[#5b7267]">
            <FileClock className="size-3.5 text-[#047857]" />
            {data?.total ?? 0} entradas
          </span>
        }
      />

      {/* Filters toggle */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors",
            showFilters
              ? "border-[#059669] bg-[#059669] text-white"
              : "border-[#d8e6de] bg-white text-[#5b7267] hover:border-[#059669]"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          Filtros
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => setFilters({ page: 1, limit: 20 })}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline"
          >
            <RotateCcw className="size-3" />
            Limpiar
          </button>
        ) : null}
      </div>

      {/* Filter panel */}
      {showFilters ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-[#dce8e0] bg-white p-4 shadow-[0_1px_3px_rgba(16,31,25,0.05)]">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Fecha inicio</label>
              <input
                type="date"
                value={filters.startsAt ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, startsAt: e.target.value || undefined, page: 1 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fecha fin</label>
              <input
                type="date"
                value={filters.endsAt ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, endsAt: e.target.value || undefined, page: 1 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Acción</label>
              <select
                value={filters.action ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value || undefined, page: 1 }))}
                className={inputClass}
              >
                <option value="">Todas</option>
                <option value="CREATE">Crear</option>
                <option value="UPDATE">Actualizar</option>
                <option value="DELETE">Eliminar</option>
                <option value="SUBMIT">Enviar (Medición)</option>
                <option value="REVIEW">Revisión (Medición)</option>
                <option value="APPROVE">Aprobar</option>
                <option value="REJECT">Rechazar</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Entidad</label>
              <select
                value={filters.entityType ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value || undefined, page: 1 }))}
                className={inputClass}
              >
                <option value="">Todas</option>
                <option value="Process">Proceso</option>
                <option value="Indicator">Indicador</option>
                <option value="Measurement">Medición</option>
                <option value="User">Usuario</option>
                <option value="Role">Rol</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {logs.isLoading ? (
        <div className="h-[360px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid gap-3">
            {data.data.map((entry: any) => {
              const badge = getActionBadge(entry);
              return (
                <QcCard key={entry.id} className="p-4 transition-shadow hover:shadow-[0_8px_22px_rgba(16,31,25,0.07)]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[13px] font-bold text-[#101f19]">{formatEntity(entry.entityType)}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-[#5b7267]">
                      <History className="size-3.5 text-[#9db0a5]" />
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#5b7267]">
                  <span>
                    Por <strong className="font-semibold text-[#101f19]">{entry.actor?.email || "Sistema"}</strong>
                  </span>
                  {entry.route ? (
                    <code className="text-[11px] text-[#7c9186]">{entry.route}</code>
                  ) : null}
                  {entry.ip ? <span className="text-[11px] text-[#9db0a5]">IP {entry.ip}</span> : null}
                </div>

                <AuditDiff before={entry.before} after={entry.after} />
              </QcCard>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
                disabled={(data.page ?? 1) <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-[#d8e6de] bg-white px-3 py-2 text-[12px] font-bold text-[#101f19] transition-colors hover:border-[#059669] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </button>
              <span className="text-[13px] font-semibold text-[#5b7267]">
                Página {data.page} de {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                disabled={(data.page ?? 1) >= data.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-[#d8e6de] bg-white px-3 py-2 text-[12px] font-bold text-[#101f19] transition-colors hover:border-[#059669] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <QcEmptyState
          title="Sin entradas de auditoría"
          description="Las acciones administrativas sobre procesos, indicadores y usuarios se registrarán aquí."
        />
      )}
    </QcAppShell>
  );
};
