import { BusinessDevMark, BusinessDevLogo } from "@/components/BusinessDevLogo";

/**
 * Marca del módulo Quality Control: el logo corporativo "Business &
 * Development" (imagen oficial business.webp) — mismo logo que usa el
 * módulo de Project Management, compartido por ambos.
 */
export function QcBrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <BusinessDevMark size={size} className={className} />;
}

export { BusinessDevLogo };
