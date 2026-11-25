export function formatIndicatorValue(
  value: number | null | undefined,
  unit?: string,
  fraction = 2,
) {
  if (value === null || value === undefined) return "Sin medición"

  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fraction,
  }).format(value)

  return unit ? `${formatted} ${unit}` : formatted
}

export function formatTarget(
  direction?: string,
  targetValue?: number | null,
  unit?: string,
) {
  if (targetValue === null || targetValue === undefined) {
    return "No definida"
  }

  const prefix =
    direction === "ATLEAST"
      ? "Mínimo"
      : direction === "ATMOST"
        ? "Máximo"
        : direction === "RANGE"
          ? "Rango"
          : "Meta"

  return `${prefix} ${formatIndicatorValue(targetValue, unit)}`
}
