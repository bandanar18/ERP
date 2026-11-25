import type { Href } from 'expo-router';

import { Palette } from '@/constants/theme';

export interface ModuleInfo {
  number: string;
  accent: string;
  title: string;
  kicker: string;
  bold: string;
  copy: string;
  /** Ruta del módulo si está implementado; `undefined` = "próximamente". */
  to?: Href;
}

/** Módulos del ERP mostrados en el carousel de exploración. */
export const MODULES: ModuleInfo[] = [
  {
    number: '01',
    accent: Palette.primary,
    title: 'Proyectos',
    kicker: 'Ver el pulso',
    bold: 'Del plan a la entrega.',
    copy: 'Tareas, responsables y fechas visibles para que cada proyecto avance sin zonas grises.',
    to: '/pm/login',
  },
  {
    number: '02',
    /** Verde esmeralda — identidad del módulo Quality Control (QcColors.accent). */
    accent: '#059669',
    title: 'Calidad',
    kicker: 'Indicadores vivos',
    bold: 'Sistema de Gestión de Calidad.',
    copy: 'Indicadores, mediciones y reportes en un solo lugar para controlar tus procesos.',
    to: '/qc/login',
  },
  {
    number: '03',
    accent: Palette.lime,
    title: 'Inventario',
    kicker: 'Siempre a la vista',
    bold: 'Stock que responde.',
    copy: 'Existencias, movimientos y alertas para comprar con precisión y servir mejor.',
  },
  {
    number: '04',
    accent: Palette.blue,
    title: 'Finanzas',
    kicker: 'Decidir mejor',
    bold: 'La caja, sin sorpresas.',
    copy: 'Flujo de caja y rentabilidad en una lectura clara para tomar decisiones a tiempo.',
  },
  {
    number: '05',
    accent: Palette.yellow,
    title: 'CRM',
    kicker: 'Relaciones activas',
    bold: 'Más cerca del cliente.',
    copy: 'Cada conversación, oportunidad y siguiente paso en un solo recorrido comercial.',
  },
  {
    number: '06',
    accent: Palette.teal,
    title: 'Compras',
    kicker: 'Negociar con contexto',
    bold: 'Costes bajo control.',
    copy: 'Proveedores, órdenes y aprobaciones sincronizados con lo que tu operación necesita.',
  },
];
