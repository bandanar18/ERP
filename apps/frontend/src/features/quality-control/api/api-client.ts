import { toast } from "sonner";
import { useQcAuthStore } from "../store/auth.store";
import { API_BASE } from "./config";

interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Endpoints públicos de auth del módulo. Un 401 aquí significa credenciales
 * o datos inválidos (NO una sesión expirada), así que no deben forzar logout.
 */
const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/request-password-reset",
  "/auth/reset-password",
];

/** Extrae el mensaje de error del body del backend ({ error } o { message }). */
const parseErrorFromResponse = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.error || errorData.message || fallback;
  } catch {
    return fallback;
  }
};

export const apiFetch = async <T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> => {
  const { token, logout } = useQcAuthStore.getState();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!options.body || !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let url = `${API_BASE}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const message = await parseErrorFromResponse(response, "No autorizado");

    const path = endpoint.split("?")[0];
    if (!PUBLIC_AUTH_ENDPOINTS.some((publicEndpoint) => publicEndpoint === path)) {
      logout();
      window.location.href = "/quality-control/login";
    }

    throw new ApiError(401, message);
  }

  if (!response.ok) {
    const message = await parseErrorFromResponse(response, "Error inesperado");
    toast.error(message);
    throw new ApiError(response.status, message);
  }

  return response.json();
};

/**
 * Descarga un archivo binario (PDF/XLSX) con el token del módulo en el header.
 * El backend envía el archivo como attachment; aquí se convierte a Blob y se
 * dispara la descarga nativa del navegador.
 */
export const downloadFile = async (
  endpoint: string,
  params: Record<string, string | undefined> = {},
  filename = "descarga"
): Promise<void> => {
  const { token, logout } = useQcAuthStore.getState();

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, value);
    }
  });

  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  const response = await fetch(url, { headers });

  if (response.status === 401) {
    logout();
    window.location.href = "/quality-control/login";
    throw new ApiError(401, "No autorizado");
  }

  if (!response.ok) {
    const message = await parseErrorFromResponse(response, "Error al descargar el archivo");
    toast.error(message);
    throw new ApiError(response.status, message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;

  // Preferir el nombre descriptivo que envía el backend (Content-Disposition).
  const disposition = response.headers.get("Content-Disposition");
  let downloadName = filename;
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) downloadName = match[1];
  }
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};
