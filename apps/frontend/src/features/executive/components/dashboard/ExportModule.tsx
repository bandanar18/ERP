import React, { useState } from 'react';
import { IndicatorCombobox, type IndicatorOption } from './IndicatorCombobox';
import { Button } from '@/features/executive/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Input } from '@/features/executive/components/ui/input';

export type ExportModuleProps = {
  indicators: any[];
  selectedIndicatorId: string;
  onIndicatorChange: (id: string) => void;
  onExport: (format: 'xlsx' | 'pdf', startsAt?: string, endsAt?: string) => Promise<void>;
  isExporting: 'xlsx' | 'pdf' | null;
  loading?: boolean;
};

export const ExportModule: React.FC<ExportModuleProps> = ({
  indicators,
  selectedIndicatorId,
  onIndicatorChange,
  onExport,
  isExporting,
  loading = false,
}) => {
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');

  // Transform raw indicator matrix rows into the expected IndicatorOption shape for the combobox
  const comboboxOptions: IndicatorOption[] = React.useMemo(() => {
    return (indicators || []).map((ind: any) => ({
      id: ind.id,
      code: ind.code,
      name: ind.name,
      process: {
        id: ind.processCode, // Not strictly used for mapping here, but good for uniqueness if needed
        name: ind.process,
        code: ind.processCode,
      },
    }));
  }, [indicators]);

  return (
    <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-lg bg-card">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {/* Indicator Selector */}
        <div className="flex-1 w-full">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Indicador o Proceso</label>
          <IndicatorCombobox
            indicators={comboboxOptions}
            value={selectedIndicatorId}
            onChange={onIndicatorChange}
            disabled={loading}
          />
        </div>

        {/* Date Range */}
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fecha de inicio</label>
          <Input
            type="date"
            className="w-full sm:w-40"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fecha límite</label>
          <Input
            type="date"
            className="w-full sm:w-40"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => onExport('xlsx', startsAt, endsAt)}
            disabled={isExporting !== null || loading}
            className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white hover:shadow-md transition-all shadow-sm"
            title="Exportar consolidado a Excel"
          >
            {isExporting === 'xlsx' ? (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => onExport('pdf', startsAt, endsAt)}
            disabled={isExporting !== null || loading}
            className="bg-red-600 text-white hover:bg-red-700 hover:shadow-md transition-all shadow-sm border border-transparent"
            title="Exportar fichas técnicas a PDF"
          >
            {isExporting === 'pdf' ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
