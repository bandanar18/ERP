import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardPlus, Eye, EyeOff, LayoutGrid, Loader2, RefreshCcw, Table2, X } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "../api/dashboard.api";
import { indicatorApi } from "../api/indicator.api";
import { measurementApi, type SubmitMeasurementPayload } from "../api/measurement.api";
import { processApi } from "../api/process.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader, QcPrimaryButton, QcSecondaryButton } from "../components/QcPageHeader";
import { QcTrafficLight } from "../components/QcTrafficLight";
import { QcEmptyState } from "../components/QcEmptyState";
import { QcPagination } from "../components/QcPagination";
import { QC_STATUS_LABELS } from "../types";
import { useQcPermission } from "../hooks/useQcPermission";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "SUBMITTED", label: "Enviadas" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "REJECTED", label: "Rechazadas" },
];

/** Extrae los nombres de variables de una fórmula mathjs (identificadores snake_case). */
function extractFormulaVariables(formula?: string | null): string[] {
  if (!formula) return [];
  const raw = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  const MATH_KEYWORDS = new Set([
    "abs", "ceil", "floor", "round", "sqrt", "pow", "min", "max", "sum", "avg", "mean",
    "pi", "e", "log", "exp", "sin", "cos", "tan", "mod",
  ]);
  return [...new Set(raw)].filter((token) => !MATH_KEYWORDS.has(token));
}

