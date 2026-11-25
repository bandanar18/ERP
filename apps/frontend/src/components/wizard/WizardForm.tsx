"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import type { ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck,
  MapPin,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ============================================================================
// DATA
// ============================================================================

export interface WizardStep {
  id: number;
  name: string;
  description: string;
  icon: any;
}

const DEFAULT_STEPS: WizardStep[] = [
  { id: 1, name: "Personal Info", description: "Basic details", icon: User },
  { id: 2, name: "Address", description: "Location info", icon: MapPin },
  { id: 3, name: "Preferences", description: "Customization", icon: Settings },
  { id: 4, name: "Review", description: "Final check", icon: FileCheck },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function SidebarStep({
  step,
  currentStep,
  totalSteps,
}: {
  step: WizardStep;
  currentStep: number;
  totalSteps: number;
}) {
  if (!step) return null;

  const Icon = step.icon;
  const isCompleted = currentStep > step.id;
  const isCurrent = currentStep === step.id;

  return (
    <div className="relative flex items-center gap-3 py-3">
      {/* Vertical Line - No mostrar si es el penúltimo paso (antes de Revisión) */}
      {step.id !== totalSteps && step.id !== totalSteps - 1 && (
        <div className="absolute left-5 top-8 h-full w-[2px] bg-border/30">
          <motion.div
            className="h-full w-full bg-primary"
            initial={{ height: "0%" }}
            animate={{ height: isCompleted ? "100%" : "0%" }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {/* Icon Bubble */}
      <motion.div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : isCurrent
              ? "border-primary bg-background text-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]"
              : "border-border/50 bg-background/50 text-muted-foreground"
        )}
        whileHover={{ scale: 1.05 }}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </motion.div>

      {/* Text Info */}
      <div className="flex flex-col">
        <span
          className={cn(
            "text-sm font-semibold transition-colors duration-300",
            isCurrent || isCompleted
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {step.name}
        </span>
        <span className="text-xs text-muted-foreground/70">
          {step.description}
        </span>
      </div>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  type = "text",
  required = false,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = label.toLowerCase().replace(/\s/g, "-");

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className="h-12 px-4"
      />
    </Field>
  );
}



// ============================================================================
// MAIN COMPONENT
// ============================================================================

export { InputField };

export interface WizardFormProps {
  steps?: WizardStep[];
  title?: string;
  subtitle?: string;
  onSubmit?: () => void;
  renderStep?: (step: number) => React.ReactNode;
  canNext?: (step: number) => boolean;
  onNextInvalid?: () => void;
  renderExtraAction?: (step: number) => React.ReactNode;
}

export function WizardForm({
  steps = DEFAULT_STEPS,
  title = "Wizard Form",
  subtitle = "Complete the steps below",
  onSubmit,
  renderStep,
  canNext,
  onNextInvalid,
  renderExtraAction,
}: WizardFormProps) {
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
    <div className="w-full h-full p-4 md:p-8">
      <div className="mx-auto max-w-5xl pb-8">
        {/* Header Section */}
        <div className="mb-8 text-center relative">
          <Badge
            variant="outline"
            className="mb-3 inline-flex items-center gap-2 rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {title}
          </Badge>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {subtitle}
          </p>

          {/* Extra Action - botón flotante arriba a la derecha */}
          {renderExtraAction && (
            <div className="absolute top-0 right-0">
              {renderExtraAction(currentStep)}
            </div>
          )}
        </div>

        {/* Main Card Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/40 backdrop-blur-xl"
        >
          {/* Glass Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="grid lg:grid-cols-[280px_1fr]">
            {/* Left Sidebar - Steps */}
            <div className="border-b border-border/40 bg-background/30 p-6 lg:border-b-0 lg:border-r">
              <div className="space-y-1">
                {STEPS.map((step) => (
                  <SidebarStep
                    key={step.id}
                    step={step}
                    currentStep={currentStep}
                    totalSteps={STEPS.length} // +1 para no mostrar línea en el último paso
                  />
                ))}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex flex-col p-6 lg:p-8">
              <div className="flex-1">
                <motion.div
                  key={currentStep}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-8"
                >
                  {/* Step Header */}
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {STEPS[currentStep - 1].name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {STEPS[currentStep - 1].description}
                    </p>
                  </div>

                  {/* Form Content */}
                  <div className="min-h-[300px]">
                    {renderStep ? renderStep(currentStep) : (
                      <div className="text-muted-foreground">
                        Step {currentStep} content
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Footer / Navigation */}
              <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-8">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={canNext ? !canNext(currentStep) : false}
                  className="gap-2 rounded-full bg-primary px-8 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === STEPS.length ? (
                    <>
                      Submit
                      <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
