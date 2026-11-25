import React, { useState, useMemo } from 'react';
import { Input } from '@/features/executive/components/ui/input';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { useMeasurements } from '../../shared/hooks/useMeasurements';
import { Search, History } from 'lucide-react';
import { DataTable, StatusBadge, type Column } from '../../components/mvpblocks/ui/data-table';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';

const ITEMS_PER_PAGE = 10;

const fmt = (v: any) => typeof v === 'number' ? Number(v.toFixed(2)) : v;

export const OwnerHistoryPage: React.FC = () => {
  const { data: processes } = useMyProcesses();
  const { data: measurements, isLoading, error } = useMeasurements();
  const [searchTerm, setSearchTerm] = useState('');
  const [processFilter, setProcessFilter] = useState('');
  const [page, setPage] = useState(1);

  const userProcessIds = useMemo(() => 
    new Set(processes?.map((p: any) => p.id) || []), [processes]);

  const allFiltered = useMemo(() => {
    const userM = (measurements || []).filter((m: any) => {
      const procId = m.version?.indicator?.processId;
      return procId && userProcessIds.has(procId) && (
        !processFilter || m.version?.indicator?.processId === processFilter
      ) && (
        m.version?.indicator?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.version?.indicator?.process?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    return userM.sort((a: any, b: any) =>
      new Date(b.period?.startsAt || 0).getTime() - new Date(a.period?.startsAt || 0).getTime(),
    );
  }, [measurements, userProcessIds, searchTerm, processFilter]);

  const { totalPages, paginatedItems } = usePagination(allFiltered, ITEMS_PER_PAGE);
  const safePage = Math.min(page, totalPages);
  const paginated = paginatedItems(safePage);

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'period',
      label: 'Período',
      render: (m: any) => (
        <span className="text-[10px] font-mono text-muted-foreground">
          {m.period?.startsAt ? new Date(m.period.startsAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'process',
      label: 'Proceso',
      render: (m: any) => (
        <span className="text-sm font-medium">{m.version?.indicator?.process?.name || '—'}</span>
      ),
    },
    {
      key: 'indicator',
      label: 'Indicador',
      render: (m: any) => (
        <>
          <span className="font-semibold">{m.version?.indicator?.name || '—'}</span>
          <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">{m.version?.indicator?.code || ''}</span>
        </>
      ),
    },
    {
      key: 'value',
      label: 'Resultado',
      align: 'center',
      render: (m: any) => (
        <span className="font-bold">{fmt(m.value) ?? '—'}</span>
      ),
      className: 'font-mono',
    },
    {
      key: 'trafficLight',
      label: 'Conclusión',
      align: 'center',
      render: (m: any) => {
        if (m.trafficLight === 'GREEN') return <StatusBadge label="CUMPLE" variant="success" />;
        if (m.trafficLight === 'RED') return <StatusBadge label="NO CUMPLE" variant="danger" />;
        return <StatusBadge label="Pendiente de medición" variant="default" />;
      },
    },
    {
      key: 'observation',
      label: 'Observación',
      render: (m: any) => (
        <span className="text-xs text-muted-foreground max-w-[150px] truncate block" title={m.observation || ''}>
          {m.observation || '—'}
        </span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Historial Operativo</h2>
        <p className="mt-1 text-muted-foreground">Mediciones registradas, ordenadas por período.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-8 h-9 text-sm" />
        </div>
        <select value={processFilter} onChange={e => { setProcessFilter(e.target.value); setPage(1); }}
          className="h-9 px-2 rounded-lg border border-input bg-background text-sm">
          <option value="">Todos</option>
          {processes?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <DataTable
        title="Mediciones"
        titleIcon={<History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        columns={columns}
        data={paginated}
        loading={isLoading}
        error={error ? 'Error al cargar historial.' : null}
        emptyMessage="No hay registros."
      />

      <BasicPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        showFirstLast
        size="sm"
        className="pt-2"
      />
    </div>
  );
};
