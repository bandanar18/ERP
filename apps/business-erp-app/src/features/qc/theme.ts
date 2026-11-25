/**
 * Paleta del módulo Quality Control (espeja el diseño web del login QC:
 * verdes esmeralda sobre blanco, tinta verde-oscura).
 */
export const QcColors = {
  /* Fondos */
  paper: '#ffffff',
  hero: '#ffffff',
  surface: '#ffffff',
  surface2: '#ecfdf5',
  background: '#ffffff',

  /* Tinta */
  ink: '#101f19',
  inkSoft: '#5b7267',
  placeholder: '#9db0a5',

  /* Acentos (esmeralda) */
  accent: '#059669',
  accentDeep: '#047857',
  accentDark: '#064e3b',
  accentLight: '#a7f3d0',
  lime: '#34d399',

  /* Estados y semáforos */
  green: '#16a34a',
  red: '#dc2626',
  yellow: '#d97706',
  blue: '#2563eb',
  orange: '#d9772f',
  orangeDeep: '#b9561d',

  /* Líneas */
  rule: '#d8e6de',
  divider: '#e2ece6',
  heroRule: '#d8e6de',

  white: '#ffffff',
  teal: '#059669', // Alias to accent
  tealDeep: '#047857', // Alias to accentDeep
} as const;

export const QcOpColors = QcColors;

