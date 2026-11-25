import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/features/executive/components/ui/card';
import { useMyProcesses } from '../../shared/hooks/useProcesses';
import { useMeasurements } from '../../shared/hooks/useMeasurements';
import { Skeleton } from '@/features/executive/components/ui/skeleton';
import { FileText, Paperclip } from 'lucide-react';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';

const ITEMS_PER_PAGE = 5;

const fmt = (v: any) => typeof v === 'number' ? Number(v.toFixed(2)) : v;

export const OwnerDocsPage: React.FC = () => {
  const { data: processes } = useMyProcesses();
  const { data: measurements, isLoading } = useMeasurements();
  const [page, setPage] = useState(1);

  const userProcessIds = useMemo(() => 
    new Set(processes?.map((p: any) => p.id) || []), [processes]);

  const docs = useMemo(() => {
    const userM = (measurements || []).filter((m: any) => {
      const procId = m.version?.indicator?.processId;
      return procId && userProcessIds.has(procId) && (m.observation || m.analysisInternal);
    });
    return userM.sort((a: any, b: any) => 
      new Date(b.period?.startsAt || 0).getTime() - new Date(a.period?.startsAt || 0).getTime(),
    );
  }, [measurements, userProcessIds]);

  const { totalPages, paginatedItems } = usePagination(docs, ITEMS_PER_PAGE);
  const paginated = paginatedItems(page);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Documentos y Evidencias</h2>
        <p className="mt-1 text-muted-foreground">Observaciones y análisis asociados a las mediciones, ordenados por período.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : docs.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <Paperclip className="h-10 w-10 text-slate-200 mb-3" />
          <h3 className="font-bold text-slate-700 mb-1">Sin documentos registrados</h3>
          <p className="text-sm text-slate-500 max-w-md">Las observaciones de cada medición aparecerán aquí como evidencia documental.</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((m: any) => (
              <Card key={m.id} className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                      <CardTitle className="text-sm font-bold text-slate-800 truncate">{m.version?.indicator?.name || 'Medición'}</CardTitle>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {m.period?.startsAt ? new Date(m.period.startsAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <CardDescription className="text-xs">{m.version?.indicator?.process?.name} · {m.version?.indicator?.code}</CardDescription>
                </CardHeader>
                <CardContent className="pt-3 pb-3 space-y-2">
                  {m.observation && (
                    <p className="text-sm text-slate-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">{m.observation}</p>
                  )}
                  {m.analysisInternal && (
                    <p className="text-sm text-slate-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{m.analysisInternal}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                      m.trafficLight === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40' :
                        m.trafficLight === 'RED' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40' :
                          'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40'
                    }`}>{m.trafficLight === 'GREEN' ? 'CUMPLE' : m.trafficLight === 'RED' ? 'NO CUMPLE' : 'ALERTA'}</span>
                    <span className="text-xs text-slate-500">Valor: <strong>{fmt(m.value)}</strong></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <BasicPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showFirstLast
            size="sm"
            className="pt-4"
          />
        </>
      )}
    </div>
  );
};
