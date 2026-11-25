import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getPmToken, PmApiError } from './client';
import type { Project, PhysicalProgress } from '../types';

const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface ProgressReportPayload {
  project?: Partial<Project> & { id?: string; projectCode?: string; projectName?: string };
  progressList?: PhysicalProgress[];
  chartData?: any[];
}

export async function downloadProjectProgressReportPdf(
  projectId: string,
  project?: Project | null,
  progressList?: PhysicalProgress[],
): Promise<{ success: boolean; uri?: string }> {
  const token = getPmToken();
  const code = project?.code || (project as any)?.projectCode || 'PROYECTO';
  const cleanCode = String(code).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Reporte_Avance_${cleanCode}_${dateStr}.pdf`;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Si estamos en plataformas nativas (iOS / Android)
  if (Platform.OS !== 'web') {
    const downloadUrl = `${API_ORIGIN}/api/reports/project-progress/${projectId}/pdf`;
    const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const targetUri = `${targetDir}${filename}`;

    const res = await FileSystem.downloadAsync(downloadUrl, targetUri, {
      headers,
    });

    if (res.status !== 200) {
      let errMsg = `Error al generar PDF: ${res.status}`;
      try {
        const text = await FileSystem.readAsStringAsync(res.uri);
        const data = JSON.parse(text);
        if (data.error) errMsg = data.error;
        else if (data.message) errMsg = data.message;
      } catch {
        // Ignorar parse error
      }
      throw new PmApiError(res.status, errMsg);
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(res.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte de Avance - ${code}`,
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, uri: res.uri };
  }

  // Plataforma Web
  const res = await fetch(`${API_ORIGIN}/api/reports/project-progress/${projectId}/pdf`, {
    headers: {
      ...headers,
      Accept: 'application/pdf',
    },
  });

  if (!res.ok) {
    let errMsg = `Error al generar PDF: ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errMsg = data.error;
      else if (data.message) errMsg = data.message;
    } catch {
      // Ignorar parse error
    }
    throw new PmApiError(res.status, errMsg);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);

  return { success: true };
}

export interface FinancialReportPayload {
  isProjectMode: boolean;
  project?: any;
  projectSnapshot?: any;
  globalData?: any;
  summary?: any;
}

export async function downloadFinancialReportPdf(
  payload: FinancialReportPayload,
): Promise<{ success: boolean; uri?: string }> {
  const token = getPmToken();
  const code = payload.isProjectMode
    ? payload.project?.code || payload.project?.projectCode || 'PROYECTO'
    : 'GLOBAL';
  const cleanCode = String(code).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Reporte_Financiero_Pagos_${cleanCode}_${dateStr}.pdf`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/pdf',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const downloadUrl = `${API_ORIGIN}/api/reports/financial/pdf`;

  if (Platform.OS !== 'web') {
    const res = await fetch(downloadUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errMsg = `Error al generar PDF: ${res.status}`;
      try {
        const data = await res.json();
        if (data.error) errMsg = data.error;
        else if (data.message) errMsg = data.message;
      } catch {
        // Ignorar
      }
      throw new PmApiError(res.status, errMsg);
    }

    const blob = await res.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const targetUri = `${targetDir}${filename}`;
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte Financiero - ${code}`,
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, uri: targetUri };
  }

  // Web
  const res = await fetch(downloadUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Error al generar PDF: ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errMsg = data.error;
      else if (data.message) errMsg = data.message;
    } catch {
      // Ignorar
    }
    throw new PmApiError(res.status, errMsg);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);

  return { success: true };
}

