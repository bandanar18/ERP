import { ErpWizardForm } from "./ErpWizardForm";
import { ErpPageHeader } from "./ErpPageHeader";
import { User, Briefcase, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService, type User as UserType } from "../api";
import { useToast } from "@/shared/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { PmAppShell } from "./PmAppShell";

const ASSIGN_STEPS = [
  { id: 1, name: "Seleccionar Planificador", description: "Elige el responsable", icon: User },
  { id: 2, name: "Revisión", description: "Confirma la asignación", icon: Briefcase },
];

export const AssignPlannerView = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [selectedPlanner, setSelectedPlanner] = useState<UserType | null>(null);
  const [, setCurrentStep] = useState(1);
  const [project, setProject] = useState<any>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [formData, setFormData] = useState({
    managerId: "",
  });

  // Cargar información del proyecto
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        setLoadingProject(true);
        const data = await projectService.getById(projectId);
        setProject(data);
        // Si ya tiene un planificador asignado, pre-seleccionarlo
        if (data.managerId) {
          setFormData({ managerId: data.managerId });
          setSelectedPlanner({
            id: data.manager?.managerId || "",
            firstName: data.manager?.managerName?.split(" ")[0] || "",
            lastName: data.manager?.managerName?.split(" ").slice(1).join(" ") || "",
            email: data.manager?.managerEmail || "",
            isActive: true,
          });
        }
      } catch (err) {
        error("Error al cargar el proyecto");
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Validar que el paso actual esté completo
  const canAdvanceNext = (step: number): boolean => {
    switch (step) {
      case 1:
        // Paso 1: Planificador es requerido
        return formData.managerId !== "";
      case 2:
        // Paso 2: Revisión - siempre puede avanzar
        return true;
      default:
        return true;
    }
  };

  const handleNextInvalid = () => {
    let message = "";
    if (!formData.managerId) {
      message = "Debes seleccionar un planificador para continuar";
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
            {/* Info del proyecto */}
            {project && (
              <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
                <h3 className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                  Proyecto
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#111416]">{project.projectName}</p>
                    <p className="text-xs text-[#4e5558]">{project.projectCode} • {project.shortName}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 rounded-md border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558]">
                    {project.company?.name}
                  </Badge>
                </div>
              </div>
            )}

            <div className="text-center py-4">
              <UserSelector
                onSelect={(user) => {
                  setFormData({ managerId: user.id });
                  setSelectedPlanner(user);
                }}
                selectedId={formData.managerId}
                inline={true}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
            {/* Info del proyecto */}
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Información del Proyecto
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Nombre</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{project?.projectName || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Código</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{project?.projectCode || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Empresa</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{project?.company?.name || "-"}</dd>
                </div>
              </div>
            </div>

            {/* Info del planificador */}
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Planificador Asignado
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Nombre</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">
                    {selectedPlanner
                      ? [selectedPlanner.firstName, selectedPlanner.lastName].filter(Boolean).join(" ").trim() || selectedPlanner.email || "-"
                      : "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Email</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416] max-w-[200px]">
                    {selectedPlanner?.email || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Rol</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">Planificador</dd>
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
    if (!formData.managerId || !projectId) {
      error("Faltan datos requeridos");
      return;
    }

    console.log("handleSubmit - projectId:", projectId, "managerId:", formData.managerId);

    try {
      await projectService.assignManager(projectId, formData.managerId);
      success("Planificador asignado correctamente");
      navigate(`/project-management/detalle/${projectId}`);
    } catch (err: any) {
      console.error("Error en handleSubmit:", err);
      const errorMsg = err.error || err.message || "Error al asignar planificador";
      error(errorMsg);
    }
  };

  if (loadingProject) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando proyecto...</p>
          </div>
        </div>
      </PmAppShell>
    );
  }

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Asignar Planificador</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Proyecto / Asignación"
        title="Asignar Planificador"
        copy="Selecciona el responsable del proyecto"
        action={
          <button
            onClick={() => window.history.back()}
            className="inline-flex min-h-10 items-center justify-center gap-[6px] border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        }
      />

      <ErpWizardForm
        steps={ASSIGN_STEPS}
        title="Asignar Planificador"
        subtitle="Selecciona el responsable del proyecto"
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

// Importar UserSelector al final para evitar problemas de importación circular
import { UserSelector } from "./UserSelector";
