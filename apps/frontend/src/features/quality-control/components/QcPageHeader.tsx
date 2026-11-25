import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function QcPageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[22px] sm:text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#101f19]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-[640px] text-[12px] sm:text-[13px] leading-[1.5] text-[#5b7267]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function QcPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg bg-[#059669] px-4 py-2 text-[13px] font-bold text-white transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-[#047857] hover:shadow-[0_6px_18px_rgba(5,150,105,0.28)] disabled:translate-y-0 disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

export function QcSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-[#d3e3da] bg-white px-4 py-2 text-[13px] font-semibold text-[#2c4236] transition-[border-color,background-color,color] duration-200 hover:border-[#059669] hover:bg-[#f0faf5] hover:text-[#047857] disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

export function QcCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#dce8e0] bg-white shadow-[0_1px_3px_rgba(16,31,25,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
}
