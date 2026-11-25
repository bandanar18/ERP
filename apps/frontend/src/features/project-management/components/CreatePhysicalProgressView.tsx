import { ErpWizardForm, ErpInputField } from "./ErpWizardForm";
import { TrendingUp, Calendar, FileText, ArrowLeft } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { physicalProgressService } from "../api";
import { useToast } from "@/shared/hooks/useToast";
import { PmAppShell } from "./PmAppShell";

const PROGRESS_STEPS = [
  { id: 1, name: "Datos del Avance", description: "Fecha y porcentajes", icon: Calendar },
  { id: 2, name: "Puntos de Atención", description: "Observaciones opcionales", icon: FileText },
  { id: 3, name: "Revisión", description: "Verificar datos antes de crear", icon: TrendingUp },
];

export const CreatePhysicalProgressView = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    actualProgress: "",
    plannedProgress: "",
    attentionPoints: "",
  });

  const handleChange = (field: keyof typeof formData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Validar que el paso actual esté completo
  const canAdvanceNext = (step: number): boolean => {
    switch (step) {
      case 1:
        // Paso 1: Avances son requeridos (startDate y endDate son opcionales)
        return formData.actualProgress.trim() !== "" &&
               formData.plannedProgress.trim() !== "";
      case 2:
        // Paso 2: Puntos de atención es opcional
        return true;
      default:
        return true;
    }
  };

  const handleNextInvalid = () => {
    let message = "";
    if (!formData.actualProgress || !formData.plannedProgress) {
      message = "Completa los campos requeridos: Avance Real y Avance Planificado";
    } else {
      message = "Completa los campos requeridos para continuar";
    }
    error(message);
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label="Fecha de Inicio del Periodo"
                type="date"
                placeholder=""
                value={formData.startDate}
                onChange={handleChange("startDate")}
              />
              <ErpInputField
                label="Fecha de Fin del Periodo"
                type="date"
                placeholder=""
                value={formData.endDate}
                onChange={handleChange("endDate")}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label="Avance Real (%)"
                placeholder="Ej: 45%"
                value={formData.actualProgress}
                onChange={handleChange("actualProgress")}
              />
              <ErpInputField
                label="Avance Planificado (%)"
                placeholder="Ej: 50%"
                value={formData.plannedProgress}
                onChange={handleChange("plannedProgress")}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <ErpInputField
              label="Puntos de Atención (Opcional)"
              placeholder="Describe observaciones, retrasos o puntos importantes..."
              value={formData.attentionPoints}
              onChange={handleChange("attentionPoints")}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Datos del Avance
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Fecha Inicio</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.startDate || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Fecha Fin</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.endDate || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Avance Real</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.actualProgress || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Avance Planificado</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.plannedProgress || "-"}</dd>
                </div>
              </div>
            </div>

            {formData.attentionPoints && (
              <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
                <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                  Puntos de Atención
                </h3>
                <div className="rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <p className="text-sm text-[#111416]">{formData.attentionPoints}</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.actualProgress || !formData.plannedProgress || !projectId) {
      error("Faltan campos requeridos: Avance Real y Avance Planificado son obligatorios");
      return;
    }

    try {
      await physicalProgressService.create({
        projectId,
        date: new Date().toISOString(),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        actualProgress: formData.actualProgress,
        plannedProgress: formData.plannedProgress,
        attentionPoints: formData.attentionPoints || undefined,
      });

      success("Avance físico creado correctamente");
      navigate(`/project-management/detalle/${projectId}/avances`);
    } catch (err: any) {
      const errorMsg = err.error || err.message || "Error al crear avance físico";
      error(errorMsg);
    }
  };

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Registrar Avance Físico</strong>
        </>
      }
    >
      {/* Volver */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      <ErpWizardForm
        steps={PROGRESS_STEPS}
        title="Registrar Avance Físico"
        subtitle="Completa los pasos para registrar un nuevo avance"
        renderStep={renderStep}
        onSubmit={handleSubmit}
        canNext={canAdvanceNext}
        onNextInvalid={handleNextInvalid}
        renderExtraAction={(step) => {
          setCurrentStep(step);
          return null;
        }}
      />
    </PmAppShell>
  );
};
