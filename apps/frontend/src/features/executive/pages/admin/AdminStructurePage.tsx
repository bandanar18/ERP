import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/features/executive/components/ui/button';
import { Input } from '@/features/executive/components/ui/input';
import { Label } from '@/features/executive/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/features/executive/components/ui/dialog';
import { useAuthStore } from '../../shared/store/auth.store';
import { apiFetch } from '../../shared/api/api-client';
import { apiUrl } from '../../shared/api/config';
import {
  Network,
  FolderTree,
  Plus,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column, type TableActions } from '../../components/mvpblocks/ui/data-table';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';

const ITEMS_PER_PAGE = 10;

/* ─── Types ─── */

interface Process {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  children: Process[];
  projects: Project[];
  indicators: { id: string; code: string; name: string }[];
  _count: { indicators: number; children: number; projects: number };
  createdAt: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  processId: string;
}

/* ─── ProcessForm (shared by create + edit dialogs) ─── */

interface ProcessFormProps {
  initial?: { code: string; name: string; parentId: string | null };
  processId?: string;
  processes: Process[];
  onSave: (data: { code: string; name: string; parentId: string | null }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  title: string;
}

function ProcessFormDialog({ initial, processId, processes, onSave, onCancel, saving, title }: ProcessFormProps) {
  const [code, setCode] = useState(initial?.code || '');
  const [name, setName] = useState(initial?.name || '');
  const [parentId, setParentId] = useState<string>(initial?.parentId || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) { setError('El código es obligatorio.'); return; }
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }

    try {
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        parentId: parentId || null,
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar.');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Completa los campos para {initial ? 'actualizar el' : 'crear un nuevo'} proceso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="process-code">Código</Label>
            <Input
              id="process-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: FIN"
              maxLength={20}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="process-name">Nombre</Label>
            <Input
              id="process-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Administración y Finanzas"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="process-parent">Proceso padre (opcional)</Label>
            <select
              id="process-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Ninguno (proceso raíz) —</option>
              {processes
                .filter((p) => p.id !== processId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear proceso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main page ─── */

export const AdminStructurePage: React.FC = () => {
  useAuthStore();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [processPage, setProcessPage] = useState(1);
  const { totalPages: processPages, paginatedItems: getPaginatedProcesses } = usePagination(processes, ITEMS_PER_PAGE);
  const paginatedProcesses = getPaginatedProcesses(processPage);

  const [dialog, setDialog] = useState<null | 'create' | Process>(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(apiUrl('/admin/processes'));
      const data = await res.json();
      setProcesses(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar procesos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleCreate = async (data: { code: string; name: string; parentId: string | null }) => {
    setSaving(true);
    try {
      const res = await apiFetch(apiUrl('/admin/processes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await res.json();
      toast.success('Proceso creado', { description: `El proceso ${data.code} fue creado exitosamente.` });
      setDialog(null);
      fetchProcesses();
    } catch (err: any) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: { code: string; name: string; parentId: string | null }) => {
    setSaving(true);
    try {
      const res = await apiFetch(apiUrl(`/admin/processes/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await res.json();
      toast.success('Proceso actualizado', { description: `Los cambios en ${data.code} fueron guardados.` });
      setDialog(null);
      fetchProcesses();
    } catch (err: any) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  const processColumns: Column<Process>[] = useMemo(() => [
    {
      key: 'code',
      label: 'Código',
      render: (p: Process) => <span className="font-mono text-xs font-bold text-primary">{p.code}</span>,
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (p: Process) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: 'indicators',
      label: 'Indicadores',
      align: 'center',
      render: (p: Process) => <span className="text-sm text-muted-foreground">{p._count.indicators}</span>,
    },
    {
      key: 'createdAt',
      label: 'Creado',
      align: 'right',
      render: (p: Process) => <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>,
      hide: 'md',
    },
  ], []);

  const processActions: TableActions<Process> = {
    label: '',
    render: (p: Process) => (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.stopPropagation(); setDialog(p); }}
        title="Editar"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Estructura Organizacional
          </h2>
          <p className="mt-1 text-muted-foreground">
            Gestiona los procesos del sistema. Los indicadores se asocian directamente a estas entidades.
          </p>
        </div>
        <Button onClick={() => setDialog('create')} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo Proceso
        </Button>
      </div>

      <DataTable
        title="Procesos"
        titleIcon={<FolderTree className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        columns={processColumns}
        data={paginatedProcesses}
        actions={processActions}
        loading={loading}
        error={error || null}
        emptyMessage="No hay procesos registrados. Crea el primero con el botón 'Nuevo Proceso'."
      />
      {!loading && !error && processes.length > 0 && (
        <div className="flex justify-center">
          <BasicPagination
            currentPage={processPage}
            totalPages={processPages}
            onPageChange={setProcessPage}
          />
        </div>
      )}

      {/* ── Dialog: Crear ── */}
      {dialog === 'create' && (
        <ProcessFormDialog
          title="Nuevo Proceso"
          processes={processes}
          onSave={handleCreate}
          onCancel={() => setDialog(null)}
          saving={saving}
        />
      )}

      {/* ── Dialog: Editar ── */}
      {dialog && dialog !== 'create' && (
        <ProcessFormDialog
          title={`Editar: ${(dialog as Process).code}`}
          processId={(dialog as Process).id}
          initial={{
            code: (dialog as Process).code,
            name: (dialog as Process).name,
            parentId: (dialog as Process).parentId,
          }}
          processes={processes}
          onSave={async (data) => handleUpdate((dialog as Process).id, data)}
          onCancel={() => setDialog(null)}
          saving={saving}
        />
      )}
    </div>
  );
};
