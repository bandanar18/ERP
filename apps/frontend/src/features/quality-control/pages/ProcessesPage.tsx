import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Boxes, ChevronRight, FolderOpen, LayoutGrid, Loader2, Plus, Pencil, Table2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type CreateProcessPayload, type UpdateProcessPayload } from "../api/admin.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader, QcPrimaryButton, QcSecondaryButton } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";
import { QcPagination } from "../components/QcPagination";
import type { QcAdminProcess } from "../types";
import { cn } from "@/lib/utils";

/* ============================================================================
   Modal crear / editar proceso
============================================================================ */
function ProcessDialog({
  open,
  onClose,
  process,
  processes,
}: {
  open: boolean;
  onClose: () => void;
  process: QcAdminProcess | null;
  processes: QcAdminProcess[];
}) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState(process?.code ?? "");
  const [name, setName] = useState(process?.name ?? "");
  const [parentId, setParentId] = useState<string>(process?.parentId ?? "");
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = process?.id ?? "new";
  if (open && key !== lastKey) {
    setLastKey(key);
    setCode(process?.code ?? "");
    setName(process?.name ?? "");
    setParentId(process?.parentId ?? "");
    setError(null);
  }

  const parentOptions = processes.filter((p) => p.id !== process?.id);

  const mutation = useMutation({
    mutationFn: () =>
      process
        ? adminApi.updateProcess(process.id, {
            ...(code !== process.code ? { code } : {}),
            ...(name !== process.name ? { name } : {}),
            ...(parentId !== (process.parentId ?? "") ? { parentId: parentId || null } : {}),
          } satisfies UpdateProcessPayload)
        : adminApi.createProcess({ code, name, parentId: parentId || null } satisfies CreateProcessPayload),
    onSuccess: () => {
      toast.success(process ? "Proceso actualizado" : "Proceso creado");
      queryClient.invalidateQueries({ queryKey: ["qc-admin-processes"] });
      queryClient.invalidateQueries({ queryKey: ["qc-processes"] });
      onClose();
    },
    onError: (error: Error) => setError(error.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101f19]">{process ? "Editar proceso" : "Nuevo proceso"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!code.trim() || !name.trim()) {
              setError("Código y nombre son obligatorios");
              return;
            }
            if (parentId === process?.id) {
              setError("Un proceso no puede ser su propio padre");
              return;
            }
            mutation.mutate();
          }}
          className="grid gap-4"
        >
          <div>
            <label htmlFor="qc-p-code" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
              Código
            </label>
            <input
              id="qc-p-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
              placeholder="Ej: COM"
              required
              className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] uppercase outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
            />
          </div>
          <div>
            <label htmlFor="qc-p-name" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
              Nombre
            </label>
            <input
              id="qc-p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Comercial"
              required
              className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
            />
          </div>
          <div>
            <label htmlFor="qc-p-parent" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
              Proceso padre <span className="font-normal text-[#9db0a5]">(opcional)</span>
            </label>
            <select
              id="qc-p-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
            >
              <option value="">Sin padre (proceso raíz)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2.5 border-t border-[#eef4f0] pt-4 sm:flex-row sm:justify-end">
            <QcSecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </QcSecondaryButton>
            <QcPrimaryButton type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {process ? "Guardar cambios" : "Crear proceso"}
            </QcPrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
   Fila de proceso con subprocesos (recursiva)
============================================================================ */
function ProcessRow({
  process,
  depth,
  onEdit,
}: {
  process: QcAdminProcess;
  depth: number;
  onEdit: (process: QcAdminProcess) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const children = process.children ?? [];
  const indicatorCount = process.qc_indicators?.length ?? 0;
  const hasChildren = children.length > 0;

  return (
    <div>
      <div          className={cn(
          "group flex items-center gap-2 px-3 py-3 transition-colors hover:bg-[#f7fcf9] sm:gap-2.5 sm:px-4",
          depth > 0 && "border-l-2 border-[#dce8e0]"
        )}
        style={{ paddingLeft: `calc(${depth * 12}px + 12px)` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          disabled={!hasChildren}
          aria-label={expanded ? "Contraer" : "Expandir"}
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md text-[#7c9186] transition-colors",
            hasChildren ? "hover:bg-[#ecfdf5] hover:text-[#047857]" : "opacity-30"
          )}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
        <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">{process.code}</span>
        <span className="min-w-0 truncate text-[13px] font-semibold text-[#101f19]">{process.name}</span>
        {indicatorCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e6de] bg-white px-2 py-0.5 text-[10px] font-bold text-[#5b7267]">
            <Boxes className="size-3 text-[#047857]" />
            {indicatorCount} {indicatorCount === 1 ? "indicador" : "indicadores"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(process)}
          aria-label={`Editar ${process.name}`}
          className="ml-auto grid size-7 shrink-0 place-items-center rounded-lg text-[#9db0a5] opacity-0 transition-opacity hover:bg-[#ecfdf5] hover:text-[#047857] group-hover:opacity-100"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      {expanded && hasChildren
        ? children.map((child) => <ProcessRow key={child.id} process={child} depth={depth + 1} onEdit={onEdit} />)
        : null}
    </div>
  );
}

/* ============================================================================
   Página: estructura de procesos (solo QC_ADMIN)
============================================================================ */
const PAGE_SIZE = 9;

export const ProcessesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QcAdminProcess | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table" | "cards">(
    () =>
      typeof window !== "undefined" && window.localStorage.getItem("qc-processes-view") === "cards"
        ? "cards"
        : "table"
  );

  const processes = useQuery({ queryKey: ["qc-admin-processes"], queryFn: adminApi.listProcesses });

  const rootProcesses = useMemo(() => processes.data ?? [], [processes.data]);

  // Reiniciar la página si cambia la cantidad de procesos raíz.
  useEffect(() => {
    setPage(1);
  }, [rootProcesses.length]);

  const pagedRoots = useMemo(
    () => rootProcesses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rootProcesses, page]
  );

  const changeView = (next: "table" | "cards") => {
    setView(next);
    try {
      window.localStorage.setItem("qc-processes-view", next);
    } catch {
      /* noop */
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const handleEdit = (process: QcAdminProcess) => {
    setEditing(process);
    setDialogOpen(true);
  };

  return (
    <QcAppShell active="Procesos" crumb={<>Inicio / <strong>Procesos</strong></>}>
      <QcPageHeader
        title="Estructura de procesos"
        subtitle="Jerarquía de procesos y subprocesos del sistema de gestión de calidad"
        actions={
          <QcPrimaryButton onClick={handleCreate}>
            <Plus className="size-4" />
            Nuevo proceso
          </QcPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12px] font-semibold text-[#7c9186]">
          {rootProcesses.length} {rootProcesses.length === 1 ? "proceso raíz" : "procesos raíz"}
        </span>
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
      </div>

      {processes.isLoading ? (
        <div className="h-[360px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : rootProcesses.length > 0 ? (
        <>
          {view === "table" ? (
            <QcCard className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-[#eef4f0] bg-[#f7faf8] px-4 py-3">
              <FolderOpen className="size-4 text-[#047857]" />
              <span className="text-[12px] font-bold text-[#101f19]">Procesos ({rootProcesses.length})</span>
            </div>
            <div className="divide-y divide-[#eef4f0]">
              {pagedRoots.map((process) => (
                <ProcessRow key={process.id} process={process} depth={0} onEdit={handleEdit} />
              ))}
            </div>
          </QcCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pagedRoots.map((process) => {
              const childCount = process.children?.length ?? 0;
              const indicatorCount = process.qc_indicators?.length ?? 0;
              return (
                <QcCard key={process.id} className="relative flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
                  <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#047857] via-[#10b981] to-[#34d399]" />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                        {process.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(process)}
                        title={`Editar ${process.name}`}
                        aria-label={`Editar ${process.name}`}
                        className="grid size-8 place-items-center rounded-lg border border-[#d8e6de] bg-white text-[#047857] transition-colors hover:border-[#059669] hover:bg-[#f0faf5]"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                    <span className="mt-2 block truncate text-[13px] font-semibold text-[#101f19]">{process.name}</span>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e6de] bg-white px-2 py-0.5 text-[10px] font-bold text-[#5b7267]">
                        <ChevronRight className="size-3 text-[#047857]" />
                        {childCount} {childCount === 1 ? "subproceso" : "subprocesos"}
                      </span>
                      {indicatorCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e6de] bg-white px-2 py-0.5 text-[10px] font-bold text-[#5b7267]">
                          <Boxes className="size-3 text-[#047857]" />
                          {indicatorCount} {indicatorCount === 1 ? "indicador" : "indicadores"}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1 border-t border-[#eef4f0] pt-3">
                      {(process.children ?? []).slice(0, 5).map((child) => (
                        <span
                          key={child.id}
                          className="rounded bg-[#f2f7f4] px-1.5 py-0.5 text-[10px] font-bold text-[#5b7267]"
                        >
                          {child.code}
                        </span>
                      ))}
                      {childCount === 0 ? (
                        <span className="text-[10px] font-medium text-[#9db0a5]">Sin subprocesos</span>
                      ) : childCount > 5 ? (
                        <span className="text-[10px] font-bold text-[#9db0a5]">+{childCount - 5} más</span>
                      ) : null}
                    </div>
                  </div>
                </QcCard>
              );
            })}
          </div>
          )}
          <div className="mt-3 overflow-hidden rounded-xl border border-[#dce8e0] bg-white">
            <QcPagination page={page} pageSize={PAGE_SIZE} total={rootProcesses.length} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <QcEmptyState
          title="Sin procesos"
          description="Crea el primer proceso para comenzar a estructurar el sistema de gestión."
          action={
            <QcPrimaryButton onClick={handleCreate}>
              <Plus className="size-4" />
              Nuevo proceso
            </QcPrimaryButton>
          }
        />
      )}

      <ProcessDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        process={editing}
        processes={rootProcesses}
      />
    </QcAppShell>
  );
};