const VARIABLE_LABELS: Record<string, string> = {
  proveedoresConfiables: "Proveedores confiables",
  proveedoresRequierenMejoras: "Proveedores que requieren mejoras",
  proveedoresSuspendidos: "Proveedores suspendidos",
  montoFacturado: "Monto facturado (USD)",
  montoActividadesEjecutadas: "Monto de actividades ejecutadas (USD)",
  solicitudes_adjudicadas: "Solicitudes adjudicadas",
  total_solicitudes: "Total de solicitudes",
  calificacion_obtenida: "Calificación obtenida",
  calificacion_maxima: "Calificación máxima",
  costo_ejecutado: "Costo ejecutado",
  costo_presupuestado: "Costo presupuestado",
  ingreso_actual: "Ingreso actual",
  ingreso_anterior: "Ingreso anterior",
  personal_competente: "Personal competente",
  total_evaluado: "Total evaluado",
  plantilla_actual: "Plantilla actual",
  plantilla_anterior: "Plantilla anterior",
  nro_accidentes: "Número de accidentes",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function formatValue(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** Modal de carga de medición: proceso → indicador → versión activa → modo de entrada. */
function SubmitMeasurementDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [processId, setProcessId] = useState("");
  const [indicatorId, setIndicatorId] = useState("");
  const [directValue, setDirectValue] = useState("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [observation, setObservation] = useState("");

  const processes = useQuery({ queryKey: ["qc-my-processes"], queryFn: processApi.mine });
  const activePeriod = useQuery({ queryKey: ["qc-active-period"], queryFn: dashboardApi.activePeriod });
  const indicator = useQuery({
    queryKey: ["qc-indicator", indicatorId],
    queryFn: () => indicatorApi.detail(indicatorId),
    enabled: !!indicatorId,
  });

  const activeVersion = useMemo(
    () => indicator.data?.versions.find((v) => v.effectiveTo === null) ?? indicator.data?.versions[0],
    [indicator.data]
  );

  const formulaVariables = useMemo(() => {
    if (!activeVersion || activeVersion.inputMode !== "FORMULA_INPUTS") return [];
    const vars = extractFormulaVariables(activeVersion.formula);
    if (vars.length === 0 && (activeVersion?.formula ?? "").includes("proveedoresConfiables")) {
      return ["proveedoresConfiables", "proveedoresRequierenMejoras", "proveedoresSuspendidos"];
    }
    return vars;
  }, [activeVersion]);

  const isProcurement = useMemo(
    () => (activeVersion?.formula ?? "").includes("proveedoresConfiables"),
    [activeVersion]
  );

  const divisionWarning = useMemo(() => {
    if (!activeVersion?.formula) return null;
    if (isProcurement) {
      const c = Number(inputs.proveedoresConfiables);
      const m = Number(inputs.proveedoresRequierenMejoras);
      const s = Number(inputs.proveedoresSuspendidos);
      const allFilled =
        inputs.proveedoresConfiables !== undefined &&
        inputs.proveedoresRequierenMejoras !== undefined &&
        inputs.proveedoresSuspendidos !== undefined &&
        inputs.proveedoresConfiables.trim() !== "" &&
        inputs.proveedoresRequierenMejoras.trim() !== "" &&
        inputs.proveedoresSuspendidos.trim() !== "";
      if (allFilled && c + m + s === 0) {
        return "El total de proveedores no puede ser 0 (se requiere al menos 1 proveedor).";
      }
      return null;
    }
    const cleanFormula = activeVersion.formula.replace(/\s+/g, "");
    const divMatch = cleanFormula.match(/\/([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (divMatch && divMatch[1]) {
      const denomVar = divMatch[1];
      const val = inputs[denomVar];
      if (val !== undefined && val.trim() !== "" && Number(val) === 0) {
        return `"${VARIABLE_LABELS[denomVar] ?? denomVar}" no puede ser 0 (produce división entre cero).`;
      }
    }
    return null;
  }, [activeVersion, inputs, isProcurement]);

  const submit = useMutation({
    mutationFn: (payload: SubmitMeasurementPayload) => measurementApi.submit(payload),
    onSuccess: () => {
      toast.success("Medición cargada correctamente");
      queryClient.invalidateQueries({ queryKey: ["qc-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["qc-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["qc-summary"] });
      queryClient.invalidateQueries({ queryKey: ["qc-owner-summary"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit = useMemo(() => {
    if (!activePeriod.data || !activeVersion || !indicatorId) return false;
    if (divisionWarning) return false;
    if (activeVersion.inputMode === "DIRECT_VALUE") {
      return directValue.trim() !== "" && Number.isFinite(Number(directValue));
    }
    if (formulaVariables.length === 0) return !isProcurement;
    return formulaVariables.every((v) => {
      const val = inputs[v];
      return val !== undefined && val.trim() !== "" && Number.isFinite(Number(val));
    });
  }, [activePeriod.data, activeVersion, indicatorId, divisionWarning, directValue, formulaVariables, inputs, isProcurement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeriod.data || !activeVersion) {
      toast.error("Selecciona un período e indicador válidos");
      return;
    }

    const payload: SubmitMeasurementPayload = {
      indicatorVersionId: activeVersion.id,
      periodId: activePeriod.data.id,
      observation: observation.trim() || undefined,
    };

    if (activeVersion.inputMode === "DIRECT_VALUE") {
      if (!directValue || directValue.trim() === "") {
        toast.error("Ingresa el valor numérico medido.");
        return;
      }
      const value = Number(directValue);
      if (!Number.isFinite(value)) {
        toast.error("Ingresa un valor numérico válido.");
        return;
      }
      payload.directValue = value;
    } else {
      const parsedInputs: Record<string, number> = {};
      for (const variable of formulaVariables) {
        const raw = inputs[variable];
        if (raw === undefined || raw === null || String(raw).trim() === "") {
          toast.error(`Ingresa un valor para "${VARIABLE_LABELS[variable] ?? variable}".`);
          return;
        }
        const value = Number(raw);
        if (!Number.isFinite(value)) {
          toast.error(`El valor para "${VARIABLE_LABELS[variable] ?? variable}" debe ser un número válido.`);
          return;
        }
        parsedInputs[variable] = value;
      }

      if (divisionWarning) {
        toast.error(divisionWarning);
        return;
      }

      payload.inputs = parsedInputs;
    }

    submit.mutate(payload);
  };

  const selectedProcess = processes.data?.find((p) => p.id === processId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#101f19]">Cargar medición</h2>
            <p className="text-[12px] text-[#5b7267]">
              Período activo:{" "}
              {activePeriod.isLoading
                ? "cargando…"
                : activePeriod.data
                ? `${formatDate(activePeriod.data.startsAt)} – ${formatDate(activePeriod.data.endsAt)}`
                : "Sin período activo"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {!activePeriod.isLoading && !activePeriod.data ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] font-medium text-amber-800">
              No hay un período de reporte abierto actualmente. El registro de mediciones requiere un período activo.
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="qc-m-process" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Proceso
              </label>
              <select
                id="qc-m-process"
                value={processId}
                onChange={(e) => {
                  setProcessId(e.target.value);
                  setIndicatorId("");
                  setInputs({});
                }}
                required
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              >
                <option value="">Selecciona un proceso</option>
                {(processes.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-m-indicator" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Indicador
              </label>
              <select
                id="qc-m-indicator"
                value={indicatorId}
                onChange={(e) => {
                  setIndicatorId(e.target.value);
                  setInputs({});
                  setDirectValue("");
                }}
                disabled={!processId}
                required
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-50"
              >
                <option value="">Selecciona un indicador</option>
                {(selectedProcess?.qc_indicators ?? []).map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.code} · {ind.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {indicatorId && !indicator.isLoading && activeVersion ? (
            <div className="rounded-xl border border-[#e2ece6] bg-[#fbfdfc] p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                {activeVersion.inputMode === "DIRECT_VALUE" ? "Valor directo" : "Entradas de la fórmula"}
              </p>

              {activeVersion.inputMode === "DIRECT_VALUE" ? (
                <div>
                  <label htmlFor="qc-m-value" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                    Valor medido
                  </label>
                  <input
                    id="qc-m-value"
                    type="number"
                    step="any"
                    value={directValue}
                    onChange={(e) => setDirectValue(e.target.value)}
                    placeholder="Ej: 10"
                    required
                    className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
                  />
                </div>
              ) : (
                <div className="grid gap-3">
                  {formulaVariables.length === 0 && isProcurement ? (
                    <p className="text-[12px] text-[#7c9186]">
                      Indicador de Procura: registra las cantidades de proveedores.
                    </p>
                  ) : null}
                  {formulaVariables.map((variable) => (
                    <div key={variable}>
                      <label htmlFor={`qc-input-${variable}`} className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                        {VARIABLE_LABELS[variable] ?? variable}
                      </label>
                      <input
                        id={`qc-input-${variable}`}
                        type="number"
                        step="any"
                        value={inputs[variable] ?? ""}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [variable]: e.target.value }))}
                        placeholder="Ej: 10"
                        required
                        className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
                      />
                    </div>
                  ))}
                  {activeVersion.formula ? (
                    <code className="rounded-lg bg-[#ecfdf5] px-3 py-2 text-[11px] font-semibold text-[#047857]">
                      {activeVersion.formula}
                    </code>
                  ) : null}
                  {divisionWarning ? (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
                      {divisionWarning}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <div>
            <label htmlFor="qc-m-observation" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
              Observación <span className="font-normal text-[#9db0a5]">(opcional)</span>
            </label>
            <textarea
              id="qc-m-observation"
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Detalle o comentario de la medición…"
              className="w-full resize-none rounded-lg border border-[#d8e6de] bg-white px-3 py-2.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-[#eef4f0] pt-4 sm:flex-row sm:justify-end">
            <QcSecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </QcSecondaryButton>
            <QcPrimaryButton type="submit" disabled={!canSubmit || submit.isPending} className="w-full sm:w-auto">
              {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPlus className="size-4" />}
              Guardar medición
            </QcPrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

type QcMeasurementRow = Awaited<ReturnType<typeof measurementApi.list>>[number];

/** Modal de revisión (aprobar / rechazar) — solo managers. */
function ReviewDialog({
  measurement,
  onClose,
}: {
  measurement: QcMeasurementRow;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [observation, setObservation] = useState("");

  const review = useMutation({
    mutationFn: () =>
      measurementApi.review(measurement.id, {
        status: decision,
        observation: observation.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(decision === "APPROVED" ? "Medición aprobada" : "Medición rechazada");
      queryClient.invalidateQueries({ queryKey: ["qc-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["qc-matrix"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101f19]">Revisar medición</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-[#e2ece6] bg-[#fbfdfc] p-4">
          <p className="text-[14px] font-bold text-[#101f19]">{measurement.version.indicator.name}</p>
          <p className="text-[11px] text-[#7c9186]">
            {measurement.version.indicator.process.name} ·{" "}
            {formatDate(measurement.period.startsAt)} – {formatDate(measurement.period.endsAt)}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[22px] font-bold text-[#101f19]">{formatValue(measurement.value)}</span>
            <QcTrafficLight status={measurement.trafficLight} />
          </div>
          {measurement.observation ? (
            <p className="mt-3 border-t border-[#eef4f0] pt-3 text-[12px] italic text-[#5b7267]">
              “{measurement.observation}”
            </p>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            review.mutate();
          }}
          className="grid gap-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDecision("APPROVED")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-bold transition-colors",
                decision === "APPROVED"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-[#d8e6de] bg-white text-[#5b7267] hover:bg-[#f2f7f4]"
              )}
            >
              <Check className="size-4" />
              Aprobar
            </button>
            <button
              type="button"
              onClick={() => setDecision("REJECTED")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-bold transition-colors",
                decision === "REJECTED"
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-[#d8e6de] bg-white text-[#5b7267] hover:bg-[#f2f7f4]"
              )}
            >
              <X className="size-4" />
              Rechazar
            </button>
          </div>

          <div>
            <label htmlFor="qc-r-observation" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
              Comentario {decision === "REJECTED" ? "(obligatorio)" : "(opcional)"}
            </label>
            <textarea
              id="qc-r-observation"
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              required={decision === "REJECTED"}
              placeholder="Motivo de la decisión…"
              className="w-full resize-none rounded-lg border border-[#d8e6de] bg-white px-3 py-2.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-[#eef4f0] pt-4 sm:flex-row sm:justify-end">
            <QcSecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </QcSecondaryButton>
            <QcPrimaryButton type="submit" disabled={review.isPending} className="w-full sm:w-auto">
              {review.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {decision === "APPROVED" ? "Aprobar" : "Rechazar"}
            </QcPrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Hook compartido del listado (usado por la página y el modal de revisión para tipos). */
function useMeasurementsList() {
  return useQuery({ queryKey: ["qc-measurements"], queryFn: () => measurementApi.list() });
}

export const MeasurementsPage = () => {
  const { canReview, isOwner } = useQcPermission();
  const [statusFilter, setStatusFilter] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<null | QcMeasurementRow>(null);
  const [showValues, setShowValues] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table" | "cards">(
    () =>
      typeof window !== "undefined" && window.localStorage.getItem("qc-measurements-view") === "cards"
        ? "cards"
        : "table"
  );

  const changeView = (next: "table" | "cards") => {
    setView(next);
    setPage(1);
    try {
      window.localStorage.setItem("qc-measurements-view", next);
    } catch {
      /* noop */
    }
  };

  const measurements = useMeasurementsList();

  const filtered = useMemo(
    () => (measurements.data ?? []).filter((m) => !statusFilter || m.status === statusFilter),
    [measurements.data, statusFilter]
  );

  // Reiniciar la página al cambiar el filtro de estado.
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const pendingCount = useMemo(
    () => (measurements.data ?? []).filter((m) => m.status === "SUBMITTED").length,
    [measurements.data]
  );

  return (
    <QcAppShell active="Mediciones" crumb={<>Inicio / <strong>Mediciones</strong></>}>
      <QcPageHeader
        title="Mediciones"
        subtitle="Carga y revisión de mediciones por período de reporte"
        actions={
          <>
            {pendingCount > 0 && canReview ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                {pendingCount} por revisar
              </span>
            ) : null}
            {isOwner ? (
              <QcPrimaryButton onClick={() => setShowSubmit(true)}>
                <ClipboardPlus className="size-4" />
                Cargar medición
              </QcPrimaryButton>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors",
                statusFilter === filter.value
                  ? "border-[#059669] bg-[#059669] text-white"
                  : "border-[#d8e6de] bg-white text-[#5b7267] hover:border-[#059669] hover:text-[#047857]"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="flex items-center gap-1 rounded-xl border border-[#d8e6de] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => changeView("table")}
              aria-pressed={view === "table"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
                view === "table"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-[#5b7267] hover:bg-[#f2f7f4] hover:text-[#101f19]"
              )}
            >
              <Table2 className="size-3.5" />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => changeView("cards")}
              aria-pressed={view === "cards"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
                view === "cards"
                  ? "bg-[#059669] text-white shadow-sm"
                  : "text-[#5b7267] hover:bg-[#f2f7f4] hover:text-[#101f19]"
              )}
            >
              <LayoutGrid className="size-3.5" />
              Tarjetas
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowValues((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8e6de] bg-white px-3 py-1.5 text-[12px] font-bold text-[#5b7267] transition-colors hover:border-[#059669] hover:text-[#047857]"
            title={showValues ? "Ocultar valores" : "Mostrar valores"}
          >
            {showValues ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span className="hidden min-[380px]:inline">{showValues ? "Ocultar valores" : "Mostrar valores"}</span>
          </button>
        </div>
      </div>

      {measurements.isLoading ? (
        <div className="h-[360px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : filtered.length > 0 ? (
        <>
          {view === "table" ? (
            <QcCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2ece6] bg-[#f7faf8]">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Indicador</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Período</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Valor</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Semáforo</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Estado</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Enviada por</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Observación</th>
                  {canReview ? <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">Acción</th> : null}
                </tr>
              </thead>
              <tbody>
                {paged.map((m) => (
                  <tr key={m.id} className="group border-b border-[#eef4f0] transition-colors last:border-0 hover:bg-[#f7fcf9]">
                    <td className="px-5 py-3">
                      <span className="block text-[13px] font-semibold text-[#101f19]">{m.version.indicator.name}</span>
                      <span className="block text-[10px] font-medium text-[#9db0a5]">
                        {m.version.indicator.code} · {m.version.indicator.process.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#5b7267]">
                      {formatDate(m.period.startsAt)} – {formatDate(m.period.endsAt)}
                    </td>
                    <td className="px-5 py-3 text-[14px] font-bold text-[#101f19]">
                      {showValues ? formatValue(m.value) : "•••"}
                    </td>
                    <td className="px-5 py-3">
                      <QcTrafficLight status={m.trafficLight} compact />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          m.status === "APPROVED" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                          m.status === "REJECTED" && "border-red-200 bg-red-50 text-red-700",
                          m.status === "SUBMITTED" && "border-amber-200 bg-amber-50 text-amber-700",
                          m.status === "DRAFT" && "border-slate-200 bg-slate-50 text-slate-600",
                          m.status === "LOCKED" && "border-slate-300 bg-slate-100 text-slate-700"
                        )}
                      >
                        {QC_STATUS_LABELS[m.status] ?? m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#5b7267]">{m.submittedBy.email}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-[12px] text-[#5b7267]" title={m.observation ?? ""}>
                      {m.observation ?? "—"}
                    </td>
                    {canReview ? (
                      <td className="px-5 py-3">
                        {m.status === "SUBMITTED" ? (
                          <button
                            type="button"
                            onClick={() => setReviewTarget(m)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e6de] bg-white px-3 py-1.5 text-[12px] font-bold text-[#047857] transition-colors hover:border-[#059669] hover:bg-[#f0faf5]"
                          >
                            <RefreshCcw className="size-3.5" />
                            Revisar
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-[#9db0a5]">
                            {m.reviewedBy ? `Por ${m.reviewedBy.email}` : "—"}
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </QcCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((m) => (
              <QcCard key={m.id} className="relative flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
                <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#047857] via-[#10b981] to-[#34d399]" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#101f19]">
                        {m.version.indicator.name}
                      </span>
                      <span className="block truncate text-[10px] font-medium text-[#9db0a5]">
                        {m.version.indicator.code} · {m.version.indicator.process.name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        m.status === "APPROVED" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                        m.status === "REJECTED" && "border-red-200 bg-red-50 text-red-700",
                        m.status === "SUBMITTED" && "border-amber-200 bg-amber-50 text-amber-700",
                        m.status === "DRAFT" && "border-slate-200 bg-slate-50 text-slate-600",
                        m.status === "LOCKED" && "border-slate-300 bg-slate-100 text-slate-700"
                      )}
                    >
                      {QC_STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#eef4f0] bg-[#fbfdfc] px-3 py-2.5">
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-[#5b7267]">
                        {formatDate(m.period.startsAt)} – {formatDate(m.period.endsAt)}
                      </span>
                      <span className="block truncate text-[10px] text-[#9db0a5]">Por {m.submittedBy.email}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[18px] font-bold text-[#101f19]">
                        {showValues ? formatValue(m.value) : "•••"}
                      </span>
                      <QcTrafficLight status={m.trafficLight} compact />
                    </div>
                  </div>

                  <p className="mt-2.5 line-clamp-2 min-h-[2rem] text-[11px] leading-snug text-[#7c9186]">
                    {m.observation ?? "Sin observaciones."}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef4f0] pt-3">
                    {canReview && m.status === "SUBMITTED" ? (
                      <button
                        type="button"
                        onClick={() => setReviewTarget(m)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e6de] bg-white px-3 py-1.5 text-[12px] font-bold text-[#047857] transition-colors hover:border-[#059669] hover:bg-[#f0faf5]"
                      >
                        <RefreshCcw className="size-3.5" />
                        Revisar
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-[#9db0a5]">
                        {m.reviewedBy ? `Revisada por ${m.reviewedBy.email}` : "Sin revisar"}
                      </span>
                    )}
                  </div>
                </div>
              </QcCard>
            ))}
          </div>
          )}
          <div className="mt-3 overflow-hidden rounded-xl border border-[#dce8e0] bg-white">
            <QcPagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <QcEmptyState
          title={statusFilter ? "Sin mediciones en este estado" : "Sin mediciones"}
          description={
            isOwner
              ? "Carga tu primera medición del período activo para comenzar."
              : "No hay mediciones registradas todavía."
          }
          action={
            isOwner ? (
              <QcPrimaryButton onClick={() => setShowSubmit(true)}>
                <ClipboardPlus className="size-4" />
                Cargar medición
              </QcPrimaryButton>
            ) : undefined
          }
        />
      )}

      {showSubmit ? <SubmitMeasurementDialog onClose={() => setShowSubmit(false)} /> : null}
      {reviewTarget ? <ReviewDialog measurement={reviewTarget} onClose={() => setReviewTarget(null)} /> : null}
    </QcAppShell>
  );
};
