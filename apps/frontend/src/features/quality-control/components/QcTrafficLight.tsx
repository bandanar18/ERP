import { cn } from "@/lib/utils";
import { QC_TRAFFIC_LABELS } from "../types";

const STYLES: Record<string, { chip: string; dot: string }> = {
  GREEN: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  RED: {
    chip: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  YELLOW: {
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  GRAY: {
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export function QcTrafficLight({
  status,
  compact = false,
}: {
  status: string | null | undefined;
  compact?: boolean;
}) {
  const key = status === "GREEN" || status === "RED" || status === "YELLOW" ? status : "GRAY";
  const style = STYLES[key];
  const label = QC_TRAFFIC_LABELS[key] ?? QC_TRAFFIC_LABELS.GRAY;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        style.chip,
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {label}
    </span>
  );
}
