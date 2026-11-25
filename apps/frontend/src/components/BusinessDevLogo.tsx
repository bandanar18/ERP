import { cn } from "@/lib/utils";
import businessLogo from "@/assets/business.webp";

interface BusinessDevLogoProps {
  className?: string;
  /** Tamaño del logo (px de alto). */
  size?: number;
}

/**
 * Marca corporativa "Business & Development — Venezuela": usa la imagen
 * oficial `src/assets/business.webp` (logo real con canal alpha).
 */
export function BusinessDevMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={businessLogo}
      alt="Business & Development — Venezuela"
      loading="lazy"
      className={cn("shrink-0 object-contain", className)}
      style={{ height: size, width: "auto", maxWidth: "none" }}
    />
  );
}

/**
 * Logo corporativo completo (imagen oficial business.webp). Reutilizado por
 * el módulo de Project Management (BrandLogo) y Quality Control
 * (QcBrandMark/QcAuthLogo).
 */
export function BusinessDevLogo({ className, size = 44 }: BusinessDevLogoProps) {
  return <BusinessDevMark size={size} className={className} />;
}
