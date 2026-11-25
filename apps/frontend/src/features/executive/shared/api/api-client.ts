import { useAuthStore } from '../store/auth.store';
import { toast } from 'sonner';

/* ─── Types ─── */

export interface ApiFetchOptions {
  /** Si es true, suprime el toast de error global (para callers que manejan sus propios errores). */
  silent?: boolean;
}

/* ─── Helpers ─── */

function getSpanishErrorMessage(status: number, message?: string): string {
  if (!message) {
    const defaultMessages: Record<number, string> = {
      400: 'Solicitud inválida. Verifica los datos enviados.',
      401: 'Sesión expirada. Inicia sesión nuevamente.',
      403: 'No tenés permisos para realizar esta acción.',
      404: 'El recurso solicitado no existe.',
      409: 'Conflicto: el recurso ya existe o está en uso.',
      422: 'Los datos enviados no son válidos.',
      429: 'Demasiadas solicitudes. Intentá de nuevo en unos segundos.',
      500: 'Error interno del servidor. Intentá de nuevo más tarde.',
      502: 'El servidor no está disponible temporalmente.',
      503: 'Servicio no disponible. Intentá de nuevo más tarde.',
    };
    return defaultMessages[status] || 'Error de conexión con el servidor.';
  }
  return message;
}

// Helper for centralizing 401, 403 and business errors
export async function normalizeApiError(response: Response, silent?: boolean) {
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    errorData = { message: response.statusText };
  }

  const status = response.status;
  const message = getSpanishErrorMessage(status, errorData.message);

  if (status === 401) {
    useAuthStore.getState().logout();
    if (!silent) {
      toast.error('Sesión expirada', { description: 'Tu sesión expiró. Iniciá sesión nuevamente.' });
    }
    return new Error(message);
  }

  if (status === 403) {
    if (!silent) {
      toast.error('Acceso denegado', { description: message });
    }
    return new Error(message);
  }

  // For other errors, show toast unless silent
  if (!silent) {
    toast.error('Error en la operación', { description: message });
  }

  return new Error(message);
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<Response> {
  const { token } = useAuthStore.getState();
  
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw await normalizeApiError(response, options?.silent);
  }

  return response;
}
