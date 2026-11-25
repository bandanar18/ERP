import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gauge, LayoutGrid, Loader2, Pencil, Plus, Search, Table2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type CreateIndicatorPayload, type UpdateIndicatorPayload } from "../api/admin.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcCard, QcPageHeader, QcPrimaryButton, QcSecondaryButton } from "../components/QcPageHeader";
import { QcEmptyState } from "../components/QcEmptyState";
import type { QcAdminIndicator, QcAdminProcess } from "../types";
import { QC_FREQUENCY_LABELS, QC_DIRECTION_LABELS } from "../types";
import { cn } from "@/lib/utils";

const FREQUENCIES = ["MONTHLY", "QUARTERLY", "SEMIANNUAL", "PROJECT_BASED"] as const;
const DIRECTIONS = ["AT_LEAST", "AT_MOST", "RANGE"] as const;
const CHART_TYPES = ["LINE", "PIE"] as const;
const INPUT_MODES = ["DIRECT_VALUE", "FORMULA_INPUTS"] as const;
const AGGREGATIONS = ["LAST_VALUE", "SUM", "AVERAGE", "WEIGHTED_AVERAGE", "CUMULATIVE_RATIO"] as const;

const FREQUENCY_OPTIONS = FREQUENCIES.map((value) => ({
  value,
  label: QC_FREQUENCY_LABELS[value],
}));
const DIRECTION_OPTIONS = DIRECTIONS.map((value) => ({ value, label: QC_DIRECTION_LABELS[value] }));

