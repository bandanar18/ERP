import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getQcToken } from './client';

export interface ExportFilters {
  processId?: string;
  startsAt?: string;
  endsAt?: string;
  note?: string;
  chartVariant?: 'LINE' | 'BAR';
}

function buildQuery(filters: ExportFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.append(k, v as string);
  });
  const str = params.toString();
  return str ? `?${str}` : '';
}

async function downloadFile(path: string, filters: ExportFilters, defaultFilename: string) {
  const token = getQcToken();
  const url = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/quality-control${path}${buildQuery(filters)}`;

  if (Platform.OS !== 'web') {
    const fileUri = `${FileSystem.documentDirectory}${defaultFilename}`;
    const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    
    if (downloadRes.status !== 200) {
      let errMsg = `Error al descargar: ${downloadRes.status}`;
      try {
        const text = await FileSystem.readAsStringAsync(downloadRes.uri);
        const data = JSON.parse(text);
        if (data.error) errMsg = data.error;
        else if (data.message) errMsg = data.message;
      } catch {
        // Ignorar
      }
      throw new Error(errMsg);
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(downloadRes.uri);
    }
    return { success: true };
  }

  // Lógica para web
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    let errMsg = `Error al descargar: ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errMsg = data.error;
      else if (data.message) errMsg = data.message;
    } catch {
      // Ignorar
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;

  const disposition = response.headers.get('Content-Disposition');
  let downloadName = defaultFilename;
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) downloadName = match[1];
  }
  
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
  return { success: true };
}

export const exportApi = {
  pdf: (filters: ExportFilters) => downloadFile('/exports/pdf', filters, 'Informe.pdf'),
  xlsx: (filters: ExportFilters) => downloadFile('/exports/xlsx', filters, 'Informe.xlsx'),
};
