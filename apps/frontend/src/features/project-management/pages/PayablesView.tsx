import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Building2, RotateCcw, ArrowUpRight, Banknote, CheckCircle2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PmAppShell } from "../components/PmAppShell";
import { ErpPageHeader } from "../components/ErpPageHeader";
import { ErpMetricStrip, type ErpMetric } from "../components/ErpMetricStrip";
import { ErpModal } from "../components/ErpModal";
import { FinancialReportModal } from "../components/FinancialReportModal";
import { usePermission } from "../hooks/usePermission";
import { payablesService, projectService } from "../api";
import type { PayablesSnapshot, ObligationStatus } from "../interfaces/payables.types";
import { PROJECT_STATUS_CONFIG, type ProjectExpense, type ProjectCollection } from "../interfaces/project.types";

const STATUS_STYLE: Record<ObligationStatus, string> = {
  PENDIENTE: "bg-[#fff0eb] text-[#a84730] border-[#edb6a5]",
  PARCIAL: "bg-[#fdf4dc] text-[#8a6a12] border-[#e6d28f]",
  PAGADO: "bg-[#edf3ec] text-[#376850] border-[#a7c9b4]",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);

const input = "h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 text-[13px]";

export function PayablesView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManagePayables, canPrintFinancialReport } = usePermission();
  const [project, setProject] = useState<any>(null);
  const [data, setData] = useState<PayablesSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Modal de pago parcial / abono
  const [partialPayModal, setPartialPayModal] = useState<{ id: string; description: string; pendingUsd: number } | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialNote, setPartialNote] = useState("");
  const [partialError, setPartialError] = useState<string | null>(null);

  // Modal para Reconocer como Costo Incurrido
  const [recognizeModal, setRecognizeModal] = useState<PayablesSnapshot["items"][number] | null>(null);
  const [recognizeIncurredAt, setRecognizeIncurredAt] = useState(new Date().toISOString().split("T")[0]);
  const [recognizeSupport, setRecognizeSupport] = useState("");
  const [recognizeNote, setRecognizeNote] = useState("");
  const [recognizeError, setRecognizeError] = useState<string | null>(null);

  // Métricas financieras auxiliares (gastos y cobros)
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [collections, setCollections] = useState<ProjectCollection[]>([]);

  // Modales de historial y confirmación (sin alerts/confirms nativos)
  const [historyModalObligation, setHistoryModalObligation] = useState<PayablesSnapshot["items"][number] | null>(null);
  const [confirmUncheckObligation, setConfirmUncheckObligation] = useState<PayablesSnapshot["items"][number] | null>(null);
  const [multiPaymentWarningObligation, setMultiPaymentWarningObligation] = useState<PayablesSnapshot["items"][number] | null>(null);
  const [confirmRevertPayment, setConfirmRevertPayment] = useState<{ obligationId: string; paymentId: string; amount: number; description?: string } | null>(null);

  const refreshAll = async () => {
    if (!id) return;
    try {
      const [snap, exp, col, proj] = await Promise.all([
        payablesService.getByProject(id),
        projectService.getExpenses(id),
        projectService.getCollections(id),
        projectService.getById(id).catch(() => null),
      ]);
      setData(snap);
      setExpenses(exp);
      setCollections(col);
      if (proj) setProject(proj);
      if (snap && historyModalObligation) {
        const current = snap.items.find((item) => item.id === historyModalObligation.id);
        if (current) setHistoryModalObligation(current);
      }
    } catch (err) {
      console.error("Error refreshing financial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [id]);

  // Toda mutación corre y luego actualiza todos los datos financieros reactivamente
  const run = async (key: string, fn: () => Promise<any>) => {
    try {
      setBusyId(key);
      await fn();
      await refreshAll();
    } catch {
      /* apiFetch ya muestra el toast */
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleChecklist = (o: PayablesSnapshot["items"][number], isChecked: boolean) => {
    if (!canManagePayables || busyId === o.id) return;
    if (!isChecked && o.payments && o.payments.length > 1) {
      setMultiPaymentWarningObligation(o);
      return;
    }
    if (!isChecked && o.payments && o.payments.length === 1) {
      setConfirmUncheckObligation(o);
      return;
    }
    run(o.id, () => payablesService.setPaid(o.id, isChecked));
  };

  const handleConfirmUncheck = async () => {
    if (!confirmUncheckObligation) return;
    const obl = confirmUncheckObligation;
    setConfirmUncheckObligation(null);
    await run(obl.id, () => payablesService.setPaid(obl.id, false));
  };

  const handleConfirmRevertPayment = async () => {
    if (!confirmRevertPayment) return;
    const { obligationId, paymentId } = confirmRevertPayment;
    setConfirmRevertPayment(null);
    await run(obligationId, () => payablesService.revertPayment(paymentId));
    setHistoryModalObligation(null);
  };

  const openPartialPay = (o: PayablesSnapshot["items"][number]) => {
    setPartialPayModal({ id: o.id, description: o.description, pendingUsd: o.pendingUsd });
    setPartialAmount(String(o.pendingUsd));
    setPartialNote("");
    setPartialError(null);
  };

  const handleSavePartialPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partialPayModal) return;
    const amount = Number(partialAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      setPartialError("El monto debe ser mayor a 0");
      return;
    }
    if (amount > partialPayModal.pendingUsd) {
      setPartialError(`El pago no puede superar el monto por pagar (${fmt(partialPayModal.pendingUsd)})`);
      return;
    }

    await run(partialPayModal.id, () => payablesService.pay(partialPayModal.id, amount, partialNote || undefined));
    setPartialPayModal(null);
  };

  const openRecognizeModal = (o: PayablesSnapshot["items"][number]) => {
    setRecognizeModal(o);
    setRecognizeIncurredAt(new Date().toISOString().split("T")[0]);
    setRecognizeSupport(o.supportDocument || "");
    setRecognizeNote("");
    setRecognizeError(null);
  };

  const handleConfirmRecognize = async () => {
    if (!recognizeModal) return;
    try {
      setRecognizeError(null);
      await run(recognizeModal.id, () =>
        payablesService.recognize(recognizeModal.id, {
          isIncurred: true,
          incurredAt: recognizeIncurredAt,
          supportDocument: recognizeSupport.trim() || undefined,
          note: recognizeNote.trim() || undefined,
        })
      );
      setRecognizeModal(null);
    } catch (err: any) {
      setRecognizeError(err.message || "Error al reconocer la obligación");
    }
  };

  const s = data?.summary;

  const directExpenses = expenses.filter((x) => !x.obligationPaymentId);
  const directExpensesTotal = directExpenses.reduce((sum, x) => sum + Number(x.amountUsd || 0), 0);
  const totalCollections = collections.reduce((sum, x) => sum + Number(x.amountUsd || 0), 0);

  // Costo Real según Devengado: Obligaciones incurridas reconocidas + Gastos directos no vinculados a obligaciones
  const actualCost = s?.actualCost ?? ((s?.totalIncurred ?? s?.totalDebt ?? 0) + directExpensesTotal);
  const futureCommitments = data?.items.filter((i) => i.isIncurred === false) ?? [];

  const metrics: ErpMetric[] = [
    {
      title: "Costo Real Acumulado",
      value: fmt(actualCost),
      change: `${fmt(s?.totalIncurred ?? 0)} devengado + ${fmt(directExpensesTotal)} directo`,
      rail: "bg-[#b9561d]",
    },
    {
      title: "Total Cobrado (Neto)",
      value: fmt(totalCollections),
      change: `${collections.length} cobros netos en banco`,
      rail: "bg-[#376850]",
    },
    {
      title: "Deuda Comprometida",
      value: fmt(s?.totalDebt ?? 0),
      change: `${s?.totalCount ?? 0} oblig. (${futureCommitments.length} compromisos)`,
      rail: "bg-[#111416]",
    },
    {
      title: "Total Por Pagar",
      value: fmt(s?.totalPending ?? 0),
      change: `${s?.openCount ?? 0} pendientes`,
      rail: "bg-[#c85454]",
    },
  ];

  const sortedObligations = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items].sort((a, b) => {
      // Prioridad 1: Pendientes y Parciales (con saldo pendiente / botón Abonar) siempre arriba
      const aPending = a.status !== "PAGADO";
      const bPending = b.status !== "PAGADO";
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // Prioridad 2: Si ambas están pendientes, PARCIAL (abonos activos) primero
      if (aPending && bPending) {
        if (a.status === "PARCIAL" && b.status === "PENDIENTE") return -1;
        if (a.status === "PENDIENTE" && b.status === "PARCIAL") return 1;
      }

      // Prioridad 3: Más recientes primero
      const dateA = new Date(a.incurredAt || a.dueDate || 0).getTime();
      const dateB = new Date(b.incurredAt || b.dueDate || 0).getTime();
      return dateB - dateA;
    });
  }, [data?.items]);

  // Paginación de obligaciones
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedObligations.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentObligations = useMemo(() => {
    return sortedObligations.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedObligations, indexOfFirstItem, indexOfLastItem]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
          <strong className="text-[#111416]">Administración Financiera</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow={`Finanzas / ${project?.projectCode ? `${project.projectCode} · ` : ""}Control de Cuentas`}
        title="Administración Financiera"
        copy={
          project
            ? `${project.projectName || project.fullName || project.projectCode} • ${project.company?.legalName || project.company?.name || "Empresa cliente"} — Gestión integral de anticipos, costos reales, cobros y cuentas por pagar.`
            : "Gestión integral de anticipos, costos reales, cobros y cuentas por pagar del proyecto."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
            >
              <ChevronLeft className="h-4 w-4" /> Volver
            </button>
            {canPrintFinancialReport && (
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 text-[11px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416] shadow-2xs"
                title="Generar e imprimir reporte de pagos y deudas de este proyecto"
              >
                <Printer className="h-4 w-4" /> Imprimir Reporte
              </button>
            )}
            {canManagePayables && (
              <button
                onClick={() => navigate(`/project-management/detalle/${id}/crear-obligacion`)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#4c9b7a] bg-[#4c9b7a] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#3d7f63] hover:bg-[#3d7f63]"
              >
                <Plus className="h-4 w-4" /> Nueva obligación
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
            <span className="inline-flex items-center gap-[6px] rounded-lg border border-[#4c9b7a] bg-[#edf3ec] px-3.5 py-2 text-[10px] font-bold text-[#376850]">
              Cuentas por Pagar
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </span>
            <Link
              to={`/project-management/detalle/${id}/costo-real`}
              className="inline-flex items-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-[10px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
            >
              Costo Real
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </Link>
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

      <ErpMetricStrip metrics={metrics} />

      {/* Sección 2: Cuentas por Pagar (Obligaciones y Desembolsos) */}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9]">
        <div className="flex flex-col gap-2 border-b border-[#d8d0c4] bg-[#f5f0e8]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[14px] font-bold text-[#111416]">Cuentas por Pagar (Obligaciones)</div>
            <p className="text-[12px] text-[#4e5558]">
              Checklist de obligaciones operativas. Marca con el checklist al completar el desembolso total.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8d918f]">Por Pagar:</span>
            <span className="text-[16px] font-bold text-[#c85454] tabular-nums">{fmt(s?.totalPending ?? 0)}</span>
            <Badge variant="outline" className="rounded-md border-[#d8d0c4] bg-[#fffdf9] text-[10px] font-bold text-[#4e5558]">
              {s?.openCount ?? 0} {s?.openCount === 1 ? "pendiente" : "pendientes"}
            </Badge>
          </div>
        </div>
        {loading ? (
          <p className="p-6 text-center text-sm text-[#4e5558]">Cargando...</p>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#4e5558]">No hay obligaciones registradas.</p>
        ) : (
          <ul className="divide-y divide-[#d8d0c4]/60">
            {currentObligations.map((o) => (
              <li key={o.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-[220px] flex-1">
                    {/* Checklist reactivo con protección */}
                    <input
                      type="checkbox"
                      aria-label={`Marcar "${o.description}" como pagada`}
                      className="mt-1 h-5 w-5 accent-[#4c9b7a] cursor-pointer disabled:cursor-not-allowed shrink-0"
                      checked={o.status === "PAGADO"}
                      disabled={!canManagePayables || busyId === o.id}
                      onChange={(e) => handleToggleChecklist(o, e.target.checked)}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-[13px] font-bold ${
                            o.status === "PAGADO" ? "text-[#8d918f] line-through" : "text-[#111416]"
                          }`}
                        >
                          {o.description}
                        </p>
                        {o.isIncurred === false ? (
                          <span className="inline-flex items-center rounded-md border border-[#edb6a5] bg-[#fff0eb] px-1.5 py-0.2 text-[10px] font-bold text-[#b9561d]">
                            Compromiso Futuro
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-[#a7c9b4] bg-[#edf3ec] px-1.5 py-0.2 text-[10px] font-bold text-[#376850]">
                            Costo Incurrido
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#4e5558]">
                        <span className="font-semibold text-[#111416]">{o.category}</span>
                        {o.supplier ? ` · ${o.supplier}` : ""}
                        {o.invoiceNumber ? ` · Fact. ${o.invoiceNumber}` : ""}
                        {o.supportDocument ? ` · Soporte: ${o.supportDocument}` : ""}
                        {o.incurredAt ? ` · Devengado: ${new Date(o.incurredAt).toLocaleDateString("es-AR")}` : ""}
                        {o.dueDate ? ` · Vence ${new Date(o.dueDate).toLocaleDateString("es-AR")}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[13px] font-bold tabular-nums text-[#111416]">{fmt(o.amountUsd)}</p>
                      <p className="text-[11px] text-[#8d918f]">
                        Por Pagar: <strong className="text-[#c85454]">{fmt(o.pendingUsd)}</strong>
                      </p>
                    </div>
                    <Badge variant="outline" className={`rounded-md text-[10px] font-bold ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </Badge>
                    {canManagePayables && o.isIncurred === false && (
                      <button
                        type="button"
                        onClick={() => openRecognizeModal(o)}
                        disabled={busyId === o.id}
                        className="inline-flex items-center gap-1 rounded-md border border-[#4c9b7a] bg-[#edf3ec] px-2.5 py-1 text-[11px] font-bold text-[#376850] hover:bg-[#dcead9] transition-colors"
                        title="Reconocer como ejecutado para sumar al Costo Real"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marcar como ejecutado
                      </button>
                    )}
                    {canManagePayables && o.status !== "PAGADO" && (
                      <button
                        type="button"
                        onClick={() => openPartialPay(o)}
                        className="rounded-md border border-[#d8d0c4] bg-[#f5f0e8] px-2.5 py-1 text-[11px] font-bold text-[#4e5558] hover:bg-[#ece6dc] transition-colors"
                      >
                        Abonar
                      </button>
                    )}
                  </div>
                </div>

                {/* Enlace a modal informativo de abonos */}
                {o.payments && o.payments.length > 0 && (
                  <div className="pl-8 pt-1">
                    <button
                      type="button"
                      onClick={() => setHistoryModalObligation(o)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#b9561d] hover:underline"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      Historial de abonos ({o.payments.length})
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Paginación de obligaciones */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between border-t border-[#d8d0c4] bg-[#f5f0e8]/60 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4e5558]">
              Página <span className="text-[#111416]">{currentPage}</span> de <span className="text-[#111416]">{totalPages}</span>
              <span className="ml-2 font-normal text-[#8d918f]">({sortedObligations.length} obligaciones)</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-1.5 text-[#4e5558] transition-colors hover:border-[#d9772f] hover:text-[#b9561d] disabled:opacity-30 disabled:hover:border-[#d8d0c4] disabled:hover:text-[#4e5558]"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePageChange(i + 1)}
                    className={`h-7 w-7 rounded-md text-xs font-bold transition-all ${
                      currentPage === i + 1
                        ? "bg-[#d9772f] text-white shadow-xs"
                        : "text-[#4e5558] border border-transparent hover:border-[#d8d0c4] hover:bg-[#fffdf9] hover:text-[#111416]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-[#d8d0c4] bg-[#fffdf9] p-1.5 text-[#4e5558] transition-colors hover:border-[#d9772f] hover:text-[#b9561d] disabled:opacity-30 disabled:hover:border-[#d8d0c4] disabled:hover:text-[#4e5558]"
                aria-label="Página siguiente"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Modal para Pago Parcial / Abono */}
      <ErpModal
        open={!!partialPayModal}
        onOpenChange={(open) => !open && setPartialPayModal(null)}
        eyebrow="Finanzas / Desembolso"
        title="Registrar Abono"
        description={partialPayModal ? `Abonar a la obligación: "${partialPayModal.description}"` : ""}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPartialPayModal(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSavePartialPay}
              className="w-full rounded-lg bg-[#4c9b7a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3d7f63] sm:w-auto"
            >
              Registrar Pago
            </button>
          </>
        }
      >
        <form onSubmit={handleSavePartialPay} className="space-y-4">
          {partialError && (
            <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-2.5 text-[12px] font-semibold text-[#a84730]">
              {partialError}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">
              Monto a Abonar (Por pagar: {partialPayModal ? fmt(partialPayModal.pendingUsd) : 0})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              className={input}
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Nota / Referencia (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Transferencia bancaria #4819"
              className={input}
              value={partialNote}
              onChange={(e) => setPartialNote(e.target.value)}
            />
          </div>
        </form>
      </ErpModal>

      {/* Modal Reconocer como Costo Incurrido */}
      <ErpModal
        open={!!recognizeModal}
        onOpenChange={(open) => !open && setRecognizeModal(null)}
        eyebrow="Finanzas / Devengado"
        title="Reconocer como Costo Incurrido"
        description={
          recognizeModal
            ? `Obligación: "${recognizeModal.description}" — Monto: ${fmt(recognizeModal.amountUsd)}`
            : ""
        }
        maxWidth="max-w-[500px]"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setRecognizeModal(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busyId === recognizeModal?.id}
              onClick={handleConfirmRecognize}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#4c9b7a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3d7f63] disabled:opacity-50 sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4" /> Reconocer Costo
            </button>
          </div>
        }
      >
        <div className="space-y-3.5">
          {recognizeError && (
            <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-2.5 text-[12px] font-semibold text-[#a84730]">
              {recognizeError}
            </div>
          )}

          <div className="rounded-lg border border-[#376850]/20 bg-[#edf3ec]/50 p-3 text-[12px] text-[#376850]">
            <p className="font-semibold">
              Al reconocer esta obligación como ejecutada, sumará{" "}
              <strong>{recognizeModal ? fmt(recognizeModal.amountUsd) : "$ 0,00"}</strong> al Costo Real del proyecto.
            </p>
            <p className="mt-1 text-[11px] text-[#4e5558]">
              El saldo pendiente de pago no se altera.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">
              Fecha de Ejecución<span className="text-[#c85454]">*</span>
            </label>
            <input
              type="date"
              required
              className={input}
              value={recognizeIncurredAt}
              onChange={(e) => setRecognizeIncurredAt(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Documento / Respaldo</label>
            <input
              type="text"
              placeholder="Ej: Acta de recepción, Remito #4819"
              className={input}
              value={recognizeSupport}
              onChange={(e) => setRecognizeSupport(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#111416]">Observación (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Servicio ejecutado conforme a contrato durante el mes"
              className={input}
              value={recognizeNote}
              onChange={(e) => setRecognizeNote(e.target.value)}
            />
          </div>
        </div>
      </ErpModal>

      {/* Modal Informativo: Historial de Abonos */}
      <ErpModal
        open={!!historyModalObligation}
        onOpenChange={(open) => !open && setHistoryModalObligation(null)}
        eyebrow="Finanzas / Trazabilidad de Pagos"
        title="Historial de Abonos"
        description="Detalle consolidado de liquidaciones y pagos aplicados a la obligación."
        maxWidth="max-w-[560px]"
        footer={
          <button
            type="button"
            onClick={() => setHistoryModalObligation(null)}
            className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
          >
            Cerrar
          </button>
        }
      >
        {historyModalObligation && (
          <div className="space-y-4">
            {/* Tarjeta de resumen de la obligación */}
            <div className="rounded-xl border border-[#d8d0c4] bg-[#faf7f2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[14px] font-bold text-[#111416]">
                  {historyModalObligation.description}
                </span>
                <Badge variant="outline" className={`rounded-md text-[10px] font-bold ${STATUS_STYLE[historyModalObligation.status]}`}>
                  {historyModalObligation.status}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#4e5558]">
                <span>Categoría: <strong className="text-[#111416]">{historyModalObligation.category}</strong></span>
                {historyModalObligation.supplier && (
                  <span>· Proveedor: <strong className="text-[#111416]">{historyModalObligation.supplier}</strong></span>
                )}
                {historyModalObligation.invoiceNumber && (
                  <span>· Factura: <strong className="text-[#111416]">{historyModalObligation.invoiceNumber}</strong></span>
                )}
              </div>

              {/* Strip de valores financieros */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#d8d0c4]/60 pt-3 text-center">
                <div className="rounded-lg bg-white p-2 border border-[#d8d0c4]/40">
                  <p className="text-[10px] font-semibold uppercase text-[#8d918f]">Total</p>
                  <p className="text-[13px] font-bold text-[#111416] tabular-nums">
                    {fmt(historyModalObligation.amountUsd)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-[#d8d0c4]/40">
                  <p className="text-[10px] font-semibold uppercase text-[#376850]">Pagado</p>
                  <p className="text-[13px] font-bold text-[#376850] tabular-nums">
                    {fmt(historyModalObligation.paidUsd)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-[#d8d0c4]/40">
                  <p className="text-[10px] font-semibold uppercase text-[#c85454]">Por Pagar</p>
                  <p className="text-[13px] font-bold text-[#c85454] tabular-nums">
                    {fmt(historyModalObligation.pendingUsd)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de abonos */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#4e5558]">
                  Abonos y Pagos Realizados
                </h4>
                <span className="text-[11px] font-semibold text-[#8d918f]">
                  {historyModalObligation.payments?.length || 0} movimientos
                </span>
              </div>

              {(!historyModalObligation.payments || historyModalObligation.payments.length === 0) ? (
                <p className="rounded-lg border border-[#d8d0c4] bg-white p-4 text-center text-[12px] text-[#4e5558]">
                  No hay abonos registrados para esta obligación.
                </p>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {historyModalObligation.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-[#d8d0c4] bg-white p-3 text-[12px]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111416] tabular-nums">{fmt(p.amountUsd)}</span>
                          <span className="text-[11px] text-[#8d918f]">
                            ({new Date(p.paidAt).toLocaleDateString("es-AR")})
                          </span>
                        </div>
                        {p.note && (
                          <p className="mt-0.5 text-[11px] text-[#4e5558]">
                            Nota / Ref: {p.note}
                          </p>
                        )}
                      </div>
                      {canManagePayables && (
                        <button
                          type="button"
                          title="Anular este abono (reabre el saldo por pagar)"
                          onClick={() => setConfirmRevertPayment({
                            obligationId: historyModalObligation.id,
                            paymentId: p.id,
                            amount: p.amountUsd,
                            description: historyModalObligation.description
                          })}
                          className="inline-flex items-center gap-1 rounded-md border border-[#edb6a5] bg-[#fff0eb] px-2.5 py-1 text-[11px] font-bold text-[#c85454] transition-colors hover:bg-[#c85454] hover:text-white"
                        >
                          <RotateCcw className="h-3 w-3" /> Anular abono
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ErpModal>

      {/* Modal Confirmar Reabrir Obligación (Checklist uncheck con 1 pago) */}
      <ErpModal
        open={!!confirmUncheckObligation}
        onOpenChange={(open) => !open && setConfirmUncheckObligation(null)}
        eyebrow="Finanzas / Modificar Estado"
        title="Reabrir Saldo de Obligación"
        description="¿Deseas anular el pago de esta obligación y reabrir su saldo pendiente? El saldo por pagar se restaurará automáticamente a su valor original."
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmUncheckObligation(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmUncheck}
              className="w-full rounded-lg bg-[#c85454] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#a84730] sm:w-auto"
            >
              Anular Pago y Reabrir
            </button>
          </>
        }
      >
        {confirmUncheckObligation && (
          <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-[12px] text-[#a84730]">
            <p className="font-bold">{confirmUncheckObligation.description}</p>
            <p className="mt-1">
              Importe de la obligación: <strong>{fmt(confirmUncheckObligation.amountUsd)}</strong>. Al confirmar, el desembolso asociado será revertido y la obligación volverá a figurar como pendiente.
            </p>
          </div>
        )}
      </ErpModal>

      {/* Modal Aviso Múltiples Abonos */}
      <ErpModal
        open={!!multiPaymentWarningObligation}
        onOpenChange={(open) => !open && setMultiPaymentWarningObligation(null)}
        eyebrow="Finanzas / Control de Abonos"
        title="Abonos Múltiples Registrados"
        description="Esta obligación posee múltiples abonos registrados de forma parcial. Para anular un pago puntual, abre el Historial de Abonos y cancela el abono correspondiente."
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                const obl = multiPaymentWarningObligation;
                setMultiPaymentWarningObligation(null);
                if (obl) setHistoryModalObligation(obl);
              }}
              className="w-full rounded-lg bg-[#b9561d] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#964314] sm:w-auto"
            >
              Ver Historial de Abonos
            </button>
            <button
              type="button"
              onClick={() => setMultiPaymentWarningObligation(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cerrar
            </button>
          </>
        }
      >
        {multiPaymentWarningObligation && (
          <div className="rounded-lg border border-[#e6d28f] bg-[#fdf4dc] p-3 text-[12px] text-[#8a6a12]">
            <p className="font-bold">{multiPaymentWarningObligation.description}</p>
            <p className="mt-1">
              Tiene <strong>{multiPaymentWarningObligation.payments?.length || 0} abonos</strong> registrados. Para mantener la integridad contable, los abonos deben gestionarse de forma individual en su historial.
            </p>
          </div>
        )}
      </ErpModal>

      {/* Modal Confirmar Anular Abono Específico */}
      <ErpModal
        open={!!confirmRevertPayment}
        onOpenChange={(open) => !open && setConfirmRevertPayment(null)}
        eyebrow="Finanzas / Anulación de Abono"
        title="Anular Abono Realizado"
        description="¿Estás seguro de anular este abono? El importe se reincorporará automáticamente como saldo por pagar de la obligación."
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmRevertPayment(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmRevertPayment}
              className="w-full rounded-lg bg-[#c85454] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#a84730] sm:w-auto"
            >
              Confirmar Anulación
            </button>
          </>
        }
      >
        {confirmRevertPayment && (
          <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-[12px] text-[#a84730]">
            <p className="font-bold">Monto del abono: {fmt(confirmRevertPayment.amount)}</p>
            <p className="mt-1">
              Esta acción revertirá la liquidación efectuada. El saldo de la obligación se actualizará inmediatamente.
            </p>
          </div>
        )}
      </ErpModal>

      {/* Modal de Reporte Financiero de Pagos del Proyecto */}
      <FinancialReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        project={project}
        projectSnapshot={data}
      />
    </PmAppShell>
  );
}
