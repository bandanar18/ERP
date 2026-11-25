import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/features/executive/components/ui/button';
import { Badge } from '@/features/executive/components/ui/badge';
import { useAuthStore } from '../../shared/store/auth.store';
import { apiUrl } from '../../shared/api/config';
import { Eye, History } from 'lucide-react';
import { DataTable, type Column, type TableActions } from '../../components/mvpblocks/ui/data-table';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/features/executive/components/ui/dialog';

const ITEMS_PER_PAGE = 15;

const ENTITY_LABELS: Record<string, string> = {
  Process: "Proceso",
  Project: "Proyecto",
  Indicator: "Indicador",
  IndicatorVersion: "Configuración de indicador",
  Measurement: "Medición",
  User: "Usuario",
  Role: "Rol",
  ReportingPeriod: "Período de medición",
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creó",
  UPDATE: "Actualizó",
  DELETE: "Desactivó",
  USER_CREATED: "Creó",
  MEASUREMENT_SUBMITTED: "Registró",
  MEASUREMENT_APPROVED: "Aprobó",
  MEASUREMENT_REJECTED: "Rechazó",
  REVIEW_MEASUREMENT_APPROVED: "Aprobó",
  REVIEW_MEASUREMENT_REJECTED: "Rechazó",
}

function getEntityName(log: any) {
  const data = log.after ?? log.before ?? {}

  return (
    data.name ??
    data.indicatorName ??
    data.email ??
    data.code ??
    "Elemento sin nombre"
  )
}

function getEventDescription(log: any) {
  const action = ACTION_LABELS[log.action] ?? "Actualizó"
  const entity = ENTITY_LABELS[log.entityType] ?? "elemento"
  const name = getEntityName(log)

  return `${action} ${entity.toLowerCase()}: ${name}`
}

const VISIBLE_FIELDS: Record<string, string> = {
  code: "Código",
  name: "Nombre",
  email: "Correo",
  status: "Estado",
  targetValue: "Meta",
  frequency: "Frecuencia",
  formula: "Fórmula",
  parentName: "Proceso padre",
  processName: "Proceso",
  value: "Valor",
  comment: "Comentario",
  observation: "Observación",
  trafficLight: "Semáforo",
  role: "Rol",
}

function EventChanges({ before, after }: { before?: any; after?: any }) {
  const changes = Object.keys(VISIBLE_FIELDS)
    .filter((key) => before?.[key] !== after?.[key])
    .map((key) => ({
      label: VISIBLE_FIELDS[key],
      oldValue: before?.[key] ?? "Sin valor",
      newValue: after?.[key] ?? "Sin valor",
    }))

  if (!changes.length) return null

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">Cambios registrados</h3>
      <div className="overflow-hidden rounded-lg border border-border">
        {changes.map((change) => (
          <div
            key={change.label}
            className="grid grid-cols-[130px_1fr] gap-3 border-b border-border p-3 last:border-b-0"
          >
            <span className="text-sm text-muted-foreground">{change.label}</span>
            <span className="text-sm font-medium text-foreground">{change.newValue}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export const AuditLogPage: React.FC = () => {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const { totalPages, paginatedItems } = usePagination(logs, ITEMS_PER_PAGE);
  const visibleLogs = paginatedItems(page);

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/audit-logs'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError('Error al cargar la bitácora de auditoría');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [logs.length]);

  const columns: Column<any>[] = useMemo(() => [
    {
      key: "createdAt",
      label: "Fecha y hora",
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {new Date(log.createdAt).toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      key: "actor",
      label: "Realizado por",
      render: (log) => (
        <span className="font-medium text-foreground">
          {log.actor?.email ?? "Sistema"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Evento",
      render: (log) => (
        <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
          {ACTION_LABELS[log.action] ?? log.action}
        </Badge>
      ),
    },
    {
      key: "detail",
      label: "Detalle",
      render: (log) => (
        <span className="text-sm text-foreground">
          {getEventDescription(log)}
        </span>
      ),
    },
  ], []);

  const actions: TableActions<any> = {
    label: '',
    render: (log: any) => (
      log.after ? (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSelectedDetails(log); }}>
          <Eye className="h-4 w-4" />
        </Button>
      ) : null
    ),
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold">Bitácora de Auditoría</h2>
      <DataTable
        title="Historial de Eventos"
        titleIcon={<History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        columns={columns}
        data={visibleLogs}
        actions={actions}
        loading={loading}
        error={error || null}
        emptyMessage="No hay registros de auditoría."
      />

      <BasicPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showFirstLast
        size="sm"
        className="pt-2"
      />

      {/* Modal funcional */}
      <Dialog
        open={selectedDetails !== null}
        onOpenChange={(open) => !open && setSelectedDetails(null)}
      >
        <DialogContent className="max-w-lg border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Detalle del evento</DialogTitle>
            <DialogDescription>
              Información registrada en la bitácora del sistema.
            </DialogDescription>
          </DialogHeader>

          {selectedDetails && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Acción realizada
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {getEventDescription(selectedDetails)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Realizado por</p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {selectedDetails.actor?.email ?? "Sistema"}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Fecha y hora</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {new Date(selectedDetails.createdAt).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              <EventChanges before={selectedDetails.before} after={selectedDetails.after} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

