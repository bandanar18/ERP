import { format, isToday, isYesterday, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UploadedFile } from '../interfaces';
import { FileCard } from './FileCard';

interface FileGridProps {
  files: UploadedFile[];
  onSelect?: (fileId: string) => void;
  onDownload?: (fileId: string, fileName: string) => void;
  onDelete?: (fileId: string) => void;
  readonly?: boolean;
}

export function FileGrid({ files, onSelect, onDownload, onDelete, readonly }: FileGridProps) {
  // Agrupar archivos por día
  const groupedFiles = files.reduce((acc, file) => {
    const date = new Date(file.uploadDate);
    const dayStart = startOfDay(date).getTime();
    
    if (!acc[dayStart]) {
      acc[dayStart] = [];
    }
    acc[dayStart].push(file);
    return acc;
  }, {} as Record<number, UploadedFile[]>);

  // Ordenar los días del más reciente al más antiguo
  const sortedDays = Object.keys(groupedFiles)
    .map(Number)
    .sort((a, b) => b - a);

  const getGroupTitle = (timestamp: number) => {
    const date = new Date(timestamp);
    const formattedDate = format(date, "d 'de' MMMM, yyyy", { locale: es });

    if (isToday(date)) return { relative: 'Hoy', date: formattedDate };
    if (isYesterday(date)) return { relative: 'Ayer', date: formattedDate };
    
    const diff = differenceInDays(new Date(), date);
    if (diff < 7) return { relative: `Hace ${diff} días`, date: formattedDate };
    
    return { relative: null, date: formattedDate };
  };

  if (files.length === 0) {
    return null; // O un estado vacío si se prefiere
  }

  return (
    <div className="space-y-8">
      {sortedDays.map((dayTimestamp) => {
        const title = getGroupTitle(dayTimestamp);
        
        return (
          <div key={dayTimestamp} className="space-y-4">
            <div className="sticky top-0 z-10 -mx-1 flex items-center gap-4 bg-[#f5f0e8]/90 px-1 py-3 backdrop-blur-xl">
              <h4 className="flex items-baseline gap-2">
                {title.relative && (
                  <span className="text-sm font-bold text-[#111416]">{title.relative}</span>
                )}
                <span className={`capitalize ${title.relative ? 'text-xs font-medium text-[#4e5558]' : 'text-sm font-bold text-[#111416]'}`}>
                  {title.date}
                </span>
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-[#d8d0c4] to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedFiles[dayTimestamp].map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onSelect={onSelect}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  readonly={readonly}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
