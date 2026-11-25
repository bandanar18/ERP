import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/features/executive/components/ui/input';
import { Button } from '@/features/executive/components/ui/button';
import StatsCards from '../../components/mvpblocks/ui/stats-cards';
import { DataTable, StatusBadge, type Column } from '../../components/mvpblocks/ui/data-table';
import { useConsolidatedMatrix, useIndicatorChart, useProcurementDistribution } from '../../shared/hooks/useIndicators';
import { useAuthStore } from '../../shared/store/auth.store';
import { downloadExport } from '../../shared/api/reports.api';
import {
  Search, AlertCircle,
  Activity, CheckCircle2, XCircle, BarChart3, TrendingUp,
} from 'lucide-react';

import ComplianceChart from '../../components/mvpblocks/ui/compliance-chart';
import { ExportModule } from '../../components/dashboard/ExportModule';
import { IndicatorTrendChart } from '../../components/dashboard/IndicatorTrendChart';
import { ProcurementSupplierPieChart } from '../../components/dashboard/ProcurementSupplierPieChart';
import { ProcurementSupplierBarChart } from '../../components/dashboard/ProcurementSupplierBarChart';
import type { StatItem } from '../../components/mvpblocks/ui/stats-cards';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';

const ITEMS_PER_PAGE = 5;

const freqLabel: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  PROJECT_BASED: 'Por Proyecto',
};

const fmtVal = (v: any) => {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'number') return Number(v.toFixed(2)).toString();
  return v;
};

