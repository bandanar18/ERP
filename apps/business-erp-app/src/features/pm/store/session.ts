import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { PmUser } from '../types';

const TOKEN_KEY = 'pm_token';
const USER_KEY = 'pm_user';

const isWeb = Platform.OS === 'web';

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try { localStorage.setItem(key, value); } catch (e) {}
  } else {
    try { await SecureStore.setItemAsync(key, value); } catch (e) {}
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  } else {
    try { return await SecureStore.getItemAsync(key); } catch (e) { return null; }
  }
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    try { localStorage.removeItem(key); } catch (e) {}
  } else {
    try { await SecureStore.deleteItemAsync(key); } catch (e) {}
  }
}

/** Persiste la sesión (token + usuario). */
export async function saveSession(token: string, user: PmUser): Promise<void> {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

/** Recupera la sesión persistida, o null si no existe. */
export async function loadSession(): Promise<{ token: string; user: PmUser } | null> {
  const token = await getItem(TOKEN_KEY);
  const userRaw = await getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) as PmUser };
  } catch {
    return null;
  }
}

/** Limpia la sesión persistida. */
export async function clearSession(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
}
