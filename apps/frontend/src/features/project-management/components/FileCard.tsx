import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCard as FileFormatIcon, resolveFileFormat } from '@/components/ui/file-card-collections';
import type { UploadedFile } from '../interfaces';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: UploadedFile;
  onSelect?: (fileId: string) => void;
  onDownload?: (fileId: string, fileName: string) => void;
  onDelete?: (fileId: string) => void;
  readonly?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export function FileCard({ file, onSelect, onDownload, onDelete, readonly }: FileCardProps) {
  const formatFile = resolveFileFormat(file.originalName, file.mimeType);

  return (
    <div
      className={cn(
        'group flex h-full flex-col rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-all hover:border-[#b9561d] hover:shadow-md',
        onSelect && 'cursor-pointer'
      )}
      onClick={() => onSelect?.(file.id)}
    >
      <div className="flex-1 flex flex-col">
        <div className="mb-3 flex justify-center pt-1">
          <FileFormatIcon formatFile={formatFile} />
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="truncate text-sm font-semibold text-[#111416]" title={file.originalName}>
              {file.originalName}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-[#4e5558]">{formatFileSize(file.size)}</span>
              <span className="h-1 w-1 rounded-full bg-[#d8d0c4]"></span>
              <span className="text-[10px] text-[#4e5558]">{format(new Date(file.uploadDate), 'dd/MM/yy', { locale: es })}</span>
            </div>
          </div>
        </div>

        {file.description && (
          <p className="mt-3 line-clamp-2 text-xs text-[#4e5558]" title={file.description}>
            {file.description}
          </p>
        )}
      </div>

      {/* Actions & Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#d8d0c4]/50 pt-3">
        <div className="flex-1">
          {file.category && (
            <Badge variant="secondary" className="rounded-md border-[#d8d0c4] bg-[#f5f0e8]/60 text-[10px] font-medium text-[#4e5558] hover:bg-[#ece6dc]">
              {file.category}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 transition-opacity">
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-[#4e5558] hover:bg-[#f5f0e8]/60 hover:text-[#5e8fc2]"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file.id, file.originalName);
              }}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && !readonly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-[#4e5558] hover:bg-[#fff0eb] hover:text-[#c85454]"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
