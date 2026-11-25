import { cn } from "@/lib/utils";
import { BusinessDevLogo } from "@/components/BusinessDevLogo";

interface BrandLogoProps {
  className?: string;
  /** Solo el marca (sin wordmark) — para la tarjeta de login. */
  compact?: boolean;
  /** Tamaño del marca (px). */
  size?: number;
}

/**
 * Logo corporativo "Business & Development — Venezuela" (SVG inline, sin
 * assets externos). Se usa en las páginas de auth del módulo Project
 * Management y en su sidebar.
 */
export function BrandLogo({ className, size = 44 }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex", className)}>
      <BusinessDevLogo size={size} />
    </span>
  );
}
