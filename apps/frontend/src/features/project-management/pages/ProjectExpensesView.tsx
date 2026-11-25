import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Plus, Pencil, Building2, Receipt, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PmAppShell } from "../components/PmAppShell";
import { ErpPageHeader } from "../components/ErpPageHeader";
import { ErpMetricStrip, type ErpMetric } from "../components/ErpMetricStrip";
import { ErpModal } from "../components/ErpModal";
import { usePermission } from "../hooks/usePermission";
import { projectService, payablesService } from "../api";
import { PROJECT_STATUS_CONFIG, type ProjectExpense } from "../interfaces/project.types";
import type { PayablesSnapshot } from "../interfaces/payables.types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);

const input = "h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 text-[13px]";

export function ProjectExpensesView() {
  const { id } = useParams<{ id: string }>();
  const { canManagePayables } = usePermission();
  const [project, setProject] = useState<any>(null);
  const [payablesData, setPayablesData] = useState<PayablesSnapshot | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);

  // Formularios
  const [createForm, setCreateForm] = useState({
    description: "",
    amountUsd: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });
  const [editForm, setEditForm] = useState({
    description: "",
    amountUsd: "",
    expenseDate: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshAll = async () => {
    if (!id) return;
    try {
      const [exp, snap, proj] = await Promise.all([
        projectService.getExpenses(id),
        payablesService.getByProject(id).catch(() => null),
        projectService.getById(id).catch(() => null),
      ]);
      setExpenses(exp);
      if (snap) setPayablesData(snap);
      if (proj) setProject(proj);
    } catch (err) {
      console.error("Error refreshing expenses data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const amt = Number(createForm.amountUsd.replace(",", "."));
    if (isNaN(amt) || amt <= 0) {
      setFormError("El monto debe ser mayor a 0");
      return;
    }
    if (!createForm.description.trim()) {
      setFormError("La descripción es requerida");
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      await projectService.addExpense(id, {
        description: createForm.description.trim(),
        amountUsd: amt,
        expenseDate: createForm.expenseDate,
      });
      setCreateForm({
        description: "",
        amountUsd: "",
        expenseDate: new Date().toISOString().split("T")[0],
      });
      setIsCreateModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      setFormError(err.message || "Error al registrar el gasto directo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (exp: ProjectExpense) => {
    setEditingExpense(exp);
    setEditForm({
      description: exp.description,
      amountUsd: String(exp.amountUsd),
      expenseDate: new Date(exp.expenseDate).toISOString().split("T")[0],
    });
    setFormError(null);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingExpense) return;
    const amt = Number(editForm.amountUsd.replace(",", "."));
    if (isNaN(amt) || amt <= 0) {
      setFormError("El monto debe ser mayor a 0");
      return;
    }
    if (!editForm.description.trim()) {
      setFormError("La descripción es requerida");
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      await projectService.updateExpense(editingExpense.id, {
        description: editForm.description.trim(),
        amountUsd: amt,
        expenseDate: editForm.expenseDate,
      });
      setEditingExpense(null);
      await refreshAll();
    } catch (err: any) {
      setFormError(err.message || "Error al actualizar el gasto directo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const directExpenses = expenses.filter((x) => !x.obligationPaymentId);
  const directExpensesTotal = directExpenses.reduce((sum, x) => sum + Number(x.amountUsd || 0), 0);
  const incurredObligationsTotal = payablesData?.summary?.totalIncurred ?? payablesData?.summary?.totalDebt ?? 0;
  const actualCost = payablesData?.summary?.actualCost ?? (incurredObligationsTotal + directExpensesTotal);
  const totalPending = payablesData?.summary?.totalPending ?? 0;

  const metrics: ErpMetric[] = [
    {
      title: "1. Costo Real Acumulado",
      value: fmt(actualCost),
      change: `${fmt(incurredObligationsTotal)} devengado + ${fmt(directExpensesTotal)} directo`,
      rail: "bg-[#111416]",
    },
    {
      title: "2. Gastos Directos",
      value: fmt(directExpensesTotal),
      change: `${directExpenses.length} sin obligación previa (ejecutado)`,
      rail: "bg-[#5e8fc2]",
    },
    {
      title: "3. Obligaciones Incurridas",
      value: fmt(incurredObligationsTotal),
      change: `${payablesData?.items?.filter((i) => i.isIncurred !== false).length ?? 0} pasivos devengados`,
      rail: "bg-[#d9772f]",
    },
    {
      title: "4. Saldo Por Pagar",
      value: fmt(totalPending),
      change: `${payablesData?.summary?.openCount ?? 0} obligaciones pendientes`,
      rail: "bg-[#c85454]",
    },
  ];

  return (
    <PmAppShell
      active="Finanzas"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <Link
            to={`/project-management/detalle/${id}`}
            className="font-semibold text-[#858178] transition-colors hover:text-[#b9561d]"
          >
            {project?.projectCode || "Proyecto"}
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Costo Real</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow={`Finanzas / ${project?.projectCode ? `${project.projectCode} · ` : ""}Costo Real`}
        title="Costo Real del Proyecto"
        copy={
          project
            ? `${project.projectName || project.fullName || project.projectCode} — Registro y control integral de costos incurridos, pasivos devengados y gastos directos ejecutados.`
            : "Registro y control integral del costo real del proyecto."
        }
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416] sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" /> Volver
            </button>
            {canManagePayables && (
              <button
                onClick={() => {
                  setFormError(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#4c9b7a] bg-[#4c9b7a] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#3d7f63] hover:bg-[#3d7f63] sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Nuevo Gasto Directo
              </button>
            )}
          </div>
        }
      />

      {/* Tarjeta de contexto del proyecto */}
      {project && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-3.5 sm:px-5 shadow-xs">
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d9772f]/10 text-[#d9772f]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md border border-[#edb6a5] bg-[#fff0eb] px-2 py-0.5 text-[11px] font-bold text-[#a84730]">
                  {project.projectCode}
                </Badge>
                <Link
                  to={`/project-management/detalle/${id}`}
                  className="text-[15px] font-bold text-[#111416] hover:text-[#b9561d] hover:underline transition-colors"
                >
                  {project.projectName || project.fullName || project.projectCode}
                </Link>
                {project.status && (
                  <Badge
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold shadow-none ${
                      PROJECT_STATUS_CONFIG[project.status]?.badgeClass || "bg-[#ece6dc] text-[#4e5558]"
                    }`}
                  >
                    {PROJECT_STATUS_CONFIG[project.status]?.label || project.status}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-[#4e5558]">
                Empresa: <strong className="text-[#111416]">{project.company?.legalName || project.company?.name || "No especificada"}</strong>
                {project.company?.address ? ` · ${project.company.address}` : ""}
              </p>
            </div>
          </div>

          {/* Navegación rápida entre módulos financieros */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/project-management/detalle/${id}/cuentas-por-pagar`}
              className="inline-flex items-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-[10px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
            >
              Cuentas por Pagar
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </Link>
            <span className="inline-flex items-center gap-[6px] rounded-lg border border-[#4c9b7a] bg-[#edf3ec] px-3.5 py-2 text-[10px] font-bold text-[#376850]">
              Costo Real
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </span>
            <Link
              to={`/project-management/detalle/${id}/cobros`}
              className="inline-flex items-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-[10px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
            >
              Cobros
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </Link>
          </div>
        </div>
      )}

      {/* Métricas Strip */}
      <div className="mb-5">
        <ErpMetricStrip metrics={metrics} />
      </div>

      {/* Tabla de Movimientos de Costo Real */}
      <div className="overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9]">
        <div className="flex flex-col gap-2 border-b border-[#d8d0c4] bg-[#f5f0e8]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-[#111416]">Movimientos de Costo Real</h3>
            <p className="text-[12px] text-[#4e5558]">Detalle de costos directos ejecutados y pagos de obligaciones</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8d918f]">Total Directo:</span>
            <span className="text-[16px] font-bold text-[#111416] tabular-nums">{fmt(directExpensesTotal)}</span>
            <Badge variant="outline" className="rounded-md border-[#d8d0c4] bg-[#fffdf9] text-[10px] font-bold text-[#4e5558]">
              {expenses.length} Registros
            </Badge>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm font-semibold text-[#4e5558]">Cargando movimientos de costo...</p>
        ) : expenses.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#4e5558]">No hay costos ni egresos registrados para este proyecto.</p>
        ) : (
          <>
            {/* Vista Mobile: Tarjetas compactas */}
            <div className="divide-y divide-[#d8d0c4]/60 block md:hidden">
              {expenses.map((exp) => {
                const isFromObligation = Boolean(exp.obligationPaymentId);
                return (
                  <article key={exp.id} className="p-4 space-y-2.5 hover:bg-[#f5f0e8]/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-[#111416] text-[13px] leading-snug">
                        {exp.description}
                      </p>
                      {isFromObligation ? (
                        <Badge variant="outline" className="shrink-0 rounded-md border-[#d8d0c4] bg-[#f5f0e8] text-[10px] font-semibold text-[#4e5558]">
                          Obligación
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 rounded-md border-[#a7c9b4] bg-[#edf3ec] text-[10px] font-semibold text-[#376850]">
                          Directo
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#8d918f] font-medium">
                        {new Date(exp.expenseDate).toLocaleDateString("es-AR")}
                      </span>
                      <span className="text-[15px] font-black tabular-nums text-[#111416]">
                        {fmt(Number(exp.amountUsd))}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      {isFromObligation ? (
                        <Link
                          to={`/project-management/detalle/${id}/cuentas-por-pagar`}
                          className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] py-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:bg-[#fff0eb]"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Ver en Cuentas por Pagar
                        </Link>
                      ) : (
                        canManagePayables && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(exp)}
                            className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] py-2 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#b9561d] hover:bg-[#fff0eb]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar Gasto Directo
                          </button>
                        )
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Vista Desktop / Tablet: Tabla completa con scroll horizontal protegido */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#d8d0c4] bg-[#faf7f2] text-[10px] font-bold uppercase tracking-[0.08em] text-[#4e5558]">
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Tipo / Origen</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Monto (USD)</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d0c4]/60 text-[12px]">
                  {expenses.map((exp) => {
                    const isFromObligation = Boolean(exp.obligationPaymentId);
                    return (
                      <tr key={exp.id} className="transition-colors hover:bg-[#f5f0e8]/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#111416]">{exp.description}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isFromObligation ? (
                            <Badge variant="outline" className="rounded-md border-[#d8d0c4] bg-[#f5f0e8] text-[10px] font-semibold text-[#4e5558]">
                              Pago de obligación
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-md border-[#a7c9b4] bg-[#edf3ec] text-[10px] font-semibold text-[#376850]">
                              Gasto directo
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#4e5558]">
                          {new Date(exp.expenseDate).toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-[#111416] whitespace-nowrap">
                          {fmt(Number(exp.amountUsd))}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isFromObligation ? (
                            <Link
                              to={`/project-management/detalle/${id}/cuentas-por-pagar`}
                              title="Ver en Cuentas por Pagar"
                              className="inline-flex items-center gap-1 rounded-md border border-[#d8d0c4] bg-[#fffdf9] px-2.5 py-1 text-[11px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:bg-[#fff0eb]"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Ver en Cuentas por Pagar
                            </Link>
                          ) : (
                            canManagePayables && (
                              <button
                                type="button"
                                title="Editar gasto directo"
                                onClick={() => handleOpenEdit(exp)}
                                className="inline-flex items-center gap-1 rounded-md border border-[#d8d0c4] bg-[#fffdf9] px-2.5 py-1 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#b9561d] hover:bg-[#fff0eb]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Registrar Gasto Directo */}
      <ErpModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        eyebrow="Finanzas / Costo Real"
        title="Registrar Gasto Directo"
        description="Registra un costo incurrido directamente en obra sin una obligación previa."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCreateExpense}
              className="w-full rounded-lg bg-[#4c9b7a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3d7f63] disabled:opacity-50 sm:w-auto"
            >
              Registrar Costo
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-2.5 text-[12px] font-semibold text-[#a84730]">
              {formError}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Descripción del Gasto Directo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Combustible generador, alquiler de grúa..."
              className={input}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Monto Incurrido (USD) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              className={input}
              value={createForm.amountUsd}
              onChange={(e) => setCreateForm({ ...createForm, amountUsd: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Fecha del Gasto *</label>
            <input
              type="date"
              required
              className={input}
              value={createForm.expenseDate}
              onChange={(e) => setCreateForm({ ...createForm, expenseDate: e.target.value })}
            />
          </div>
        </form>
      </ErpModal>

      {/* Modal Editar Gasto Directo */}
      <ErpModal
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        eyebrow="Finanzas / Modificar Costo"
        title="Editar Gasto Directo"
        description="Modifica los datos del gasto directo previamente registrado."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setEditingExpense(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleUpdateExpense}
              className="w-full rounded-lg bg-[#b9561d] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#964314] disabled:opacity-50 sm:w-auto"
            >
              Guardar Cambios
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateExpense} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-2.5 text-[12px] font-semibold text-[#a84730]">
              {formError}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Descripción del Gasto Directo *</label>
            <input
              type="text"
              required
              className={input}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Monto Incurrido (USD) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              className={input}
              value={editForm.amountUsd}
              onChange={(e) => setEditForm({ ...editForm, amountUsd: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Fecha del Gasto *</label>
            <input
              type="date"
              required
              className={input}
              value={editForm.expenseDate}
              onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })}
            />
          </div>
        </form>
      </ErpModal>
    </PmAppShell>
  );
}
