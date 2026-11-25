import { ErpWizardForm, ErpInputField, type ErpWizardStep } from "./ErpWizardForm";
import { FileText, Receipt, ShieldCheck, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect, type ChangeEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { payablesService, projectService } from "../api";
import { useToast } from "@/shared/hooks/useToast";
import { PmAppShell } from "./PmAppShell";

const OBLIGATION_STEPS: ErpWizardStep[] = [
  { id: 1, name: "Naturaleza y Monto", description: "Criterio devengado, categoría y monto", icon: FileText },
  { id: 2, name: "Comprobante y Fechas", description: "Proveedor, soporte y fechas de pago", icon: Receipt },
  { id: 3, name: "Revisión", description: "Verificar datos antes de registrar", icon: ShieldCheck },
];

const CATEGORY_SUGGESTIONS = [
  "Equipos",
  "Viáticos",
  "Alquileres",
  "Combustible",
  "Facturas",
  "Materiales",
  "Servicios",
  "Otros",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);

export const CreateObligationView = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [projectCode, setProjectCode] = useState<string>("");

  const [formData, setFormData] = useState({
    category: "",
    amountUsd: "",
    description: "",
    supplier: "",
    invoiceNumber: "",
    dueDate: "",
    isIncurred: true,
    incurredAt: new Date().toISOString().split("T")[0],
    supportDocument: "",
  });

  useEffect(() => {
    if (!projectId) return;
    projectService
      .getById(projectId)
      .then((p) => {
        if (p?.projectCode) setProjectCode(p.projectCode);
      })
      .catch(() => {});
  }, [projectId]);

  const handleChange = (field: keyof typeof formData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const canAdvanceNext = (step: number): boolean => {
    switch (step) {
      case 1: {
        const amt = Number(formData.amountUsd);
        return (
          formData.category.trim() !== "" &&
          formData.description.trim() !== "" &&
          !isNaN(amt) &&
          amt > 0
        );
      }
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNextInvalid = () => {
    const amt = Number(formData.amountUsd);
    if (!formData.category.trim()) {
      error("Completa la categoría de la obligación");
    } else if (isNaN(amt) || amt <= 0) {
      error("Ingresa un monto válido mayor a 0");
    } else if (!formData.description.trim()) {
      error("Ingresa la descripción de la obligación");
    } else {
      error("Completa los campos requeridos para continuar");
    }
  };

  const handleBackNavigation = () => {
    if (projectId) {
      navigate(`/project-management/detalle/${projectId}/cuentas-por-pagar`);
    } else {
      window.history.back();
    }
  };

  const handleSubmit = async () => {
    if (!projectId) {
      error("No se identificó el proyecto de destino");
      return;
    }

    const amt = Number(formData.amountUsd);
    if (isNaN(amt) || amt <= 0 || !formData.category.trim() || !formData.description.trim()) {
      error("Faltan campos obligatorios: Categoría, Monto y Descripción");
      return;
    }

    try {
      await payablesService.create({
        projectId,
        category: formData.category.trim(),
        description: formData.description.trim(),
        amountUsd: amt,
        supplier: formData.supplier.trim() || null,
        invoiceNumber: formData.invoiceNumber.trim() || null,
        dueDate: formData.dueDate || null,
        isIncurred: formData.isIncurred,
        incurredAt: formData.incurredAt || null,
        supportDocument: formData.supportDocument.trim() || null,
      });

      success("Obligación registrada correctamente");
      navigate(`/project-management/detalle/${projectId}/cuentas-por-pagar`);
    } catch (err: any) {
      const msg = err.error || err.message || "Error al registrar la obligación";
      error(msg);
    }
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Distinción entre Costo Incurrido y Compromiso Futuro */}
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/50 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111416] block mb-2">
                Naturaleza Contable del Registro *
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, isIncurred: true }))}
                  className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                    formData.isIncurred
                      ? "border-[#4c9b7a] bg-[#edf3ec] ring-1 ring-[#4c9b7a]"
                      : "border-[#d8d0c4] bg-white hover:bg-[#fffdf9]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${formData.isIncurred ? "text-[#376850]" : "text-[#8d918f]"}`} />
                    <span className="text-[13px] font-bold text-[#111416]">Costo Incurrido / Devengado</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#4e5558]">
                    Servicio ya ejecutado o material ya consumido. <strong>Suma de inmediato al Costo Real</strong> del proyecto.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, isIncurred: false }))}
                  className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                    !formData.isIncurred
                      ? "border-[#b9561d] bg-[#fff0eb] ring-1 ring-[#b9561d]"
                      : "border-[#d8d0c4] bg-white hover:bg-[#fffdf9]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${!formData.isIncurred ? "text-[#b9561d]" : "text-[#8d918f]"}`} />
                    <span className="text-[13px] font-bold text-[#111416]">Compromiso Futuro</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#4e5558]">
                    Orden de compra o contratación aún no ejecutada. <strong>No suma al Costo Real</strong> hasta marcarse como ejecutado.
                  </p>
                </button>
              </div>
            </div>

            <datalist id="cats-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label="Categoría"
                placeholder="Ej: Equipos, Viáticos, Combustible..."
                required
                value={formData.category}
                onChange={handleChange("category")}
                list="cats-suggestions"
              />
              <ErpInputField
                label="Monto (USD)"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ej: 15000.00"
                required
                value={formData.amountUsd}
                onChange={handleChange("amountUsd")}
              />
            </div>

            <ErpInputField
              label="Descripción de la Obligación"
              placeholder="Ej: Alquiler de generador eléctrico y combustible para obra..."
              required
              value={formData.description}
              onChange={handleChange("description")}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label={formData.isIncurred ? "Fecha de Reconocimiento / Devengado" : "Fecha Estimada de Ejecución"}
                placeholder="AAAA-MM-DD"
                type="date"
                value={formData.incurredAt}
                onChange={handleChange("incurredAt")}
              />
              <ErpInputField
                label="Fecha de Vencimiento de Pago (Opcional)"
                placeholder="AAAA-MM-DD"
                type="date"
                value={formData.dueDate}
                onChange={handleChange("dueDate")}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label="Proveedor (Opcional)"
                placeholder="Ej: Maquinarias del Centro S.A."
                value={formData.supplier}
                onChange={handleChange("supplier")}
              />
              <ErpInputField
                label="Número de Factura (Opcional)"
                placeholder="Ej: FACT-A-0004-00129841"
                value={formData.invoiceNumber}
                onChange={handleChange("invoiceNumber")}
              />
            </div>

            <ErpInputField
              label="Soporte del Costo / Documento de Respaldo (Opcional)"
              placeholder="Ej: Remito N° 4589, Orden de Compra OC-2026-12"
              value={formData.supportDocument}
              onChange={handleChange("supportDocument")}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Información de la Obligación
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Categoría</dt>
                  <dd className="truncate pl-4 text-sm font-semibold text-[#111416]">{formData.category || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Monto</dt>
                  <dd className="truncate pl-4 text-sm font-bold text-[#b9561d]">
                    {formData.amountUsd ? fmt(Number(formData.amountUsd)) : "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Descripción</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.description || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Naturaleza</dt>
                  <dd className="truncate pl-4 text-sm font-bold text-[#111416]">
                    {formData.isIncurred ? "Costo Incurrido (Integra Costo Real)" : "Compromiso Futuro (No integra Costo Real)"}
                  </dd>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Comprobante y Fechas
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Reconocimiento</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">
                    {formData.incurredAt ? new Date(formData.incurredAt + "T00:00:00").toLocaleDateString("es-AR") : "Hoy"}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Proveedor</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.supplier || "No especificado"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Nro. Factura</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.invoiceNumber || "No especificado"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Soporte / Documento</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.supportDocument || "No especificado"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Fecha de Vencimiento</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">
                    {formData.dueDate ? new Date(formData.dueDate + "T00:00:00").toLocaleDateString("es-AR") : "Sin vencimiento"}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PmAppShell
      active="Finanzas"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          {projectId && (
            <>
              <Link
                to={`/project-management/detalle/${projectId}`}
                className="font-semibold text-[#858178] transition-colors hover:text-[#b9561d]"
              >
                {projectCode || "Proyecto"}
              </Link>{" "}
              <span aria-hidden="true">/</span>{" "}
              <Link
                to={`/project-management/detalle/${projectId}/cuentas-por-pagar`}
                className="font-semibold text-[#858178] transition-colors hover:text-[#b9561d]"
              >
                Cuentas por pagar
              </Link>{" "}
              <span aria-hidden="true">/</span>{" "}
            </>
          )}
          <strong className="text-[#111416]">Registrar Obligación</strong>
        </>
      }
    >
      {/* Volver */}
      <div className="mb-4">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      <ErpWizardForm
        steps={OBLIGATION_STEPS}
        title="Registrar Obligación"
        subtitle="Completa los pasos para registrar una nueva cuenta por pagar u obligación operativa"
        renderStep={renderStep}
        onSubmit={handleSubmit}
        canNext={canAdvanceNext}
        onNextInvalid={handleNextInvalid}
      />
    </PmAppShell>
  );
};