/* ============================================================================
   Modal crear / editar indicador
============================================================================ */
function IndicatorDialog({
  open,
  onClose,
  indicator,
  processes,
}: {
  open: boolean;
  onClose: () => void;
  indicator: QcAdminIndicator | null;
  processes: QcAdminProcess[];
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [processId, setProcessId] = useState("");
  const [subprocessId, setSubprocessId] = useState("");
  const [chartType, setChartType] = useState<string>("LINE");
  const [frequency, setFrequency] = useState<string>("MONTHLY");
  const [direction, setDirection] = useState<string>("AT_LEAST");
  const [formula, setFormula] = useState("");
  const [inputMode, setInputMode] = useState<string>("DIRECT_VALUE");
  const [displayAsPercent, setDisplayAsPercent] = useState(false);
  const [aggregation, setAggregation] = useState<string>("LAST_VALUE");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("%");
  const [thresholdGreen, setThresholdGreen] = useState("");
  const [thresholdRed, setThresholdRed] = useState("");

  // Reset al abrir
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = indicator?.id ?? "new";
  useEffect(() => {
    if (open && key !== lastKey) {
      setLastKey(key);
      setError(null);
      if (indicator) {
        setCode(indicator.code);
        setName(indicator.name);
        setProcessId(indicator.processId);
        setSubprocessId(indicator.subprocessId ?? "");
        setChartType(indicator.chartType);
        
        const activeVersion = indicator.versions?.[0];
        if (activeVersion) {
          setFrequency(activeVersion.frequency);
          setDirection(activeVersion.direction);
          setFormula(activeVersion.formula ?? "");
          setInputMode(activeVersion.inputMode);
          setDisplayAsPercent(activeVersion.displayAsPercent);
          setAggregation(activeVersion.aggregation);
          
          const target = activeVersion.targets?.[0];
          if (target) {
            setTargetValue(target.targetValue.toString());
            setUnit(target.unit);
            setThresholdGreen(target.thresholds?.green?.toString() ?? "");
            setThresholdRed(target.thresholds?.red?.toString() ?? "");
          }
        }
      } else {
        setCode("");
        setName("");
        setProcessId("");
        setSubprocessId("");
        setChartType("LINE");
        setFrequency("MONTHLY");
        setDirection("AT_LEAST");
        setFormula("");
        setInputMode("DIRECT_VALUE");
        setDisplayAsPercent(false);
        setAggregation("LAST_VALUE");
        setTargetValue("");
        setUnit("%");
        setThresholdGreen("");
        setThresholdRed("");
      }
    }
  }, [open, key, lastKey, indicator]);

  const process = processes.find((p) => p.id === processId);
  const subprocessOptions = (process?.children ?? []).map((child) => ({ id: child.id, code: child.code, name: child.name }));

  const mutation = useMutation({
    mutationFn: () => {
      if (indicator) {
        const payload: UpdateIndicatorPayload = {};
        if (name !== indicator.name) payload.name = name;
        if (processId !== indicator.processId) payload.processId = processId;
        if (subprocessId !== (indicator.subprocessId ?? "")) payload.subprocessId = subprocessId || null;
        if (chartType !== indicator.chartType) payload.chartType = chartType as typeof CHART_TYPES[number];
        payload.frequency = frequency as CreateIndicatorPayload["frequency"];
        payload.direction = direction as CreateIndicatorPayload["direction"];
        payload.inputMode = inputMode as typeof INPUT_MODES[number];
        payload.displayAsPercent = displayAsPercent;
        payload.aggregation = aggregation as typeof AGGREGATIONS[number];
        payload.formula = formula.trim() || null;
        payload.targetValue = Number(targetValue);
        payload.unit = unit;
        payload.thresholds = { green: Number(thresholdGreen), red: Number(thresholdRed) };
        return adminApi.updateIndicator(indicator.id, payload);
      }
      const payload: CreateIndicatorPayload = {
        code,
        name,
        processId,
        subprocessId: subprocessId || null,
        chartType: chartType as typeof CHART_TYPES[number],
        frequency: frequency as CreateIndicatorPayload["frequency"],
        direction: direction as CreateIndicatorPayload["direction"],
        inputMode: inputMode as typeof INPUT_MODES[number],
        displayAsPercent,
        aggregation: aggregation as typeof AGGREGATIONS[number],
        formula: formula.trim() || null,
        targetValue: Number(targetValue),
        unit,
        thresholds: { green: Number(thresholdGreen), red: Number(thresholdRed) },
      };
      return adminApi.createIndicator(payload);
    },
    onSuccess: () => {
      toast.success(indicator ? "Indicador actualizado" : "Indicador creado");
      queryClient.invalidateQueries({ queryKey: ["qc-admin-indicators"] });
      queryClient.invalidateQueries({ queryKey: ["qc-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["qc-summary"] });
      queryClient.invalidateQueries({ queryKey: ["qc-processes"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1f16]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(6,40,28,0.3)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101f19]">{indicator ? "Editar indicador" : "Nuevo indicador"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-[#5b7267] transition-colors hover:bg-[#f2f7f4] hover:text-[#101f19]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!indicator && (!code.trim() || !name.trim() || !processId)) {
              setError("Código, nombre y proceso son obligatorios");
              return;
            }
            if (!targetValue || !Number.isFinite(Number(targetValue))) {
              setError("La meta debe ser un número válido");
              return;
            }
            if (thresholdGreen === "" || thresholdRed === "" || !Number.isFinite(Number(thresholdGreen)) || !Number.isFinite(Number(thresholdRed))) {
              setError("Los umbrales de semáforo deben ser números válidos");
              return;
            }
            mutation.mutate();
          }}
          className="grid gap-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="qc-i-code" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                  Código
                </label>
                <input
                  id="qc-i-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                  placeholder="Ej: KPI-COM-01"
                  required
                  className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] uppercase outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
                />
              </div>
              <div>
                <label htmlFor="qc-i-name" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                  Nombre
                </label>
                <input
                  id="qc-i-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cumplimiento de entregas"
                  required
                  className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
                />
              </div>
            </div>

          {/* Ubicación */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="qc-i-process" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Proceso
              </label>
              <select
                id="qc-i-process"
                value={processId}
                onChange={(e) => {
                  setProcessId(e.target.value);
                  setSubprocessId("");
                }}
                required
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              >
                <option value="">Selecciona un proceso</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-i-subprocess" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Subproceso <span className="font-normal text-[#9db0a5]">(opcional)</span>
              </label>
              <select
                id="qc-i-subprocess"
                value={subprocessId}
                onChange={(e) => setSubprocessId(e.target.value)}
                disabled={!processId}
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-50"
              >
                <option value="">Sin subproceso</option>
                {subprocessOptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} · {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuración */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="qc-i-frequency" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Frecuencia
              </label>
              <select
                id="qc-i-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-i-direction" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Dirección
              </label>
              <select
                id="qc-i-direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-i-chart" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Tipo de gráfica
              </label>
              <select
                id="qc-i-chart"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              >
                {CHART_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value === "LINE" ? "Línea / tendencia" : "Pastel / distribución"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-i-input" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Modo de entrada
              </label>
              <select
                id="qc-i-input"
                value={inputMode}
                onChange={(e) => setInputMode(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              >
                {INPUT_MODES.map((value) => (
                  <option key={value} value={value}>
                    {value === "DIRECT_VALUE" ? "Valor directo" : "Fórmula con entradas"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {inputMode === "FORMULA_INPUTS" ? (
            <div>
              <label htmlFor="qc-i-formula" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Fórmula <span className="font-normal text-[#9db0a5]">(mathjs)</span>
              </label>
              <input
                id="qc-i-formula"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ej: (solicitudes_adjudicadas / total_solicitudes) * 100"
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 font-mono text-[12px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              />
              <p className="mt-1 text-[11px] text-[#7c9186]">
                Las variables deben ser identificadores con guion bajo. Los responsables de proceso las completarán al cargar la medición.
              </p>
            </div>
          ) : null}

          {/* Meta y umbrales */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="qc-i-target" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Meta
              </label>
              <input
                id="qc-i-target"
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="0"
                required
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              />
            </div>
            <div>
              <label htmlFor="qc-i-unit" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Unidad
              </label>
              <input
                id="qc-i-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="%"
                className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              />
            </div>
            <div>
              <label htmlFor="qc-i-green" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Verde (desde)
              </label>
              <input
                id="qc-i-green"
                type="number"
                step="any"
                value={thresholdGreen}
                onChange={(e) => setThresholdGreen(e.target.value)}
                placeholder="0"
                required
                className="h-10 w-full rounded-lg border border-[#d1fae5] bg-emerald-50/40 px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              />
            </div>
            <div>
              <label htmlFor="qc-i-red" className="mb-1.5 block text-[12px] font-bold text-[#101f19]">
                Rojo (hasta)
              </label>
              <input
                id="qc-i-red"
                type="number"
                step="any"
                value={thresholdRed}
                onChange={(e) => setThresholdRed(e.target.value)}
                placeholder="0"
                required
                className="h-10 w-full rounded-lg border border-[#fee2e2] bg-red-50/40 px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2.5 border-t border-[#eef4f0] pt-4 sm:flex-row sm:justify-end">
            <QcSecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </QcSecondaryButton>
            <QcPrimaryButton type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {indicator ? "Guardar cambios" : "Crear indicador"}
            </QcPrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function ChartBadge({ chartType }: { chartType: string }) {
  const isLine = chartType === "LINE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        isLine ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-violet-200 bg-violet-50 text-violet-700"
      )}
    >
      <span className={cn("size-1.5 rounded-full", isLine ? "bg-emerald-500" : "bg-violet-500")} />
      {isLine ? "Línea" : "Pastel"}
    </span>
  );
}

/* ============================================================================
   Página: administración de indicadores (solo QC_ADMIN)
============================================================================ */
export const AdminIndicatorsPage = () => {
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QcAdminIndicator | null>(null);
  const [view, setView] = useState<"table" | "cards">(
    () =>
      typeof window !== "undefined" && window.localStorage.getItem("qc-admin-indicators-view") === "cards"
        ? "cards"
        : "table"
  );

  const changeView = (next: "table" | "cards") => {
    setView(next);
    try {
      window.localStorage.setItem("qc-admin-indicators-view", next);
    } catch {
      /* noop */
    }
  };

  const indicators = useQuery({ queryKey: ["qc-admin-indicators"], queryFn: adminApi.listIndicators });
  const processes = useQuery({ queryKey: ["qc-admin-processes"], queryFn: adminApi.listProcesses });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return indicators.data ?? [];
    return (indicators.data ?? []).filter(
      (ind) =>
        ind.name.toLowerCase().includes(q) ||
        ind.code.toLowerCase().includes(q) ||
        ind.process.name.toLowerCase().includes(q)
    );
  }, [indicators.data, query]);

  return (
    <QcAppShell active="Indicadores" crumb={<>Inicio / <strong>Indicadores</strong></>}>
      <QcPageHeader
        title="Administración de indicadores"
        subtitle="Metas, fórmulas, umbrales de semáforo y configuración técnica de cada KPI"
        actions={
          <QcPrimaryButton onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" />
            Nuevo indicador
          </QcPrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9db0a5]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar indicador…"
            className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white pl-9 pr-3.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
          />
        </div>
        {/* Alternar vista tabla / tarjetas */}
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

        <span className="ml-auto text-[12px] font-semibold text-[#7c9186]">
          {filtered.length} {filtered.length === 1 ? "indicador" : "indicadores"}
        </span>
      </div>

      {indicators.isLoading ? (
        <div className="h-[360px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : filtered.length > 0 ? (
        view === "table" ? (
          <QcCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#eef4f0] bg-[#f7faf8] px-5 py-3">
              <h2 className="flex items-center gap-2 text-[12px] font-bold text-[#101f19]">
                <Gauge className="size-4 text-[#047857]" />
                Indicadores del sistema
              </h2>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#9db0a5] sm:block">
                {filtered.length} registro{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e2ece6] bg-[#f7faf8]">
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Indicador
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Proceso
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Gráfica
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Creado
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ind) => (
                    <tr key={ind.id} className="group border-b border-[#eef4f0] transition-colors last:border-0 hover:bg-[#f7fcf9]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-xl shadow-sm ring-2 ring-white",
                              ind.chartType === "LINE"
                                ? "bg-[#047857] text-white"
                                : "bg-violet-600 text-white"
                            )}
                          >
                            <Gauge className="size-4.5 stroke-[1.8]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[320px] truncate text-[13px] font-semibold text-[#101f19]">
                              {ind.name}
                            </span>
                            <span className="block text-[10px] font-medium tracking-wide text-[#9db0a5]">
                              {ind.code}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex shrink-0 rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                            {ind.process.code}
                          </span>
                          <span className="max-w-[220px] truncate text-[12px] font-medium text-[#5b7267]">
                            {ind.process.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <ChartBadge chartType={ind.chartType} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold text-[#5b7267]">{formatDate(ind.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(ind);
                              setDialogOpen(true);
                            }}
                            title="Editar indicador"
                            aria-label={`Editar ${ind.name}`}
                            className="grid size-8 place-items-center rounded-lg border border-[#d8e6de] bg-white text-[#5b7267] transition-colors hover:border-[#059669] hover:bg-[#f0faf5] hover:text-[#047857]"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QcCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ind) => (
              <QcCard key={ind.id} className="group relative flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
                <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#047857] via-[#10b981] to-[#34d399]" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl shadow-sm",
                        ind.chartType === "LINE" ? "bg-[#047857] text-white" : "bg-violet-600 text-white"
                      )}
                    >
                      <Gauge className="size-5 stroke-[1.8]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#101f19]">{ind.name}</span>
                      <span className="block text-[10px] font-medium tracking-wide text-[#9db0a5]">{ind.code}</span>
                    </div>
                    <ChartBadge chartType={ind.chartType} />
                  </div>

                  <div className="mt-3.5 flex items-center gap-2">
                    <span className="inline-flex shrink-0 rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#047857]">
                      {ind.process.code}
                    </span>
                    <span className="min-w-0 truncate text-[11px] font-medium text-[#5b7267]">{ind.process.name}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef4f0] pt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9db0a5]">
                      Creado {formatDate(ind.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(ind);
                        setDialogOpen(true);
                      }}
                      title="Editar indicador"
                      aria-label={`Editar ${ind.name}`}
                      className="grid size-8 place-items-center rounded-lg border border-[#d8e6de] bg-white text-[#047857] transition-colors hover:border-[#059669] hover:bg-[#f0faf5]"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                </div>
              </QcCard>
            ))}
          </div>
        )
      ) : (
        <QcEmptyState
          title={query ? "Sin resultados" : "Sin indicadores"}
          description={query ? "Ningún indicador coincide con la búsqueda." : "Crea el primer indicador del sistema de gestión."}
          action={
            !query ? (
              <QcPrimaryButton onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="size-4" />
                Nuevo indicador
              </QcPrimaryButton>
            ) : undefined
          }
        />
      )}

      <IndicatorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        indicator={editing}
        processes={processes.data ?? []}
      />
    </QcAppShell>
  );
};
