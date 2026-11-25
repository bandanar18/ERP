import type { QcUser } from '../types';

const TOKEN_KEY = 'qc_token';
const USER_KEY = 'qc_user';

// Fallback en memoria para plataformas sin localStorage (native).
const memoryStore: Record<string, string> = {};

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // ignore
  }
  return null;
}

function setItem(key: string, value: string): void {
  const storage = getStorage();
  if (storage) storage.setItem(key, value);
  else memoryStore[key] = value;
}

function getItem(key: string): string | null {
  const storage = getStorage();
  if (storage) return storage.getItem(key);
  return memoryStore[key] ?? null;
}

function removeItem(key: string): void {
  const storage = getStorage();
  if (storage) storage.removeItem(key);
  else delete memoryStore[key];
}

/** Persiste la sesión QC (token + usuario). */
export async function saveQcSession(token: string, user: QcUser): Promise<void> {
  setItem(TOKEN_KEY, token);
  setItem(USER_KEY, JSON.stringify(user));
}

/** Recupera la sesión QC persistida, o null si no existe. */
export async function loadQcSession(): Promise<{ token: string; user: QcUser } | null> {
  const token = getItem(TOKEN_KEY);
  const userRaw = getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) as QcUser };
  } catch {
    return null;
  }
}

/** Limpia la sesión QC persistida. */
export async function clearQcSession(): Promise<void> {
  removeItem(TOKEN_KEY);
  removeItem(USER_KEY);
}
