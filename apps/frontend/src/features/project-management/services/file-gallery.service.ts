import type { UploadedFile, FileListResponse, FileStats } from '../interfaces';
import { fetchWithRefresh } from '@/lib/api/fetchWithRefresh';

const API_URL = '/api/file-gallery';

export const fileGalleryService = {
  async uploadFile(
    entityType: string,
    entityId: string,
    file: File,
    metadata?: { description?: string; category?: string }
  ): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.description) formData.append('description', metadata.description);
    if (metadata?.category) formData.append('category', metadata.category);

    const response = await fetchWithRefresh(`${API_URL}/${entityType}/${entityId}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data.file;
  },

  async getFiles(
    entityType: string,
    entityId: string,
    filters?: {
      category?: string;
      mimeType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FileListResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.mimeType) params.append('mimeType', filters.mimeType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const url = `${API_URL}/${entityType}/${entityId}${params.toString() ? `?${params}` : ''}`;
    const response = await fetchWithRefresh(url, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getFile(id: string): Promise<UploadedFile> {
    const response = await fetchWithRefresh(`${API_URL}/file/${id}`, {
      method: 'GET'
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async downloadFile(id: string): Promise<Blob> {
    const response = await fetchWithRefresh(`${API_URL}/download/${id}`, {
      method: 'GET'
    });
    if (!response.ok) {
      const data = await response.json();
      throw data;
    }
    return await response.blob();
  },

  async deleteFile(id: string): Promise<{ message: string }> {
    const response = await fetchWithRefresh(`${API_URL}/file/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getStats(
    entityType: string,
    entityId: string
  ): Promise<FileStats> {
    const response = await fetchWithRefresh(
      `${API_URL}/${entityType}/${entityId}/stats`,
      { method: 'GET' }
    );
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }
};
