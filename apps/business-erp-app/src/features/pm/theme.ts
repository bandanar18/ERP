/**
 * Paleta de colores del módulo Project Management.
 * Espeja los colores del login web del módulo (LoginPage/LoginForm):
 * naranja #ea580c, marrón #1c0f08 y fondo blanco.
 */
export const PmColors = {
  /** Marrón oscuro — texto principal. */
  ink: '#1c0f08',
  /** Gris — texto secundario. */
  inkSoft: '#57534e',
  /** Fondo general. */
  paper: '#ffffff',
  /** Superficie (tarjetas). */
  surface: '#ffffff',
  /** Crema claro — ilustraciones/fondos suaves. */
  surface2: '#ffe8d3',
  /** Borde de inputs. */
  rule: '#e5ddd5',
  /** Línea de divisor. */
  divider: '#eadfd6',
  /** Placeholder de inputs. */
  placeholder: '#a8a29e',
  /** Naranja principal (botones, acentos, links). */
  orange: '#ea580c',
  /** Naranja oscuro (hover/pressed). */
  orangeDeep: '#c2410c',
  /** Naranja claro (ilustraciones). */
  orangeLight: '#fb923c',
  /** Crema (ilustraciones). */
  cream: '#ffe8d3',
  /** Verde lima (indicadores de estado). */
  lime: '#b9cd48',
  /** Sección hero. */
  hero: '#ffffff',
  heroSoft: '#57534e',
  heroRule: '#eadfd6',
  white: '#ffffff',
} as const;

/**
 * Paleta de OPERACIÓN del módulo PM (dashboard y pantallas internas).
 * Espeja el PmAppShell/ProjectDashboardView de la web: fondo beige #f5f0e8,
 * superficies crema #fffdf9, texto #111416 y naranja #d9772f.
 * No tocar la paleta `PmColors` (login/auth) que imita el LoginForm web.
 */
export const PmOpColors = {
  /** Texto principal (casi negro). */
  ink: '#111416',
  /** Texto secundario. */
  inkSoft: '#4e5558',
  /** Fondo general (beige). */
  paper: '#f5f0e8',
  /** Superficies (tarjetas, crema). */
  surface: '#fffdf9',
  /** Fila destacada. */
  surface2: '#fbede3',
  /** Borde de inputs/tarjetas. */
  rule: '#d8d0c4',
  /** Línea de divisor / riel de barras. */
  divider: '#ece6dc',
  /** Placeholder. */
  placeholder: '#a8a29e',
  /** Naranja principal (botones, acentos). */
  orange: '#d9772f',
  /** Naranja oscuro (hover/pressed). */
  orangeDeep: '#b9561d',
  /** Naranja claro. */
  orangeLight: '#fb923c',
  /** Verde lima (indicadores de estado). */
  lime: '#b9cd48',
  /** Azul acento (gráficos). */
  blue: '#5e8fc2',
  /** Rosa acento (gráficos). */
  pink: '#df6e84',
  /** Verde (tendencias positivas). */
  green: '#4c9b7a',
  /** Rojo (tendencias negativas). */
  red: '#c85454',
  white: '#ffffff',
  /** Colores de las barras (rails) de la tira de métricas. */
  rails: ['#d9772f', '#5e8fc2', '#b9cd48', '#df6e84'] as const,
} as const;