export const DirectorHomePage: React.FC = () => {
  useAuthStore(); // token gestionado internamente por apiFetch
  const [searchTerm, setSearchTerm] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data: matrix, isLoading: matrixLoading, error: matrixError } = useConsolidatedMatrix();

  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');

  useEffect(() => {
    if (matrix && matrix.length > 0 && !selectedIndicatorId) {
      setSelectedIndicatorId('GENERAL');
    }
  }, [matrix, selectedIndicatorId]);

  const { data: trendData = [], isLoading: isTrendLoading } = useIndicatorChart(selectedIndicatorId || null);

  const selectedIndicator = useMemo(() => {
    return matrix?.find((ind: any) => ind.id === selectedIndicatorId);
  }, [matrix, selectedIndicatorId]);

  const isPieChart = selectedIndicator?.chartType === 'PIE' || selectedIndicator?.code === 'KPI-PROC-001';
  const { data: distributionData, isLoading: isDistributionLoading } = useProcurementDistribution(
    isPieChart ? selectedIndicatorId : null,
  );

  // Compute compliance stats from matrix for consistent display
  const matrixStats = useMemo(() => {
    if (!matrix || matrix.length === 0) return { green: 0, red: 0, gray: 0, total: 0, pct: 0 };
    const green = matrix.filter((r: any) => r.complianceStatus === 'GREEN').length;
    const red = matrix.filter((r: any) => r.complianceStatus === 'RED').length;
    const gray = matrix.filter((r: any) => !r.complianceStatus || r.complianceStatus === 'GRAY').length;
    const total = green + red + gray;
    return { green, red, gray, total, pct: total > 0 ? Math.round((green / total) * 100) : 0 };
  }, [matrix]);

  const statItems: StatItem[] = useMemo(() => [
    {
      title: 'Total Indicadores',
      value: matrixStats.total,
      icon: Activity,
      description: 'Registrados en el sistema',
      gradient: 'from-slate-500 to-slate-600',
    },
    {
      title: 'Cumplen',
      value: matrixStats.green,
      icon: CheckCircle2,
      description: 'Semáforo en verde',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'No Cumplen',
      value: matrixStats.red,
      icon: XCircle,
      description: 'Semáforo en rojo',
      gradient: 'from-red-500 to-orange-500',
    },
    {
      title: 'Sin Dato',
      value: matrixStats.gray,
      icon: TrendingUp,
      description: 'Sin medición registrada',
      gradient: 'from-gray-400 to-gray-500',
    },
  ], [matrixStats]);

  const filteredMatrix = useMemo(() =>
    matrix?.filter((row: any) =>
      row.process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.code?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [],
  [matrix, searchTerm],
  );

  const { totalPages, paginatedItems } = usePagination(filteredMatrix, ITEMS_PER_PAGE);
  const visibleMatrix = paginatedItems(page);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);

  // handleExport logic is now inlined in ExportModule onExport prop

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'process',
      label: 'Proceso',
      render: (row: any) => (
        <div>
          <div className="font-semibold">{row.process}</div>
          <div className="text-xs font-mono mt-0.5 text-muted-foreground">{row.processCode}</div>
        </div>
      ),
    },
    {
      key: 'indicator',
      label: 'Indicador',
      render: (row: any) => (
        <div>
          <div className="font-semibold max-w-[250px] truncate" title={row.name}>{row.name}</div>
          <div className="text-xs font-mono mt-0.5 text-muted-foreground">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'frequency',
      label: 'Frecuencia',
      align: 'center',
      render: (row: any) => <span className="text-xs">{freqLabel[row.frequency] || row.frequency || '-'}</span>,
      hide: 'lg',
    },
    {
      key: 'targetValue',
      label: 'Meta',
      align: 'center',
      render: (row: any) => (
        <span className="font-mono font-medium">
          {row.targetValue !== null 
            ? `${row.direction === 'AT_MOST' ? 'Máximo ' : row.direction === 'AT_LEAST' ? 'Mínimo ' : row.direction === 'RANGE' ? 'Entre ' : ''}${row.targetValue} ${row.unit || ''}`
            : '-'}
        </span>
      ),
      hide: 'md',
    },
    {
      key: 'latestMeasurement',
      label: 'Resultado',
      align: 'center',
      render: (row: any) => (
        <span className="bold font-mono text-base">{fmtVal(row.latestMeasurement)}</span>
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
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]" title={row.observation || ''}>
          {row.observation || '-'}
        </p>
      ),
      hide: 'lg',
    },
  ], []);

  return (
    <div className="space-y-8 pb-12">
      {/* Export Error Banner */}
      {exportError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium text-sm">{exportError}</p>
          <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={() => setExportError(null)}>
            Cerrar
          </Button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panel de Dirección</h2>
        <p className="text-muted-foreground mt-1">Visión ejecutiva del desempeño corporativo por proceso e indicador.</p>
      </div>

      {matrixLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <StatsCards items={statItems} />
      )}

      {/* ── Compliance Distribution ── */}
      <div className="grid grid-cols-1">
        <ComplianceChart matrix={matrix} loading={matrixLoading} />
      </div>

      {/* ── Trend Chart & Export ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análisis y Exportación
          </h3>
          <p className="text-sm text-muted-foreground">Filtra, analiza y exporta indicadores corporativos.</p>
        </div>
        
        <ExportModule
          indicators={matrix || []}
          selectedIndicatorId={selectedIndicatorId}
          onIndicatorChange={setSelectedIndicatorId}
          isExporting={isExporting as any}
          loading={matrixLoading}
          onExport={async (format, startsAt, endsAt) => {
            try {
              setExportError(null);
              setIsExporting(format);
              await downloadExport(format, { startsAt, endsAt });
            } catch (err: any) {
              setExportError(err?.message || `Error al exportar ${format.toUpperCase()}`);
            } finally {
              setIsExporting(null);
            }
          }}
        />

        <section className="space-y-6">
          <IndicatorTrendChart
            title={selectedIndicatorId === 'GENERAL' ? "Promedio Consolidado Corporativo" : (selectedIndicator?.name ?? "Indicador")}
            unit={selectedIndicatorId === 'GENERAL' ? "%" : (selectedIndicator?.unit ?? "")}
            data={trendData}
            isLoading={isTrendLoading}
          />

          {isPieChart && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ProcurementSupplierPieChart
                title="Criterio de clasificación de proveedores"
                distribution={distributionData}
                isLoading={isDistributionLoading}
              />
              <ProcurementSupplierBarChart
                title="Cantidad de proveedores por clasificación"
                distribution={distributionData}
                isLoading={isDistributionLoading}
              />
            </div>
          )}
        </section>
      </div>

      {/* ── Matrix Table ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Matriz Consolidada de Indicadores
          </h3>
          <p className="text-sm text-muted-foreground">Estado de cumplimiento por proceso e indicador.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proceso, indicador o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        title="Indicadores Corporativos"
        titleIcon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        columns={columns}
        data={visibleMatrix}
        loading={matrixLoading}
        error={matrixError ? 'Error al cargar la matriz consolidada.' : null}
        emptyMessage={searchTerm ? 'No se encontraron indicadores con ese criterio.' : 'No hay indicadores registrados.'}
      />

      <BasicPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showFirstLast
        size="sm"
        className="pt-2"
      />

      {filteredMatrix.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-medium text-foreground">
              {filteredMatrix.filter((r: any) => r.complianceStatus === 'GREEN').length} cumplen
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-foreground">
              {filteredMatrix.filter((r: any) => r.complianceStatus === 'RED').length} no cumplen
            </span>
          </span>
          <span className="text-muted-foreground/50">&middot;</span>
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground">{filteredMatrix.length}</strong> indicadores
          </span>
        </div>
      )}
    </div>
  );
};
