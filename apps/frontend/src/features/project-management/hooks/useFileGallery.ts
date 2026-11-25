import { useState, useCallback } from 'react';
import { fileGalleryService } from "../api";
import type { UploadedFile, FileStats } from '../interfaces';

export function useFileGallery(entityType: string, entityId: string) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (filters?: {
    category?: string;
    mimeType?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileGalleryService.getFiles(
        entityType,
        entityId,
        filters
      );
      setFiles(response.files);
    } catch (err: any) {
      setError(err.error || 'Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await fileGalleryService.getStats(entityType, entityId);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  }, [entityType, entityId]);

  const uploadFile = useCallback(async (
    file: File,
    metadata?: { description?: string; category?: string }
  ) => {
    try {
      setUploading(true);
      setError(null);
      const uploaded = await fileGalleryService.uploadFile(
        entityType,
        entityId,
        file,
        metadata
      );
      setFiles(prev => [uploaded, ...prev]);
      await fetchStats();
      return uploaded;
    } catch (err: any) {
      setError(err.error || 'Error al subir archivo');
      throw err;
    } finally {
      setUploading(false);
    }
  }, [entityType, entityId, fetchStats]);

  const deleteFile = useCallback(async (id: string) => {
    try {
      setError(null);
      await fileGalleryService.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      await fetchStats();
    } catch (err: any) {
      setError(err.error || 'Error al eliminar archivo');
      throw err;
    }
  }, [fetchStats]);

  const downloadFile = useCallback(async (id: string, fileName: string) => {
    try {
      const blob = await fileGalleryService.downloadFile(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.error || 'Error al descargar archivo');
      throw err;
    }
  }, []);

  return {
    files,
    stats,
    loading,
    uploading,
    error,
    fetchFiles,
    fetchStats,
    uploadFile,
    deleteFile,
    downloadFile
  };
}
