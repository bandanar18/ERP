import { useEffect, useState } from 'react';
import { FileUploadZone } from './FileUploadZone';
import { FileGrid } from './FileGrid';
import { useFileGallery } from '../hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, X, Trash2 } from 'lucide-react';
import { FileCard as FileFormatIcon, resolveFileFormat } from '@/components/ui/file-card-collections';
import { ErpModal } from './ErpModal';

interface FileGalleryProps {
  entityType: string;
  entityId: string;
  readonly?: boolean;
}

export function FileGallery({ entityType, entityId, readonly }: FileGalleryProps) {
  const {
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
  } = useFileGallery(entityType, entityId);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileIdToDelete, setFileIdToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [fetchFiles, fetchStats]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[#d9772f]" />
            <h3 className="text-[15px] font-bold text-[#111416]">Galería de Archivos</h3>
          </div>
          {stats && (
            <>
              <Badge variant="outline" className="rounded-md border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558]">
                {stats.totalFiles} archivos
              </Badge>
              <Badge variant="outline" className="rounded-md border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558]">
                {formatFileSize(stats.totalSize)}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Zona de upload */}
      {!readonly && (
        <FileUploadZone
          onUpload={async (file, metadata) => {
            await uploadFile(file, metadata);
          }}
          uploading={uploading}
          maxSize={50 * 1024 * 1024}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-[#a84730]">
          <span className="text-sm font-semibold">{error}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-[#a84730] hover:bg-[#edb6a5]/40 hover:text-[#8a3a24]"
            onClick={() => setSelectedFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Grid de archivos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8d0c4] bg-[#fffdf9] py-12 text-center">
          <FolderOpen className="mx-auto mb-4 h-12 w-12 text-[#d8d0c4]" />
          <p className="text-[#4e5558]">No hay archivos aún</p>
        </div>
      ) : (
        <FileGrid
          files={files}
          onSelect={setSelectedFile}
          onDownload={downloadFile}
          onDelete={!readonly ? (fileId) => setFileIdToDelete(fileId) : undefined}
          readonly={readonly}
        />
      )}

      {/* Preview modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="w-full max-w-2xl overflow-auto rounded-2xl border border-[#d8d0c4] bg-[#fffdf9] p-4 sm:p-6 max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold text-[#111416]">
                  {files.find(f => f.id === selectedFile)?.originalName}
                </h3>
                {files.find(f => f.id === selectedFile)?.description && (
                  <p className="mt-1 text-sm text-[#4e5558]">
                    {files.find(f => f.id === selectedFile)?.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-md text-[#4e5558] hover:bg-[#f5f0e8]/60 hover:text-[#111416]"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {(() => {
              const file = files.find(f => f.id === selectedFile);
              if (!file) return null;

              if (file.mimeType.startsWith('image/')) {
                return (
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="w-full rounded-lg border border-[#d8d0c4]"
                  />
                );
              }

              if (file.mimeType.startsWith('video/')) {
                return (
                  <div className="space-y-4">
                    <video
                      src={file.url}
                      controls
                      className="w-full rounded-lg border border-[#d8d0c4]"
                      preload="metadata"
                    >
                      Tu navegador no soporta la reproducción de video.
                    </video>
                    <p className="text-center text-xs text-[#4e5558]">
                      {file.originalName}
                    </p>
                  </div>
                );
              }

              if (file.mimeType === 'application/pdf') {
                return (
                  <iframe
                    src={file.url}
                    title={file.originalName}
                    className="w-full h-[60vh] rounded-lg border border-[#d8d0c4]"
                  />
                );
              }

              return (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 origin-center scale-150">
                    <FileFormatIcon formatFile={resolveFileFormat(file.originalName, file.mimeType)} />
                  </div>
                  <p className="text-[#4e5558]">
                    Vista previa no disponible para este tipo de archivo
                  </p>
                </div>
              );
            })()}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {!readonly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const id = selectedFile;
                    setSelectedFile(null);
                    setFileIdToDelete(id);
                  }}
                  className="w-full rounded-lg border-[#edb6a5] bg-[#fff0eb] text-xs font-bold text-[#a84730] hover:bg-[#edb6a5]/50 hover:text-[#8a3a24] sm:w-auto"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              )}
              <Button
                onClick={() => {
                  const file = files.find(f => f.id === selectedFile);
                  if (file) {
                    downloadFile(file.id, file.originalName);
                    setSelectedFile(null);
                  }
                }}
                className="w-full rounded-lg border border-[#d9772f] bg-[#d9772f] text-white hover:border-[#b9561d] hover:bg-[#b9561d] sm:w-auto sm:ml-auto"
              >
                Descargar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ErpModal
        open={Boolean(fileIdToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setFileIdToDelete(null);
        }}
        eyebrow="Galería / Confirmación"
        title="Eliminar Archivo"
        description="¿Estás seguro de que deseas eliminar este archivo? Esta acción es irreversible."
        maxWidth="max-w-[420px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setFileIdToDelete(null)}
              className="w-full rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416] sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={async () => {
                if (!fileIdToDelete) return;
                try {
                  setDeleting(true);
                  await deleteFile(fileIdToDelete);
                  setFileIdToDelete(null);
                } finally {
                  setDeleting(false);
                }
              }}
              className="w-full rounded-lg border border-[#c85454] bg-[#c85454] text-white hover:border-[#a83e3e] hover:bg-[#a83e3e] sm:w-auto"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        {(() => {
          const target = files.find((f) => f.id === fileIdToDelete);
          if (!target) return null;
          return (
            <div className="rounded-lg border border-[#d8d0c4] bg-[#f5f0e8]/40 p-3.5">
              <p className="truncate text-sm font-semibold text-[#111416]">
                {target.originalName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#4e5558]">
                <span>{formatFileSize(target.size)}</span>
                {target.category && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{target.category}</span>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </ErpModal>
    </div>
  );
}
