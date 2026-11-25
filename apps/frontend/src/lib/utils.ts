import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLocalDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  // Se ajusta el offset de timezone para evitar que fechas guardadas como UTC
  // se muestren un día antes en zonas horarias negativas (ej. UTC-3).
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + offset);
  return localDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}
