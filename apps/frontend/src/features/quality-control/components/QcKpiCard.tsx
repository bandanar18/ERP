import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const ACCENTS: Record<string, string> = {
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  red: "text-red-600 bg-red-50 border-red-200",
  yellow: "text-amber-600 bg-amber-50 border-amber-200",
  gray: "text-slate-500 bg-slate-50 border-slate-200",
  slate: "text-[#0f766e] bg-[#ecfdf5] border-[#a7f3d0]",
};

export function QcKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "slate",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENTS;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[#dce8e0] bg-white p-4.5 shadow-[0_1px_3px_rgba(16,31,25,0.05)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(16,31,25,0.08)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#7c9186]">{label}</p>
          <p className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-[#101f19]">
            {value}
          </p>
          {hint ? <p className="mt-2 text-[11px] font-medium text-[#7c9186]">{hint}</p> : null}
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg border", ACCENTS[accent])}>
          <Icon className="size-[18px] stroke-[1.8]" />
        </span>
      </div>
    </div>
  );
}
