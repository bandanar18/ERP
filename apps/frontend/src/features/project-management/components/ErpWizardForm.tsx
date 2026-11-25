import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// ============================================================================
// DATA
// ============================================================================

export interface ErpWizardStep {
  id: number;
  name: string;
  description: string;
  icon: any;
}

const DEFAULT_STEPS: ErpWizardStep[] = [
  { id: 1, name: "Información", description: "Datos principales", icon: null },
  { id: 2, name: "Revisión", description: "Verificar datos", icon: null },
];

// ============================================================================
// STEP SIDEBAR (estilo ERP: sidebar oscura con pasos numerados)
// ============================================================================

function SidebarStep({
  step,
  currentStep,
  totalSteps,
}: {
  step: ErpWizardStep;
  currentStep: number;
  totalSteps: number;
}) {
  if (!step) return null;

  const Icon = step.icon;
  const isCompleted = currentStep > step.id;
  const isCurrent = currentStep === step.id;

  return (
    <div className="relative flex items-center gap-3 py-2.5">
      {/* Línea vertical conectora (excepto el último paso) */}
      {step.id !== totalSteps && (
        <div className="absolute left-[17px] top-10 h-full w-[2px] bg-[#2a2d2f]">
          <motion.div
            className="h-full w-full bg-[#d9772f]"
            initial={{ height: "0%" }}
            animate={{ height: isCompleted ? "100%" : "0%" }}
            transition={{ duration: 0.35 }}
          />
        </div>
      )}

      {/* Burbuja del paso */}
      <motion.div
        className={cn(
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300",
          isCompleted
            ? "border-[#d9772f] bg-[#d9772f] text-white"
            : isCurrent
              ? "border-[#d9772f] bg-[#d9772f]/15 text-[#d9772f] shadow-[0_0_0_4px_rgba(217,119,47,0.15)]"
              : "border-[#4e5558]/40 bg-transparent text-[#8d918f]"
        )}
        whileHover={{ scale: 1.05 }}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : (
          step.id
        )}
      </motion.div>

      {/* Texto del paso */}
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "text-[13px] font-bold transition-colors duration-300",
            isCurrent || isCompleted ? "text-white" : "text-[#8d918f]"
          )}
        >
          {step.name}
        </span>
        <span className="truncate text-[10px] text-[#8d918f]/70">
          {step.description}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// INPUT FIELD (estilo ERP)
// ============================================================================

function ErpInputField({
  label,
  placeholder,
  type = "text",
  required = false,
  value,
  onChange,
  list,
  min,
  step,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  list?: string;
  min?: string | number;
  step?: string | number;
}) {
  const id = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "-");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[12px] font-semibold text-[#111416]"
      >
        {label} {required && <span className="text-[#c85454]">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        list={list}
        min={min}
        step={step}
        className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none transition-colors focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export { ErpInputField };

export interface ErpWizardFormProps {
  steps?: ErpWizardStep[];
  title?: string;
  subtitle?: string;
  onSubmit?: () => void;
  renderStep?: (step: number) => ReactNode;
  canNext?: (step: number) => boolean;
  onNextInvalid?: () => void;
  renderExtraAction?: (step: number) => ReactNode;
}

export function ErpWizardForm({
  steps = DEFAULT_STEPS,
  title = "Wizard Form",
  subtitle = "Complete los pasos a continuación",
  onSubmit,
  renderStep,
  canNext,
  onNextInvalid,
  renderExtraAction,
}: ErpWizardFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const STEPS = steps;

  const handleNext = () => {
    if (canNext && !canNext(currentStep)) {
      if (onNextInvalid) onNextInvalid();
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (onSubmit) {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs"
    >
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar de pasos (oscura estilo ERP) */}
        <div className="border-b border-[#2a2d2f] bg-[#111416] p-5 lg:border-b-0 lg:border-r">
          <p className="mb-3 px-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8d918f]">
            {title}
          </p>
          <div className="space-y-0.5">
            {STEPS.map((step) => (
              <SidebarStep
                key={step.id}
                step={step}
                currentStep={currentStep}
                totalSteps={STEPS.length}
              />
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex min-w-0 flex-col p-5 lg:p-7">
          {/* Header del paso */}
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#d8d0c4] pb-4">
            <div>
              <p className="mb-[3px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
                Paso {currentStep} de {STEPS.length}
              </p>
              <h2 className="font-display text-[22px] font-normal leading-none tracking-[0.01em] text-[#111416]">
                {STEPS[currentStep - 1]?.name}
              </h2>
              <p className="mt-1 text-[11px] text-[#4e5558]">
                {subtitle} · {STEPS[currentStep - 1]?.description}
              </p>
            </div>
            {renderExtraAction && (
              <div className="shrink-0">{renderExtraAction(currentStep)}</div>
            )}
          </div>



          {/* Form Content */}
          <motion.div
            key={currentStep}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="min-h-[280px] flex-1"
          >
            {renderStep
              ? renderStep(currentStep)
              : (
                <div className="text-sm text-[#4e5558]">
                  Contenido del paso {currentStep}
                </div>
              )}
          </motion.div>

          {/* Footer / Navegación */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#d8d0c4] pt-5">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 rounded-lg text-[#4e5558] hover:bg-[#f5f0e8]/60 hover:text-[#111416] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={handleNext}
              disabled={canNext ? !canNext(currentStep) : false}
              className="gap-2 rounded-lg border border-[#d9772f] bg-[#d9772f] px-6 text-white shadow-none transition-colors hover:border-[#b9561d] hover:bg-[#b9561d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {currentStep === STEPS.length ? (
                <>
                  Crear
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
