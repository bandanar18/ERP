import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function QcEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cfe0d6] bg-white/60 px-6 py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-[#ecfdf5] text-[#0f766e]">
        <Inbox className="size-6 stroke-[1.6]" />
      </span>
      <h3 className="text-[15px] font-bold text-[#101f19]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.5] text-[#5b7267]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
