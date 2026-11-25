import { ErpWizardForm, ErpInputField } from "./ErpWizardForm";
import { Building2, Code, FileText, User, Plus, ArrowLeft } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { projectService, type Company, type User as UserType } from "../api";
import { useToast } from "@/shared/hooks/useToast";
import { CompanySelector } from "./CompanySelector";
import { UserSelector } from "./UserSelector";
import { PmAppShell } from "./PmAppShell";
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_CONFIG,
  ProjectStatus,
} from "../interfaces/project.types";

const PROJECT_STEPS = [
  { id: 1, name: "Información Básica", description: "Datos del proyecto", icon: FileText },
  { id: 2, name: "Código y Fechas", description: "Identificación y periodo", icon: Code },
  { id: 3, name: "Empresa", description: "Asignar a empresa", icon: Building2 },
  { id: 4, name: "Responsable", description: "Planificador asignado", icon: User },
  { id: 5, name: "Revisión", description: "Verificar datos antes de crear", icon: FileText },

];

export const CreateProjectView = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedManager, setSelectedManager] = useState<UserType | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    shortName: "",
    description: "",
    code: "",
    startDate: "",
    endDate: "",
    companyId: "",
    managerId: "",
    offeredAmount: "",
    estimatedCost: "",
    status: ProjectStatus.IN_PROGRESS as string,
  });

  const handleChange = (field: keyof typeof formData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Validar que el paso actual esté completo
  const canAdvanceNext = (step: number): boolean => {
    switch (step) {
      case 1:
        // Paso 1: Nombre completo, nombre corto, monto ofertado y costo estimado son requeridos
        return formData.fullName.trim() !== "" &&
               formData.shortName.trim() !== "" &&
               formData.offeredAmount.trim() !== "" &&
               formData.estimatedCost.trim() !== "";
      case 2:
        // Paso 2: Código es requerido (fechas opcionales)
        return formData.code.trim() !== "";
      case 3:
        // Paso 3: Empresa es requerida
        return formData.companyId !== "";
      case 4:
        // Paso 4: Planificador es opcional
        return true;
      default:
        return true;
    }
  };

  const handleNextInvalid = () => {
    let message = "";
    if (!formData.fullName.trim() || !formData.shortName.trim() || !formData.offeredAmount.trim() || !formData.estimatedCost.trim()) {
      message = "Completa los campos requeridos: Nombre completo, Nombre corto, Monto Ofertado y Costo Estimado";
    } else if (!formData.code.trim()) {
      message = "Completa el campo requerido: Código";
    } else if (!formData.companyId) {
      message = "Selecciona una empresa";
    } else {
      message = "Completa los campos requeridos para continuar";
    }
    error(message);
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <ErpInputField
              label="Nombre completo"
              placeholder="Ej: Construcción Edificio Central"
              value={formData.fullName}
              onChange={handleChange("fullName")}
            />
            <ErpInputField
              label="Nombre corto"
              placeholder="Ej: ED-CENTRAL"
              value={formData.shortName}
              onChange={handleChange("shortName")}
            />
            <ErpInputField
              label="Monto Ofertado"
              type="number"
              placeholder="Ej: 50000.00"
              value={formData.offeredAmount}
              onChange={handleChange("offeredAmount")}
            />
            <ErpInputField
              label="Formulación Presupuestaria"
              type="number"
              placeholder="Ej: 45000.00"
              value={formData.estimatedCost}
              onChange={handleChange("estimatedCost")}
            />
            <div className="md:col-span-2">
              <ErpInputField
                label="Descripción"
                placeholder="Descripción detallada del proyecto"
                value={formData.description}
                onChange={handleChange("description")}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <ErpInputField
              label="Código del proyecto"
              placeholder="EJ: PROJ-2024-001"
              value={formData.code}
              onChange={handleChange("code")}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label="Fecha inicio"
                type="date"
                placeholder=""
                value={formData.startDate}
                onChange={handleChange("startDate")}
              />
              <ErpInputField
                label="Fecha fin estimada"
                type="date"
                placeholder=""
                value={formData.endDate}
                onChange={handleChange("endDate")}
              />
            </div>
            <div>
              <label htmlFor="project-status" className="block text-[12px] font-semibold text-[#111416] mb-1.5">
                Estado del Proyecto
              </label>
              <select
                id="project-status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 text-sm text-[#111416] shadow-none transition-colors focus-visible:border-[#d9772f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9772f]/25"
              >
                {PROJECT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#4e5558]">
                Asignado automáticamente en «En ejecución». Puedes cambiarlo si la obra lo requiere.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <CompanySelector
              onSelect={(company) => {
                setFormData(prev => ({ ...prev, companyId: company.id }));
                setSelectedCompany(company);
              }}
              selectedId={formData.companyId}
              createNewLabel="Crear nueva empresa"
              inline={true}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <UserSelector
              onSelect={(user) => {
                setFormData(prev => ({ ...prev, managerId: user.id }));
                setSelectedManager(user);
              }}
              selectedId={formData.managerId}
              inline={true}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Información del Proyecto
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Nombre completo</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.fullName || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Nombre corto</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.shortName || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Descripción</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416] max-w-[200px]">{formData.description || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Monto Ofertado</dt>
                  <dd className="truncate pl-4 text-sm font-bold text-[#4c9b7a]">{formData.offeredAmount ? `$${formData.offeredAmount}` : "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Formulación Presupuestaria</dt>
                  <dd className="truncate pl-4 text-sm font-bold text-[#5e8fc2]">{formData.estimatedCost ? `$${formData.estimatedCost}` : "-"}</dd>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Identificación y Fechas
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Código</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.code || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Fecha inicio</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.startDate || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Fecha fin</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.endDate || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Estado</dt>
                  <dd className="truncate pl-4 text-sm font-bold text-[#111416]">
                    {PROJECT_STATUS_CONFIG[formData.status]?.label || formData.status}
                  </dd>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Asignaciones
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Empresa</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">
                    {selectedCompany?.name || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Responsable</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">
                    {selectedManager
                      ? [selectedManager.firstName, selectedManager.lastName].filter(Boolean).join(" ").trim() || selectedManager.email || "-"
                      : "-"}
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

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.code || !formData.fullName || !formData.companyId) {
      error("Faltan campos requeridos: Código, Nombre y Empresa son obligatorios");
      return;
    }

    try {
      await projectService.create({
        code: formData.code,
        fullName: formData.fullName,
        shortName: formData.shortName || undefined,
        description: formData.description || undefined,
        companyId: formData.companyId,
        managerId: formData.managerId || undefined,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        status: (formData.status as any) || "IN_PROGRESS",
        offeredAmount: Number(formData.offeredAmount),
        estimatedCost: Number(formData.estimatedCost),
      });

      success("Proyecto creado correctamente");
      navigate("/project-management/explorar");
    } catch (err: any) {
      const errorMsg = err.error || err.message || "Error al crear proyecto";
      error(errorMsg);
    }
  };

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Crear Proyecto</strong>
        </>
      }
    >
      {/* Volver */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* Botón flotante para crear empresa - solo en paso 3 */}
      {currentStep === 3 && (
        <button
          onClick={() => navigate("/project-management/company/create", { state: { from: "create-project" } })}
          className="fixed bottom-6 right-6 z-10 inline-flex h-11 items-center gap-2 border border-[#d9772f] bg-[#d9772f] px-4 text-[11px] font-bold text-white shadow-lg transition-colors hover:border-[#b9561d] hover:bg-[#b9561d]"
          title="Crear nueva empresa"
        >
          <Plus className="h-4 w-4" />
          Crear Empresa
        </button>
      )}

      <ErpWizardForm
        steps={PROJECT_STEPS}
        title="Crear Proyecto"
        subtitle="Completa los pasos para crear un nuevo proyecto"
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
