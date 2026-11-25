import React, { useState, useMemo, useEffect } from 'react';
import { useConsolidatedMatrix } from '../../shared/hooks/useIndicators';
import { downloadExport } from '../../shared/api/reports.api';
import { Input } from '@/features/executive/components/ui/input';
import { Search, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/features/executive/components/ui/button';
import { Label } from '@/features/executive/components/ui/label';
import { Textarea } from '@/features/executive/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { DataTable, StatusBadge, type Column } from '../../components/mvpblocks/ui/data-table';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';
import { apiFetch } from '../../shared/api/api-client';
import { apiUrl } from '../../shared/api/config';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 15;

interface ProcessOption {
  id: string;
  code: string;
  name: string;
}

export const ConsolidatedReportPage: React.FC = () => {
  const { data: matrix, isLoading, error } = useConsolidatedMatrix();
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Report generation state
  const [processId, setProcessId] = useState('all');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [note, setNote] = useState('');
  const [chartVariant, setChartVariant] = useState<'LINE' | 'BAR'>('BAR');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    apiFetch(apiUrl('/admin/processes'))
      .then((r) => r.json())
      .then(setProcesses)
      .catch(() => {});
  }, []);

  // Unique processes from matrix for the table filter
  const processOptions = useMemo(() => {
    const names = new Set<string>();
    matrix?.forEach((row: any) => {
      if (row.process) names.add(row.process);
    });
    return Array.from(names).sort();
  }, [matrix]);

  const filteredMatrix = useMemo(() => {
    let result = matrix || [];
    if (filterProcess !== 'all') {
      result = result.filter((row: any) => row.process === filterProcess);
    }
    if (searchTerm) {
      result = result.filter((row: any) =>
        row.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return result;
  }, [matrix, searchTerm, filterProcess]);

  const { totalPages, paginatedItems } = usePagination(filteredMatrix, ITEMS_PER_PAGE);
  const visibleMatrix = paginatedItems(page);

  useEffect(() => { setPage(1); }, [searchTerm, filterProcess]);
  useEffect(() => { if (page > totalPages) setPage(Math.max(totalPages, 1)); }, [page, totalPages]);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    if (startsAt && endsAt && startsAt > endsAt) {
      toast.error('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    setIsExporting(true);
    try {
      await downloadExport(format, {
        processId: processId === 'all' ? undefined : processId,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        note: note.trim() || undefined,
        chartVariant,
      });
      toast.success(format === 'pdf' ? 'Reporte PDF generado correctamente.' : 'Reporte Excel generado correctamente.');
    } catch (err: any) {
      toast.error(err?.message ?? 'No fue posible generar el reporte.');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'process',
      label: 'Proceso',
      render: (row: any) => (
        <div>
          <div className="font-semibold">{row.process}</div>
          <div className="text-xs font-mono mt-0.5">{row.processCode}</div>
        </div>
      ),
    },
    {
      key: 'indicator',
      label: 'Indicador',
      render: (row: any) => (
        <div>
          <div className="font-semibold max-w-[250px]" title={row.name}>{row.name}</div>
          <div className="text-xs font-mono mt-0.5">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'frequency',
      label: 'Frecuencia',
      align: 'center',
      render: (row: any) => {
        const freqMap: Record<string, string> = {
          MONTHLY: 'Mensual',
          QUARTERLY: 'Trimestral',
          SEMIANNUAL: 'Semestral',
          PROJECT_BASED: 'Por Proyecto',
          ANNUAL: 'Anual',
        };
        return <span className="text-xs font-medium">{freqMap[row.frequency] || row.frequency || '-'}</span>;
      },
    },
    {
      key: 'targetValue',
      label: 'Meta',
      align: 'center',
      render: (row: any) => (
        <span className="font-mono font-medium">
          {row.targetValue !== null
            ? `${row.direction === 'AT_MOST' ? 'Máximo ' : row.direction === 'AT_LEAST' ? 'Mínimo ' : row.direction === 'RANGE' ? 'Entre ' : ''}${row.targetValue} ${row.unit}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'latestMeasurement',
      label: 'Resultado',
      align: 'center',
      render: (row: any) => (
        <span className="font-bold font-mono text-base">{row.latestMeasurement !== null ? row.latestMeasurement : '-'}</span>
      ),
    },
    {
      key: 'complianceStatus',
      label: 'Conclusión',
      align: 'center',
      render: (row: any) => {
        if (row.complianceStatus === 'GREEN') return <StatusBadge label="CUMPLE" variant="success" />;
        if (row.complianceStatus === 'RED') return <StatusBadge label="NO CUMPLE" variant="danger" />;
        return <StatusBadge label="Pendiente de medición" variant="default" />;
      },
    },
    {
      key: 'observation',
      label: 'Observación',
      render: (row: any) => (
        <p className="text-xs text-muted-foreground line-clamp-3 max-w-[250px]" title={row.observation || 'Sin observación'}>
          {row.observation || '-'}
        </p>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">

      {/* ── Formulario de generación de informe ── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Generar informe consolidado</CardTitle>
          <CardDescription>
            Selecciona el proceso, el intervalo de consulta y una nota opcional. El informe filtrará mediciones cuyos periodos se intersequen con el rango indicado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="report-process">Proceso</Label>
              <select
                id="report-process"
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Todos los procesos</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-start">Fecha de inicio</Label>
              <Input
                id="report-start"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-end">Fecha de fin</Label>
              <Input
                id="report-end"
                type="date"
                min={startsAt || undefined}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-chart">Tipo de gráfica</Label>
              <select
                id="report-chart"
                value={chartVariant}
                onChange={(e) => setChartVariant(e.target.value as 'LINE' | 'BAR')}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="BAR">Barras</option>
                <option value="LINE">Líneas / Tendencia</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-note">
              Nota para el reporte <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="report-note"
              value={note}
              maxLength={2000}
              rows={3}
              placeholder="Ej.: Informe generado para revisión de la Gerencia de Operaciones."
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{note.length}/2000 caracteres</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="bg-red-700 hover:bg-red-800 text-white gap-2"
              disabled={isExporting}
              onClick={() => handleExport('pdf')}
            >
              {isExporting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              disabled={isExporting}
              onClick={() => handleExport('xlsx')}
              className="gap-2"
            >
              {isExporting ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabla de vista previa de la matriz ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Panorama Corporativo de Desempeño
          </h2>
          <p className="text-muted-foreground mt-1">
            Vista ejecutiva transversal de cumplimiento por proceso y gerencia.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
          >
            <option value="all">Reporte General (Todos)</option>
            {processOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proceso o indicador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Error al cargar la matriz consolidada.</p>
        </div>
      )}

      <DataTable
        title="Matriz Consolidada de Desempeño"
        columns={columns}
        data={visibleMatrix}
        loading={isLoading}
        error={error ? 'Error al cargar la matriz consolidada.' : null}
        emptyMessage="No se encontraron registros."
      />

      <BasicPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showFirstLast
        size="sm"
        className="pt-2"
      />
    </div>
  );
};
