import { downloadFile } from "./api-client";

export interface ExportFilters {
  processId?: string;
  startsAt?: string;
  endsAt?: string;
  note?: string;
  chartVariant?: "LINE" | "BAR";
}

const today = () => new Date().toISOString().slice(0, 10);

export const exportApi = {
  pdf: (filters: ExportFilters) =>
    downloadFile("/exports/pdf", { ...filters }, `Informe-Calidad_${today()}.pdf`),
  xlsx: (filters: ExportFilters) =>
    downloadFile("/exports/xlsx", { ...filters }, `Informe-Calidad_${today()}.xlsx`),
};
