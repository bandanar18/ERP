import { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onUpload: (file: File, metadata?: { description?: string; category?: string }) => Promise<void>;
  uploading?: boolean;
  maxSize: number;
}

export function FileUploadZone({ onUpload, uploading, maxSize }: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size <= maxSize) {
        setSelectedFile(file);
      } else {
        alert(`El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`);
      }
    }
  }, [maxSize]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= maxSize) {
        setSelectedFile(file);
      } else {
        alert(`El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`);
      }
    }
  }, [maxSize]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    await onUpload(selectedFile, {
      description: description || undefined,
      category: category || undefined
    });
    setSelectedFile(null);
    setDescription('');
    setCategory('');
  }, [selectedFile, description, category, onUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-8 transition-all',
          dragActive ? 'border-[#d9772f] bg-[#d9772f]/5' : 'border-[#d8d0c4] bg-[#fffdf9] hover:border-[#b9561d]'
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <Upload className={cn(
            'mb-4 h-10 w-10 transition-colors',
            dragActive ? 'text-[#d9772f]' : 'text-[#8d918f]'
          )} />
          <p className="mb-1 text-sm font-medium text-[#111416]">
            Arrastra un archivo aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-[#4e5558]">
            Máximo {formatFileSize(maxSize)}. Cualquier tipo de archivo permitido.
          </p>
        </div>
      </div>

      {/* File selected */}
      {selectedFile && (
        <div className="space-y-3 rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#d8d0c4] bg-[#f5f0e8]/50 text-[#b9561d]">
                <File className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#111416]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#4e5558]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
              className="h-8 w-8 shrink-0 rounded-md text-[#4e5558] hover:bg-[#f5f0e8]/60 hover:text-[#111416]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 text-sm text-[#111416] outline-none transition-colors placeholder:text-[#8d918f] focus:border-[#d9772f] focus:ring-[#d9772f]/25"
            disabled={uploading}
          />

          <input
            type="text"
            placeholder="Categoría (opcional, ej: documentos, imágenes, planos)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-3 text-sm text-[#111416] outline-none transition-colors placeholder:text-[#8d918f] focus:border-[#d9772f] focus:ring-[#d9772f]/25"
            disabled={uploading}
          />

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full rounded-lg border border-[#d9772f] bg-[#d9772f] text-white hover:border-[#b9561d] hover:bg-[#b9561d]"
          >
            {uploading ? 'Subiendo...' : 'Subir archivo'}
          </Button>
        </div>
      )}
    </div>
  );
}
