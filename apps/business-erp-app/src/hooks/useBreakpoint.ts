import { useWindowDimensions } from 'react-native';

/** Punto de corte tablet: ancho >= 768px o dimensión menor >= 600px (estándar Android/iOS tablet). */
export const TABLET_BREAKPOINT = 768;
export const TABLET_MIN_DIMENSION = 600;

/**
 * Expone el ancho de ventana y flags de layout responsive.
 * `isTablet` activa sidebar y layouts adaptados en iPad/tablets en cualquier orientación.
 */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);

  // Un tablet mantiene su condición tanto en vertical (portrait) como horizontal (landscape)
  const isTablet =
    minDim >= TABLET_MIN_DIMENSION ||
    width >= TABLET_BREAKPOINT ||
    (maxDim >= 900 && minDim >= 500);

  return {
    width,
    height,
    isTablet,
  };
}
