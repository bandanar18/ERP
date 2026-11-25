import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, CheckCircle2, Pencil, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { projectService } from "../api";
import { financialService } from "../api";
import type { FinancialValuation } from "../interfaces/financial.types";
import type { ProjectExpense } from "../interfaces/project.types";
import { CreateValuationModal } from "../components/CreateValuationModal";
import { UpdateValuationStatusModal } from "../components/UpdateValuationStatusModal";
import { EditValuationAmountModal } from "../components/EditValuationAmountModal";
import { usePermission } from "../hooks/usePermission";
import { PmAppShell } from "../components/PmAppShell";
import { ErpPageHeader } from "../components/ErpPageHeader";
import { ErpMetricStrip, type ErpMetric } from "../components/ErpMetricStrip";

export function FinancialPlanningView() {
  const { id } = useParams<{ id: string }>();
  const { isDireccion, canManageValuations } = usePermission();
  const [project, setProject] = useState<any>(null);
  const [valuations, setValuations] = useState<FinancialValuation[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [valuationToInvoice, setValuationToInvoice] = useState<FinancialValuation | null>(null);
  const [valuationToEditAmount, setValuationToEditAmount] = useState<FinancialValuation | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [projData, valData, expData] = await Promise.all([
        projectService.getById(id),
        financialService.getByProjectId(id),
        projectService.getExpenses(id).catch(() => []),
      ]);
      setProject(projData);
      setValuations(valData);
      setExpenses(expData || []);
    } catch (err) {
      console.error("Error loading financial planning:", err);
      setError("No se pudo cargar la información financiera. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (valuation: FinancialValuation, newStatus: 'POR_FACTURAR' | 'FACTURADO') => {
    if (newStatus === 'FACTURADO') {
      setValuationToInvoice(valuation);
      return;
    }

    try {
      await financialService.updateStatus(valuation.id, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4c9b7a] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando datos financieros...</p>
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

  const offeredAmount = Number(project.offeredAmount || 0);
  const formulacionPresupuestaria = Number(project.estimatedCost || 0);
  const costoReal =
    project.actualCost != null
      ? Number(project.actualCost)
      : (expenses || []).reduce((acc: number, e: any) => acc + Number(e.amountUsd || 0), 0);
  const totalValuated = valuations.reduce((acc, val) => acc + val.amountUsd, 0);
  const progressPercent = offeredAmount > 0 ? (totalValuated / offeredAmount) * 100 : 0;

  const porValuarTotal = valuations.filter(v => v.status === 'POR_VALUAR').reduce((acc, val) => acc + val.amountUsd, 0);
  const porFacturarTotal = valuations.filter(v => v.status === 'POR_FACTURAR').reduce((acc, val) => acc + val.amountUsd, 0);
  const facturadoTotal = valuations.filter(v => v.status === 'FACTURADO').reduce((acc, val) => acc + val.amountUsd, 0);

  const fmtARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const kpis: ErpMetric[] = [
    {
      title: "1. Ofertado del Proyecto",
      value: fmtARS(offeredAmount),
      change: "Presupuesto ofertado al cliente",
      rail: "bg-[#111416]",
    },
    {
      title: "2. Formulación Presupuestaria",
      value: fmtARS(formulacionPresupuestaria),
      change: "Presupuesto planificado",
      rail: "bg-[#d9772f]",
    },
    {
      title: "3. Costo Real del Proyecto",
      value: fmtARS(costoReal),
      change: "Cargado por Adm. Financiero",
      rail: "bg-[#5e8fc2]",
    },
    {
      title: "4. Valuado / Facturado",
      value: fmtARS(totalValuated),
      change: `Facturado: ${fmtARS(facturadoTotal)} · P/Valuar: ${fmtARS(porValuarTotal)} · P/Facturar: ${fmtARS(porFacturarTotal)}`,
      rail: "bg-[#4c9b7a]",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'POR_VALUAR': return <Badge variant="outline" className="rounded-md bg-[#ece6dc] text-[#4e5558] border-[#d8d0c4]">Por Valuar</Badge>;
      case 'POR_FACTURAR': return <Badge variant="outline" className="rounded-md bg-[#fff0eb] text-[#a84730] border-[#edb6a5]">Por Facturar</Badge>;
      case 'FACTURADO': return <Badge variant="outline" className="rounded-md bg-[#edf3ec] text-[#376850] border-[#a7c9b4]">Facturado</Badge>;
      default: return <Badge className="rounded-md">{status}</Badge>;
    }
  };

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
          <strong className="text-[#111416]">Planificación Financiera</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Finanzas / Valuaciones"
        title="Planificación Financiera"
        copy="Gestiona las valuaciones y facturación del proyecto"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex min-h-10 items-center justify-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416] sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
            {canManageValuations && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex min-h-10 items-center justify-center gap-[9px] rounded-lg border border-[#4c9b7a] bg-[#4c9b7a] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#3d7f63] hover:bg-[#3d7f63] sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nueva Valuación
              </button>
            )}
          </div>
        }
      />

      <ErpMetricStrip metrics={kpis} />

      {/* ===== Tabla (desktop) ===== */}
      <div className="mt-5 rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] max-[1024px]:hidden">
        <div className="flex justify-between items-center border-b border-[#d8d0c4] bg-[#f5f0e8]/60 p-4">
          <h3 className="text-[14px] font-bold tracking-[-0.03em] text-[#111416]">Historial de Valuaciones</h3>
          <Badge variant="secondary" className="rounded-md bg-[#edf3ec] text-[#376850]">
            {valuations.length} Registros
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#111416] bg-[#f5f0e8]">
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Nro. Valuación</th>
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Monto USD</th>
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Periodo</th>
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Estado</th>
                <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em]">Factura</th>
                {canManageValuations && <th className="px-4 py-3 text-[9px] font-bold text-[#4e5558] uppercase tracking-[0.12em] text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d0c4]/50">
              {valuations.length === 0 ? (
                <tr>
                  <td colSpan={canManageValuations ? 6 : 5} className="px-4 py-6 text-center text-sm text-[#4e5558]">
                    No hay valuaciones registradas para este proyecto.
                  </td>
                </tr>
              ) : (
                valuations.map((val) => (
                  <tr key={val.id} className="hover:bg-[#f3ede3] transition-colors">
                    <td className="px-4 py-3 text-[13px] font-bold text-[#111416]">{val.valuationNumber}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#4e5558]">
                      {fmtARS(val.amountUsd)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4e5558]">
                      {new Date(val.startDate).toLocaleDateString()} - {new Date(val.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(val.status)}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#4e5558]">{val.invoiceNumber || '-'}</td>
                    {canManageValuations && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {(val.status === 'POR_VALUAR' || val.status === 'POR_FACTURAR') && (
                            <button
                              onClick={() => setValuationToEditAmount(val)}
                              className="flex items-center gap-1 text-xs font-bold text-[#4e5558] transition-colors hover:text-[#b9561d]"
                              title="Editar monto"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar monto
                            </button>
                          )}
                          {val.status === 'POR_VALUAR' && (
                            <button onClick={() => handleStatusChange(val, 'POR_FACTURAR')} className="text-xs font-bold text-[#b9561d] hover:underline">
                              Marcar Por Facturar
                            </button>
                          )}
                          {val.status === 'POR_FACTURAR' && (
                            <button onClick={() => handleStatusChange(val, 'FACTURADO')} className="text-xs font-bold text-[#4c9b7a] hover:underline">
                              Facturar
                            </button>
                          )}
                          {val.status === 'FACTURADO' && (
                            <span className="flex items-center justify-end gap-1 text-xs font-medium text-[#4e5558]">
                              <CheckCircle2 className="h-3 w-3" /> Completado
                            </span>
                          )}
                        </div>
                      </td>
                    )}
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
          <h3 className="text-[14px] font-bold tracking-[-0.03em] text-[#111416]">Historial de Valuaciones</h3>
          <Badge variant="secondary" className="rounded-md bg-[#edf3ec] text-[#376850]">
            {valuations.length} Registros
          </Badge>
        </div>

        {valuations.length === 0 ? (
          <div className="rounded-b-xl border border-[#d8d0c4] bg-[#fffdf9] px-4 py-8 text-center text-sm text-[#4e5558]">
            No hay valuaciones registradas para este proyecto.
          </div>
        ) : (
          <div className="grid gap-3">
            {valuations.map((val) => (
              <div
                key={val.id}
                className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-colors hover:bg-[#f3ede3]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#111416]">{val.valuationNumber}</p>
                    <p className="mt-0.5 text-[12px] text-[#4e5558]">
                      {new Date(val.startDate).toLocaleDateString()} - {new Date(val.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(val.status)}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#858178]">Monto</p>
                    <p className="text-[14px] font-bold text-[#111416]">{fmtARS(val.amountUsd)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#858178]">Factura</p>
                    <p className="text-[14px] font-medium text-[#4e5558]">{val.invoiceNumber || '-'}</p>
                  </div>
                </div>

                {!isDireccion && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-[#d8d0c4]/60 pt-3">
                    {(val.status === 'POR_VALUAR' || val.status === 'POR_FACTURAR') && (
                      <button
                        onClick={() => setValuationToEditAmount(val)}
                        className="flex items-center gap-1 text-xs font-bold text-[#4e5558] transition-colors hover:text-[#b9561d]"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar monto
                      </button>
                    )}
                    {val.status === 'POR_VALUAR' && (
                      <button onClick={() => handleStatusChange(val, 'POR_FACTURAR')} className="text-xs font-bold text-[#b9561d] hover:underline">
                        Marcar Por Facturar
                      </button>
                    )}
                    {val.status === 'POR_FACTURAR' && (
                      <button onClick={() => handleStatusChange(val, 'FACTURADO')} className="text-xs font-bold text-[#4c9b7a] hover:underline">
                        Facturar
                      </button>
                    )}
                    {val.status === 'FACTURADO' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-[#4e5558]">
                        <CheckCircle2 className="h-3 w-3" /> Completado
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <div className="flex min-w-[190px] items-center gap-[9px]">
          <span>Ejecución financiera</span>
          <span className="h-1 flex-1 rounded-full overflow-hidden bg-[#d8d0c4]">
            <span className="block h-full rounded-full bg-[#4c9b7a]" style={{ width: `${Math.min(100, progressPercent)}%` }} />
          </span>
          <strong className="text-[#111416]">{progressPercent.toFixed(1)}%</strong>
        </div>
      </div>

      <CreateValuationModal 
        projectId={id!}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      <UpdateValuationStatusModal 
        valuation={valuationToInvoice}
        isOpen={!!valuationToInvoice}
        onClose={() => setValuationToInvoice(null)}
        onSuccess={fetchData}
      />

      <EditValuationAmountModal
        valuation={valuationToEditAmount}
        isOpen={!!valuationToEditAmount}
        onClose={() => setValuationToEditAmount(null)}
        onSuccess={fetchData}
      />
    </PmAppShell>
  );
}
