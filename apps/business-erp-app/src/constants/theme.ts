/**
 * Theme central del Business ERP App.
 * Única fuente de verdad para colores, fuentes y métricas de layout.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Paleta oficial (dark) de la landing. */
export const Palette = {
  bg: '#0d0d0d',
  card: '#131313',
  text: '#f5f0e8',
  muted: 'rgba(245,240,232,0.58)',
  line: 'rgba(245,240,232,0.13)',
  overlay: 'rgba(0,0,0,0.6)',
  primary: '#cc5200',
  pink: '#ff4500',
  lime: '#003366',
  blue: '#3399ff',
  teal: '#ff9933',
  yellow: '#0055a4',
} as const;

/** Familias tipográficas exclusivas de la Landing oficial (cargadas en RootLayout vía expo-font). */
export const LandingFontFamilies = {
  display: 'BebasNeue_400Regular',
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodyBold: 'SpaceGrotesk_700Bold',
} as const;

/** Familias tipográficas del sistema para los módulos operativos (PM, QC y derivados). */
export const FontFamilies = {
  display: undefined,
  body: undefined,
  bodyMedium: undefined,
  bodyBold: undefined,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
