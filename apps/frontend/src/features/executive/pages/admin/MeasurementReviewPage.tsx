import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/features/executive/components/ui/button';
import { useAuthStore } from '../../shared/store/auth.store';
import { apiUrl } from '../../shared/api/config';
import { ShieldAlert } from 'lucide-react';
import { DataTable, StatusBadge, type Column, type TableActions } from '../../components/mvpblocks/ui/data-table';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';
import { ReviewMeasurementDialog } from './ReviewMeasurementDialog';

const ITEMS_PER_PAGE = 15;

const trafficToVariant = (tl: string): 'success' | 'danger' | 'warning' | 'default' => {
  if (tl === 'GREEN') return 'success';
  if (tl === 'RED') return 'danger';
  if (tl === 'YELLOW' || tl === 'ORANGE') return 'warning';
  return 'default';
};

const trafficLabels: Record<string, string> = {
  GREEN: 'CUMPLE',
  RED: 'NO CUMPLE',
  YELLOW: 'ALERTA',
  ORANGE: 'ALERTA',
  GRAY: 'Pendiente de medición',
};

export const MeasurementReviewPage: React.FC = () => {
  const { token } = useAuthStore();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Unique processes from measurements for filter dropdown
  const processOptions = useMemo(() => {
    const names = new Set<string>();
    measurements.forEach((m) => {
      const name = m.version?.indicator?.process?.name;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [measurements]);



  // Filter measurements by selected process and date range
  const filtered = useMemo(() => {
    let result = measurements;
    if (filterProcess !== 'all') {
      result = result.filter((m) => m.version?.indicator?.process?.name === filterProcess);
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate + 'T00:00:00').getTime();
      result = result.filter(m => new Date(m.createdAt).getTime() >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate + 'T23:59:59.999').getTime();
      result = result.filter(m => new Date(m.createdAt).getTime() <= end);
    }
    return result;
  }, [measurements, filterProcess, filterStartDate, filterEndDate]);

  const { totalPages, paginatedItems } = usePagination(filtered, ITEMS_PER_PAGE);
  const visibleMeasurements = paginatedItems(page);

  useEffect(() => {
    setPage(1);
  }, [filterProcess, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/measurements?status=SUBMITTED'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setMeasurements(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar mediciones pendientes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    setPage(1);
  }, [measurements.length]);

  // ─── MUST declare all hooks BEFORE any early return ───
  // Table columns definition (moved before conditional return to keep hook order consistent)
  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'createdAt',
      label: 'Fecha Envío',
      render: (m: any) => (
        <span className="text-xs">{new Date(m.createdAt).toLocaleDateString('es-ES')}</span>
      ),
    },
    {
      key: 'process',
      label: 'Proceso',
      render: (m: any) => (
        <span className="font-medium">{m.version?.indicator?.process?.name ?? '—'}</span>
      ),
    },
    {
      key: 'indicator',
      label: 'Indicador',
      render: (m: any) => (
        <span>{m.version?.indicator?.name ?? '—'}</span>
      ),
    },
    {
      key: 'submittedBy',
      label: 'Usuario',
      render: (m: any) => (
        <span className="text-muted-foreground">{m.submittedBy?.email ?? '—'}</span>
      ),
    },
    {
      key: 'value',
      label: 'Valor',
      align: 'center',
      render: (m: any) => (
        <span className="font-bold">{m.value}</span>
      ),
    },
    {
      key: 'trafficLight',
      label: 'Conclusión',
      align: 'center',
      render: (m: any) => (
        <StatusBadge
          label={trafficLabels[m.trafficLight] ?? 'Pendiente de medición'}
          variant={trafficToVariant(m.trafficLight)}
        />
      ),
    },
  ], []);

  // Table actions definition (moved before conditional return)
  const actions: TableActions<any> = {
    label: 'Acción',
    render: (m: any) => (
      <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedMeasurement(m); }}>
        Revisar
      </Button>
    ),
  };

  // ─── Table View (list of pending measurements) ───

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revisión de Mediciones Pendientes</h2>
          <p className="text-muted-foreground mt-1">Verifica, aprueba o rechaza las mediciones enviadas por los dueños de proceso.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Filtrar:</label>
          <div className="flex items-center gap-2 border border-input rounded-lg px-2 h-9 bg-background">
            <span className="text-xs text-muted-foreground">Desde:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-transparent text-sm text-foreground focus:outline-none"
            />
            <span className="text-xs text-muted-foreground ml-1">Hasta:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-transparent text-sm text-foreground focus:outline-none"
            />
          </div>
          <select
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
          >
            <option value="all">Todos los procesos</option>
            {processOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        title="Mediciones Pendientes"
        titleIcon={<ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        columns={columns}
        data={visibleMeasurements}
        actions={actions}
        loading={loading}
        error={error || null}
        emptyMessage="No hay mediciones pendientes de revisión."
      />

      <BasicPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showFirstLast
        size="sm"
        className="pt-2"
      />

      <ReviewMeasurementDialog
        measurement={selectedMeasurement}
        open={selectedMeasurement !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMeasurement(null);
            fetchPending(); // Refetch when modal closes just in case (though queryClient invalidation should handle it if they use react-query, but here we fetch manually in fetchPending)
          }
        }}
      />
    </div>
  );
};
