import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirementProps {
  ok: boolean;
  touched: boolean;
  label: string;
  /** Clases para el estado "cumple" (por defecto verde). */
  okClass?: string;
  /** Clases para el estado "no cumple" (por defecto rojo). */
  failClass?: string;
  /** Clases para el estado "sin tocar" (por defecto gris). */
  idleClass?: string;
  className?: string;
}

/**
 * Requisito de contraseña con indicador visual de icono:
 * - Sin tocar  → círculo gris
 * - Cumple     → check verde
 * - No cumple  → X roja
 */
export function PasswordRequirement({
  ok,
  touched,
  label,
  okClass,
  failClass,
  idleClass,
  className,
}: PasswordRequirementProps) {
  if (!touched) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-semibold text-[#62564f]",
          idleClass,
          className
        )}
      >
        <Circle aria-hidden="true" className="size-3 stroke-[2.5]" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px]",
        ok ? "font-extrabold text-[#159447]" : "font-bold text-[#d92d20]",
        ok ? okClass : failClass,
        className
      )}
    >
      {ok ? (
        <Check aria-hidden="true" className="size-3.5 stroke-[2.5]" />
      ) : (
        <X aria-hidden="true" className="size-3.5 stroke-[2.5]" />
      )}
      {label}
    </span>
  );
}
