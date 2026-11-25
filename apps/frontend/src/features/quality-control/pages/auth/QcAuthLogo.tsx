import { cn } from "@/lib/utils";
import { BusinessDevLogo } from "@/components/BusinessDevLogo";

interface QcAuthLogoProps {
  className?: string;
  /** Solo el marca (sin wordmark) — para la tarjeta de login. */
  compact?: boolean;
  /** Tamaño del marca (px). */
  size?: number;
}

/**
 * Logo corporativo "Business & Development — Venezuela" para las páginas de
 * auth del módulo Quality Control. Idéntico al del módulo Project Management
 * (mismo componente compartido), como pidió el usuario.
 */
export function QcAuthLogo({ className, size = 44 }: QcAuthLogoProps) {
  return (
    <span className={cn("inline-flex", className)}>
      <BusinessDevLogo size={size} />
    </span>
  );
}
