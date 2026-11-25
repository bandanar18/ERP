import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Plus, Pencil, Building2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PmAppShell } from "../components/PmAppShell";
import { ErpPageHeader } from "../components/ErpPageHeader";
import { ErpMetricStrip, type ErpMetric } from "../components/ErpMetricStrip";
import { ErpModal } from "../components/ErpModal";
import { usePermission } from "../hooks/usePermission";
import { projectService, financialService } from "../api";
import { PROJECT_STATUS_CONFIG, type ProjectCollection } from "../interfaces/project.types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);

const input = "h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 text-[13px] transition-colors focus:border-[#4c9b7a] focus:outline-none focus:ring-1 focus:ring-[#4c9b7a]";

export function ProjectCollectionsView() {
  const { id } = useParams<{ id: string }>();
  const { canManagePayables } = usePermission();
  const [project, setProject] = useState<any>(null);
  const [collections, setCollections] = useState<ProjectCollection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de registro de cobro
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Formulario de Cobros
  const [collectionForm, setCollectionForm] = useState({
    valuationId: "",
    description: "",
    reference: "",
    appliesAdvance: false,
    grossAmountUsd: "",
    amortizedAmountUsd: "0",
    amountUsd: "",
    collectedAt: new Date().toISOString().split("T")[0],
  });
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

  // Modal para edición de cobro
  const [editingCollection, setEditingCollection] = useState<ProjectCollection | null>(null);
  const [editForm, setEditForm] = useState({
    valuationId: "",
    description: "",
    reference: "",
    appliesAdvance: false,
    grossAmountUsd: "",
    amortizedAmountUsd: "0",
    amountUsd: "",
    collectedAt: new Date().toISOString().split("T")[0],
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const refreshAll = async () => {
    if (!id) return;
    try {
      const [col, proj, valuations] = await Promise.all([
        projectService.getCollections(id),
        projectService.getById(id).catch(() => null),
        financialService.getByProjectId(id).catch(() => []),
      ]);
      setCollections(col);
      if (proj) {
        setProject({
          ...proj,
          financialValuations: (valuations && valuations.length > 0)
            ? valuations
            : (proj.financialValuations || []),
        });
      }
    } catch (err) {
      console.error("Error refreshing collections data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [id]);

  const handleValuationSelect = (valuationId: string) => {
    setCollectionError(null);
    const val = (project?.financialValuations || []).find((v: any) => v.id === valuationId);
    if (val) {
      const gross = Number(val.amountUsd || 0);
      const grossStr = String(gross);
      setCollectionForm((prev) => {
        const amort = prev.appliesAdvance ? Number(prev.amortizedAmountUsd.replace(",", ".")) || 0 : 0;
        const net = Math.max(0, gross - amort);
        return {
          ...prev,
          valuationId,
          grossAmountUsd: grossStr,
          amountUsd: String(net),
          description: prev.description || `Liquidación Valuación N° ${val.valuationNumber}${val.invoiceNumber ? ` (Fact. ${val.invoiceNumber})` : ''}`,
        };
      });
    } else {
      setCollectionForm((prev) => ({
        ...prev,
        valuationId: "",
        grossAmountUsd: "",
      }));
    }
  };

  const handleToggleAppliesAdvance = (checked: boolean) => {
    setCollectionForm((prev) => {
      const grossNum = Number(prev.grossAmountUsd.replace(",", ".")) || 0;
      if (!checked) {
        return {
          ...prev,
          appliesAdvance: false,
          amortizedAmountUsd: "0",
          amountUsd: grossNum > 0 ? String(grossNum) : prev.amountUsd,
        };
      } else {
        const amortNum = Number(prev.amortizedAmountUsd.replace(",", ".")) || 0;
        const netNum = grossNum > 0 ? Math.max(0, grossNum - amortNum) : (Number(prev.amountUsd.replace(",", ".")) || 0);
        return {
          ...prev,
          appliesAdvance: true,
          amountUsd: netNum > 0 ? String(netNum) : prev.amountUsd,
        };
      }
    });
  };

  const handleGrossChange = (grossStr: string) => {
    setCollectionForm((prev) => {
      const grossNum = Number(grossStr.replace(",", ".")) || 0;
      if (prev.appliesAdvance) {
        const amortNum = Number(prev.amortizedAmountUsd.replace(",", ".")) || 0;
        const netNum = Math.max(0, grossNum - amortNum);
        return {
          ...prev,
          grossAmountUsd: grossStr,
          amountUsd: grossNum > 0 ? String(netNum) : prev.amountUsd,
        };
      } else {
        return {
          ...prev,
          grossAmountUsd: grossStr,
          amountUsd: grossStr || prev.amountUsd,
        };
      }
    });
  };

  const handleAmortChange = (amortStr: string) => {
    setCollectionForm((prev) => {
      const amortNum = Number(amortStr.replace(",", ".")) || 0;
      const grossNum = Number(prev.grossAmountUsd.replace(",", ".")) || 0;
      const netNum = Math.max(0, grossNum - amortNum);
      return {
        ...prev,
        amortizedAmountUsd: amortStr,
        amountUsd: grossNum > 0 ? String(netNum) : prev.amountUsd,
      };
    });
  };

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const netAmt = Number(collectionForm.amountUsd.replace(",", "."));
    if (isNaN(netAmt) || netAmt <= 0) {
      setCollectionError("El monto neto cobrado debe ser mayor a 0");
      return;
    }
    const grossAmt = collectionForm.grossAmountUsd ? Number(collectionForm.grossAmountUsd.replace(",", ".")) : undefined;
    const amortAmt = collectionForm.appliesAdvance && collectionForm.amortizedAmountUsd
      ? Number(collectionForm.amortizedAmountUsd.replace(",", "."))
      : 0;

    if (collectionForm.appliesAdvance && grossAmt !== undefined && amortAmt > 0 && grossAmt < (netAmt + amortAmt - 0.01)) {
      setCollectionError("El monto bruto debe ser al menos la suma del neto y la amortización");
      return;
    }

    const trimmedDesc = collectionForm.description.trim();
    const trimmedRef = collectionForm.reference.trim();
    let finalReference: string | undefined;
    if (trimmedDesc && trimmedRef) {
      finalReference = `${trimmedDesc} · Ref: ${trimmedRef}`;
    } else if (trimmedDesc) {
      finalReference = trimmedDesc;
    } else if (trimmedRef) {
      finalReference = `Ref: ${trimmedRef}`;
    }

    try {
      setIsSubmittingCollection(true);
      setCollectionError(null);
      await projectService.addCollection(id, {
        amountUsd: netAmt,
        reference: finalReference,
        collectedAt: collectionForm.collectedAt,
        valuationId: collectionForm.valuationId || undefined,
        grossAmountUsd: grossAmt,
        amortizedAmountUsd: amortAmt,
      });
      setCollectionForm({
        valuationId: "",
        description: "",
        reference: "",
        appliesAdvance: false,
        grossAmountUsd: "",
        amortizedAmountUsd: "0",
        amountUsd: "",
        collectedAt: new Date().toISOString().split("T")[0],
      });
      setIsCreateModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      setCollectionError(err.message || err.error || "Error al registrar el cobro");
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  const handleOpenEdit = (col: ProjectCollection) => {
    const raw = col.reference || "";
    let desc = raw;
    let refNum = "";
    if (raw.includes(" · Ref: ")) {
      const parts = raw.split(" · Ref: ");
      desc = parts[0];
      refNum = parts[1];
    } else if (raw.startsWith("Ref: ")) {
      desc = "";
      refNum = raw.replace("Ref: ", "");
    }
    const hasAmort = col.amortizedAmountUsd != null && Number(col.amortizedAmountUsd) > 0;
    setEditingCollection(col);
    setEditForm({
      valuationId: col.valuationId || "",
      description: desc,
      reference: refNum,
      appliesAdvance: hasAmort,
      grossAmountUsd: col.grossAmountUsd != null ? String(col.grossAmountUsd) : "",
      amortizedAmountUsd: col.amortizedAmountUsd != null ? String(col.amortizedAmountUsd) : "0",
      amountUsd: String(col.amountUsd),
      collectedAt: col.collectedAt
        ? new Date(col.collectedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setEditError(null);
  };

  const handleEditValuationSelect = (valuationId: string) => {
    setEditError(null);
    const val = (project?.financialValuations || []).find((v: any) => v.id === valuationId);
    if (val) {
      const gross = Number(val.amountUsd || 0);
      const grossStr = String(gross);
      setEditForm((prev) => {
        const amort = prev.appliesAdvance ? Number(prev.amortizedAmountUsd.replace(",", ".")) || 0 : 0;
        const net = Math.max(0, gross - amort);
        return {
          ...prev,
          valuationId,
          grossAmountUsd: grossStr,
          amountUsd: String(net),
          description: prev.description || `Liquidación Valuación N° ${val.valuationNumber}${val.invoiceNumber ? ` (Fact. ${val.invoiceNumber})` : ''}`,
        };
      });
    } else {
      setEditForm((prev) => ({
        ...prev,
        valuationId: "",
        grossAmountUsd: "",
      }));
    }
  };

  const handleEditToggleAppliesAdvance = (checked: boolean) => {
    setEditForm((prev) => {
      const grossNum = Number(prev.grossAmountUsd.replace(",", ".")) || 0;
      if (!checked) {
        return {
          ...prev,
          appliesAdvance: false,
          amortizedAmountUsd: "0",
          amountUsd: grossNum > 0 ? String(grossNum) : prev.amountUsd,
        };
      } else {
        const amortNum = Number(prev.amortizedAmountUsd.replace(",", ".")) || 0;
        const netNum = grossNum > 0 ? Math.max(0, grossNum - amortNum) : (Number(prev.amountUsd.replace(",", ".")) || 0);
        return {
          ...prev,
          appliesAdvance: true,
          amountUsd: netNum > 0 ? String(netNum) : prev.amountUsd,
        };
      }
    });
  };

  const handleEditGrossChange = (grossStr: string) => {
    setEditForm((prev) => {
      const grossNum = Number(grossStr.replace(",", ".")) || 0;
      if (prev.appliesAdvance) {
        const amortNum = Number(prev.amortizedAmountUsd.replace(",", ".")) || 0;
        const netNum = Math.max(0, grossNum - amortNum);
        return {
          ...prev,
          grossAmountUsd: grossStr,
          amountUsd: grossNum > 0 ? String(netNum) : prev.amountUsd,
        };
      } else {
        return {
          ...prev,
          grossAmountUsd: grossStr,
          amountUsd: grossStr || prev.amountUsd,
        };
      }
    });
  };

  const handleEditAmortChange = (amortStr: string) => {
    setEditForm((prev) => {
      const amortNum = Number(amortStr.replace(",", ".")) || 0;
      const grossNum = Number(prev.grossAmountUsd.replace(",", ".")) || 0;
      const netNum = Math.max(0, grossNum - amortNum);
      return {
        ...prev,
        amortizedAmountUsd: amortStr,
        amountUsd: grossNum > 0 ? String(netNum) : prev.amountUsd,
      };
    });
  };

  const handleSaveEditCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection) return;
    const netAmt = Number(editForm.amountUsd.replace(",", "."));
    if (isNaN(netAmt) || netAmt <= 0) {
      setEditError("El monto neto cobrado debe ser mayor a 0");
      return;
    }
    const grossAmt = editForm.grossAmountUsd ? Number(editForm.grossAmountUsd.replace(",", ".")) : undefined;
    const amortAmt = editForm.appliesAdvance && editForm.amortizedAmountUsd
      ? Number(editForm.amortizedAmountUsd.replace(",", "."))
      : 0;

    if (editForm.appliesAdvance && grossAmt !== undefined && amortAmt > 0 && grossAmt < (netAmt + amortAmt - 0.01)) {
      setEditError("El monto bruto debe ser al menos la suma del neto y la amortización");
      return;
    }

    const trimmedDesc = editForm.description.trim();
    const trimmedRef = editForm.reference.trim();
    let finalReference: string | undefined;
    if (trimmedDesc && trimmedRef) {
      finalReference = `${trimmedDesc} · Ref: ${trimmedRef}`;
    } else if (trimmedDesc) {
      finalReference = trimmedDesc;
    } else if (trimmedRef) {
      finalReference = `Ref: ${trimmedRef}`;
    }

    try {
      setIsSubmittingEdit(true);
      setEditError(null);
      await projectService.updateCollection(editingCollection.id, {
        amountUsd: netAmt,
        reference: finalReference,
        collectedAt: editForm.collectedAt,
        valuationId: editForm.valuationId || null,
        grossAmountUsd: grossAmt !== undefined ? grossAmt : null,
        amortizedAmountUsd: amortAmt,
      });
      setEditingCollection(null);
      await refreshAll();
    } catch (err: any) {
      setEditError(err.message || err.error || "Error al actualizar el cobro");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const totalCollections = collections.reduce((sum, x) => sum + Number(x.amountUsd || 0), 0);
  // const totalGross = collections.reduce((sum, x) => sum + (x.grossAmountUsd != null ? Number(x.grossAmountUsd) : Number(x.amountUsd || 0)), 0);
  const metrics: ErpMetric[] = [
    {
      title: "Total Cobrado",
      value: fmt(totalCollections),
      change: `${collections.length} cobros recibidos`,
      rail: "bg-[#376850]",
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
          <strong className="text-[#111416]">Cobros</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow={`Finanzas / ${project?.projectCode ? `${project.projectCode} · ` : ""}Cobros`}
        title="Cobros y Liquidaciones"
        copy={
          project
            ? `${project.projectName || project.fullName || project.projectCode} — Liquidaciones percibidas, valuaciones, amortización de anticipos e ingresos netos en banco.`
            : "Liquidaciones percibidas, valuaciones, amortización de anticipos e ingresos netos en banco."
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
                  setCollectionError(null);
                  setCollectionForm({
                    valuationId: "",
                    description: "",
                    reference: "",
                    appliesAdvance: false,
                    grossAmountUsd: "",
                    amortizedAmountUsd: "0",
                    amountUsd: "",
                    collectedAt: new Date().toISOString().split("T")[0],
                  });
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#4c9b7a] bg-[#4c9b7a] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#3d7f63] hover:bg-[#3d7f63] sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Registrar Cobro
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
            <Link
              to={`/project-management/detalle/${id}/costo-real`}
              className="inline-flex items-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3.5 py-2 text-[10px] font-bold text-[#b9561d] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
            >
              Costo Real
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </Link>
            <span className="inline-flex items-center gap-[6px] rounded-lg border border-[#4c9b7a] bg-[#edf3ec] px-3.5 py-2 text-[10px] font-bold text-[#376850]">
              Cobros
              <ArrowUpRight className="h-[13px] w-[13px]" />
            </span>
          </div>
        </div>
      )}

      {/* Métricas Strip */}
      <div className="mb-5">
        <ErpMetricStrip metrics={metrics} />
      </div>

      {/* Tabla de Cobros Registrados */}
      <div className="overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9]">
        <div className="flex flex-col gap-2 border-b border-[#d8d0c4] bg-[#f5f0e8]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-[#111416]">Historial de Cobros Recibidos</h3>
            <p className="text-[12px] text-[#4e5558]">Liquidaciones registradas, valuaciones asociadas y deducciones de anticipo</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8d918f]">Total Cobrado:</span>
            <span className="text-[16px] font-bold text-[#376850] tabular-nums">{fmt(totalCollections)}</span>
            <Badge variant="outline" className="rounded-md border-[#d8d0c4] bg-[#fffdf9] text-[10px] font-bold text-[#4e5558]">
              {collections.length} Registros
            </Badge>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm font-semibold text-[#4e5558]">Cargando cobros...</p>
        ) : collections.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#4e5558]">No hay cobros registrados para este proyecto.</p>
        ) : (
          <>
            {/* Vista Mobile: Tarjetas compactas */}
            <div className="divide-y divide-[#d8d0c4]/60 block md:hidden">
              {collections.map((col) => {
                const raw = col.reference || "";
                let desc = raw;
                let refNum = "";
                if (raw.includes(" · Ref: ")) {
                  const parts = raw.split(" · Ref: ");
                  desc = parts[0];
                  refNum = parts[1];
                } else if (raw.startsWith("Ref: ")) {
                  desc = "";
                  refNum = raw.replace("Ref: ", "");
                }

                return (
                  <article key={col.id} className="p-4 space-y-2.5 hover:bg-[#f5f0e8]/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#111416] text-[13px] leading-snug">
                          {desc || "Cobro registrado"}
                        </p>
                        {refNum && (
                          <p className="text-[11px] text-[#4e5558] font-medium mt-0.5">
                            Comprobante: <span className="font-mono text-[#8d918f]">{refNum}</span>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {col.valuation ? (
                          <span className="inline-flex items-center rounded-md border border-[#5e8fc2] bg-[#f0f5fa] px-2 py-0.5 text-[10px] font-bold text-[#2c5282]">
                            Val. N° {col.valuation.valuationNumber}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-[#d8d0c4] bg-[#f5f0e8] px-2 py-0.5 text-[10px] font-medium text-[#8d918f]">
                            Directo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#d8d0c4]/70 bg-[#faf7f2] p-2.5 text-center">
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-[#8d918f]">Bruto</span>
                        <span className="text-[12px] font-medium tabular-nums text-[#4e5558]">
                          {col.grossAmountUsd != null ? fmt(Number(col.grossAmountUsd)) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-[#8d918f]">Amortización</span>
                        <span className="text-[12px] font-semibold tabular-nums text-[#b9561d]">
                          {col.amortizedAmountUsd != null && Number(col.amortizedAmountUsd) > 0
                            ? `-${fmt(Number(col.amortizedAmountUsd))}`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-[#376850]">Neto Banco</span>
                        <span className="text-[13px] font-black tabular-nums text-[#376850]">
                          {fmt(Number(col.amountUsd))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#8d918f]">
                        {new Date(col.collectedAt).toLocaleDateString("es-AR")}
                      </span>
                      {canManagePayables && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(col)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#d8d0c4] bg-[#fffdf9] px-2.5 py-1 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#b9561d] hover:bg-[#fff0eb]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Vista Desktop / Tablet: Tabla completa con scroll horizontal protegido */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#d8d0c4] bg-[#faf7f2] text-[10px] font-bold uppercase tracking-[0.08em] text-[#4e5558]">
                    <th className="px-4 py-3">Concepto / Comprobante</th>
                    <th className="px-4 py-3">Valuación / Factura</th>
                    <th className="px-4 py-3">Fecha de Cobro</th>
                    <th className="px-4 py-3 text-right">Bruto Liquidado</th>
                    <th className="px-4 py-3 text-right">Amortización</th>
                    <th className="px-4 py-3 text-right">Neto Percibido</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d0c4]/60 text-[12px]">
                  {collections.map((col) => (
                    <tr key={col.id} className="transition-colors hover:bg-[#f5f0e8]/30">
                      <td className="px-4 py-3">
                        {(() => {
                          const raw = col.reference || "";
                          let desc = raw;
                          let refNum = "";
                          if (raw.includes(" · Ref: ")) {
                            const parts = raw.split(" · Ref: ");
                            desc = parts[0];
                            refNum = parts[1];
                          } else if (raw.startsWith("Ref: ")) {
                            desc = "";
                            refNum = raw.replace("Ref: ", "");
                          }
                          return (
                            <div className="flex flex-col gap-0.5">
                              <p className="font-bold text-[#111416]">{desc || "Cobro registrado"}</p>
                              {refNum && (
                                <p className="text-[11px] text-[#4e5558] font-medium">
                                  Comprobante: <span className="font-mono text-[#8d918f]">{refNum}</span>
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {col.valuation ? (
                          <span className="inline-flex items-center rounded-md border border-[#5e8fc2] bg-[#f0f5fa] px-2 py-0.5 text-[10px] font-bold text-[#2c5282]">
                            Valuación N° {col.valuation.valuationNumber}
                            {col.valuation.invoiceNumber ? ` · Fact. ${col.valuation.invoiceNumber}` : ""}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8d918f]">Cobro directo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#4e5558]">
                        {new Date(col.collectedAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#4e5558] whitespace-nowrap">
                        {col.grossAmountUsd != null ? fmt(Number(col.grossAmountUsd)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#b9561d] whitespace-nowrap">
                        {col.amortizedAmountUsd != null && Number(col.amortizedAmountUsd) > 0
                          ? `-${fmt(Number(col.amortizedAmountUsd))}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-[#376850] whitespace-nowrap">
                        {fmt(Number(col.amountUsd))}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canManagePayables && (
                          <button
                            type="button"
                            title="Editar cobro"
                            onClick={() => handleOpenEdit(col)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#d8d0c4] bg-[#fffdf9] px-2.5 py-1 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#b9561d] hover:bg-[#fff0eb]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Registrar Cobro */}
      <ErpModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        eyebrow="Finanzas / Cobros"
        title="Registrar Cobro"
        description="Registra una liquidación o cobro bancario recibido en el proyecto."
        maxWidth="max-w-[620px]"
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
              disabled={isSubmittingCollection}
              onClick={handleAddCollection}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#4c9b7a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3d7f63] disabled:opacity-50 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Registrar Cobro
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddCollection} className="space-y-4">
          {collectionError && (
            <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-2.5 text-[12px] font-semibold text-[#a84730]">
              {collectionError}
            </div>
          )}

          {/* Selector de Valuación (ancho completo) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between">
              <label className="text-[12px] font-semibold text-[#111416]">Valuación Relacionada</label>
              <span className="text-[10px] text-[#8d918f]">Opcional</span>
            </div>
            <select
              value={collectionForm.valuationId}
              onChange={(e) => handleValuationSelect(e.target.value)}
              className={input}
            >
              <option value="">Sin valuación (Cobro directo o anticipo)</option>
              {(project?.financialValuations || [])
                .filter((v: any) => v.status === "FACTURADO")
                .map((v: any) => (
                  <option key={v.id} value={v.id}>
                    Valuación N° {v.valuationNumber} ({v.status}) — {fmt(Number(v.amountUsd))}
                    {v.invoiceNumber ? ` · Fact. ${v.invoiceNumber}` : ""}
                  </option>
              ))}
            </select>
            {collectionForm.valuationId && (() => {
              const selectedVal = (project?.financialValuations || []).find((v: any) => v.id === collectionForm.valuationId);
              if (!selectedVal) return null;
              return (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#376850]/20 bg-[#edf3ec]/60 px-3 py-2 text-[11px] text-[#376850]">
                  <span>Monto base facturado: <strong className="font-bold">{fmt(Number(selectedVal.amountUsd))}</strong></span>
                  {selectedVal.invoiceNumber && <span>Factura: <strong className="font-bold">{selectedVal.invoiceNumber}</strong></span>}
                </div>
              );
            })()}
          </div>

          {/* Fila Operativa: Fecha y Referencia Bancaria (2 columnas simétricas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Fecha de Cobro <span className="text-[#c85454]">*</span>
                </label>
              </div>
              <input
                type="date"
                required
                className={input}
                value={collectionForm.collectedAt}
                onChange={(e) => {
                  setCollectionError(null);
                  setCollectionForm({ ...collectionForm, collectedAt: e.target.value });
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">Comprobante Bancario</label>
                <span className="text-[10px] text-[#8d918f]">Opcional</span>
              </div>
              <input
                type="text"
                placeholder="Ej: Transferencia #4819"
                className={input}
                value={collectionForm.reference}
                onChange={(e) => {
                  setCollectionError(null);
                  setCollectionForm({ ...collectionForm, reference: e.target.value });
                }}
              />
            </div>
          </div>

          {/* Descripción del Cobro (ancho completo) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between">
              <label className="text-[12px] font-semibold text-[#111416]">Descripción del Cobro</label>
              <span className="text-[10px] text-[#8d918f]">Opcional</span>
            </div>
            <input
              type="text"
              placeholder="Ej: Liquidación de avance de obra, materiales..."
              className={input}
              value={collectionForm.description}
              onChange={(e) => {
                setCollectionError(null);
                setCollectionForm({ ...collectionForm, description: e.target.value });
              }}
            />
          </div>

          {/* Checkbox Anticipo */}
          <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4] bg-[#faf7f2]/80 px-3.5 py-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] font-semibold text-[#111416]">
              <input
                type="checkbox"
                checked={collectionForm.appliesAdvance}
                onChange={(e) => {
                  setCollectionError(null);
                  handleToggleAppliesAdvance(e.target.checked);
                }}
                className="h-4 w-4 rounded border-[#d8d0c4] text-[#4c9b7a] focus:ring-[#4c9b7a] cursor-pointer"
              />
              <span>Aplica anticipo</span>
            </label>
            <span className="text-[11px] text-[#8d918f]">
              {collectionForm.appliesAdvance ? "Deducción activada" : "Sin deducción"}
            </span>
          </div>

          {/* Montos simétricos y responsivos (3 columnas fijas en sm:, responsive en mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Monto Bruto (USD) <span className="text-[#c85454]">*</span>
                </label>
              </div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className={`${input} font-medium tabular-nums`}
                value={collectionForm.grossAmountUsd}
                onChange={(e) => {
                  setCollectionError(null);
                  handleGrossChange(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Amortización (USD) {collectionForm.appliesAdvance && <span className="text-[#c85454]">*</span>}
                </label>
                {!collectionForm.appliesAdvance && (
                  <span className="text-[10px] text-[#8d918f]">0.00</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!collectionForm.appliesAdvance}
                required={collectionForm.appliesAdvance}
                placeholder="0.00"
                className={`${input} tabular-nums ${
                  collectionForm.appliesAdvance
                    ? "font-semibold text-[#b9561d]"
                    : "bg-[#f5f0e8]/50 text-[#8d918f] cursor-not-allowed select-none"
                }`}
                value={collectionForm.appliesAdvance ? collectionForm.amortizedAmountUsd : "0"}
                onChange={(e) => {
                  setCollectionError(null);
                  handleAmortChange(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Monto Neto (USD) <span className="text-[#c85454]">*</span>
                </label>
                <span className="text-[10px] font-semibold text-[#376850]">En banco</span>
              </div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className={`${input} font-bold text-[#376850] tabular-nums`}
                value={collectionForm.amountUsd}
                onChange={(e) => {
                  setCollectionError(null);
                  const val = e.target.value;
                  setCollectionForm((prev) => ({
                    ...prev,
                    amountUsd: val,
                    grossAmountUsd: !prev.appliesAdvance ? val : prev.grossAmountUsd,
                  }));
                }}
              />
            </div>
          </div>
        </form>
      </ErpModal>

      {/* Modal Editar Cobro */}
      <ErpModal
        open={!!editingCollection}
        onOpenChange={(open) => !open && setEditingCollection(null)}
        eyebrow="Finanzas / Cobros"
        title="Editar Cobro"
        description="Modifica los datos del cobro o liquidación bancaria registrada."
        maxWidth="max-w-[620px]"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setEditingCollection(null)}
              className="w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2 text-[12px] font-bold text-[#4e5558] hover:bg-[#f5f0e8] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmittingEdit}
              onClick={handleSaveEditCollection}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#4c9b7a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3d7f63] disabled:opacity-50 sm:w-auto"
            >
              <Pencil className="h-4 w-4" /> Guardar Cambios
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveEditCollection} className="space-y-4">
          {editError && (
            <div className="rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-2.5 text-[12px] font-semibold text-[#a84730]">
              {editError}
            </div>
          )}

          {/* Selector de Valuación (ancho completo) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between">
              <label className="text-[12px] font-semibold text-[#111416]">Valuación Relacionada</label>
              <span className="text-[10px] text-[#8d918f]">Opcional</span>
            </div>
            <select
              value={editForm.valuationId}
              onChange={(e) => handleEditValuationSelect(e.target.value)}
              className={input}
            >
              <option value="">Sin valuación (Cobro directo o anticipo)</option>
              {(project?.financialValuations || [])
                .filter((v: any) => v.status === "FACTURADO" || v.id === editForm.valuationId)
                .map((v: any) => (
                  <option key={v.id} value={v.id}>
                    Valuación N° {v.valuationNumber} ({v.status}) — {fmt(Number(v.amountUsd))}
                    {v.invoiceNumber ? ` · Fact. ${v.invoiceNumber}` : ""}
                  </option>
              ))}
            </select>
            {editForm.valuationId && (() => {
              const selectedVal = (project?.financialValuations || []).find((v: any) => v.id === editForm.valuationId);
              if (!selectedVal) return null;
              return (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#376850]/20 bg-[#edf3ec]/60 px-3 py-2 text-[11px] text-[#376850]">
                  <span>Monto base facturado: <strong className="font-bold">{fmt(Number(selectedVal.amountUsd))}</strong></span>
                  {selectedVal.invoiceNumber && <span>Factura: <strong className="font-bold">{selectedVal.invoiceNumber}</strong></span>}
                </div>
              );
            })()}
          </div>

          {/* Fila Operativa: Fecha y Referencia Bancaria (2 columnas simétricas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Fecha de Cobro <span className="text-[#c85454]">*</span>
                </label>
              </div>
              <input
                type="date"
                required
                className={input}
                value={editForm.collectedAt}
                onChange={(e) => {
                  setEditError(null);
                  setEditForm({ ...editForm, collectedAt: e.target.value });
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">Comprobante Bancario</label>
                <span className="text-[10px] text-[#8d918f]">Opcional</span>
              </div>
              <input
                type="text"
                placeholder="Ej: Transferencia #4819"
                className={input}
                value={editForm.reference}
                onChange={(e) => {
                  setEditError(null);
                  setEditForm({ ...editForm, reference: e.target.value });
                }}
              />
            </div>
          </div>

          {/* Descripción del Cobro (ancho completo) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between">
              <label className="text-[12px] font-semibold text-[#111416]">Descripción del Cobro</label>
              <span className="text-[10px] text-[#8d918f]">Opcional</span>
            </div>
            <input
              type="text"
              placeholder="Ej: Liquidación de avance de obra, materiales..."
              className={input}
              value={editForm.description}
              onChange={(e) => {
                setEditError(null);
                setEditForm({ ...editForm, description: e.target.value });
              }}
            />
          </div>

          {/* Checkbox Anticipo */}
          <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4] bg-[#faf7f2]/80 px-3.5 py-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] font-semibold text-[#111416]">
              <input
                type="checkbox"
                checked={editForm.appliesAdvance}
                onChange={(e) => {
                  setEditError(null);
                  handleEditToggleAppliesAdvance(e.target.checked);
                }}
                className="h-4 w-4 rounded border-[#d8d0c4] text-[#4c9b7a] focus:ring-[#4c9b7a] cursor-pointer"
              />
              <span>Aplica anticipo</span>
            </label>
            <span className="text-[11px] text-[#8d918f]">
              {editForm.appliesAdvance ? "Deducción activada" : "Sin deducción"}
            </span>
          </div>

          {/* Montos simétricos y responsivos (3 columnas fijas en sm:, responsive en mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Monto Bruto (USD) <span className="text-[#c85454]">*</span>
                </label>
              </div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className={`${input} font-medium tabular-nums`}
                value={editForm.grossAmountUsd}
                onChange={(e) => {
                  setEditError(null);
                  handleEditGrossChange(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Amortización (USD) {editForm.appliesAdvance && <span className="text-[#c85454]">*</span>}
                </label>
                {!editForm.appliesAdvance && (
                  <span className="text-[10px] text-[#8d918f]">0.00</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!editForm.appliesAdvance}
                required={editForm.appliesAdvance}
                placeholder="0.00"
                className={`${input} tabular-nums ${
                  editForm.appliesAdvance
                    ? "font-semibold text-[#b9561d]"
                    : "bg-[#f5f0e8]/50 text-[#8d918f] cursor-not-allowed select-none"
                }`}
                value={editForm.appliesAdvance ? editForm.amortizedAmountUsd : "0"}
                onChange={(e) => {
                  setEditError(null);
                  handleEditAmortChange(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-[12px] font-semibold text-[#111416]">
                  Monto Neto (USD) <span className="text-[#c85454]">*</span>
                </label>
                <span className="text-[10px] font-semibold text-[#376850]">En banco</span>
              </div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className={`${input} font-bold text-[#376850] tabular-nums`}
                value={editForm.amountUsd}
                onChange={(e) => {
                  setEditError(null);
                  const val = e.target.value;
                  setEditForm((prev) => ({
                    ...prev,
                    amountUsd: val,
                    grossAmountUsd: !prev.appliesAdvance ? val : prev.grossAmountUsd,
                  }));
                }}
              />
            </div>
          </div>
        </form>
      </ErpModal>
    </PmAppShell>
  );
}
