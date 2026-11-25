import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Search, Table2 } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { QcAppShell } from "../components/QcAppShell";
import { QcPageHeader } from "../components/QcPageHeader";
import { QcMatrixTable } from "../components/QcMatrixTable";
import { cn } from "@/lib/utils";

export const IndicatorsPage = () => {
  const matrix = useQuery({ queryKey: ["qc-matrix"], queryFn: dashboardApi.matrix });
  const [query, setQuery] = useState("");
  const [process, setProcess] = useState("");
  const [view, setView] = useState<"table" | "cards">(
    () =>
      typeof window !== "undefined" && window.localStorage.getItem("qc-matrix-view") === "cards" ? "cards" : "table"
  );

  const changeView = (next: "table" | "cards") => {
    setView(next);
    try {
      window.localStorage.setItem("qc-matrix-view", next);
    } catch {
      /* noop */
    }
  };

  const processes = useMemo(() => {
    const names = new Set<string>();
    (matrix.data ?? []).forEach((entry) => names.add(entry.process));
    return [...names].sort();
  }, [matrix.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (matrix.data ?? []).filter((entry) => {
      const matchesProcess = !process || entry.process === process;
      const matchesQuery =
        !q ||
        entry.name.toLowerCase().includes(q) ||
        entry.code.toLowerCase().includes(q) ||
        entry.process.toLowerCase().includes(q);
      return matchesProcess && matchesQuery;
    });
  }, [matrix.data, query, process]);

  return (
    <QcAppShell active="Matriz de indicadores" crumb={<>Inicio / <strong>Matriz de indicadores</strong></>}>
      <QcPageHeader
        title="Matriz de indicadores"
        subtitle="Todos los indicadores del sistema de gestión con su última medición y estado de cumplimiento"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-[380px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9db0a5]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, código o proceso…"
            className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white pl-9 pr-3.5 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)]"
          />
        </div>
        <select
          value={process}
          onChange={(e) => setProcess(e.target.value)}
          aria-label="Filtrar por proceso"
          className="h-10 w-full rounded-lg border border-[#d8e6de] bg-white px-3 text-[13px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] sm:w-auto"
        >
          <option value="">Todos los procesos</option>
          {processes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[12px] font-semibold text-[#7c9186]">
          {filtered.length} {filtered.length === 1 ? "indicador" : "indicadores"}
        </span>
      </div>

      {/* Alternar vista tabla / tarjetas */}
      <div className="mb-4 flex items-center justify-end">
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
      </div>

      {matrix.isLoading ? (
        <div className="h-[320px] animate-pulse rounded-xl border border-[#dce8e0] bg-[#f2f7f4]" />
      ) : (
        <QcMatrixTable entries={filtered} variant={view} />
      )}
    </QcAppShell>
  );
};
