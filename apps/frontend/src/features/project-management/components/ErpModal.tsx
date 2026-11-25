import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ErpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Contenido a ancho completo justo debajo del header (p. ej. resumen del usuario). */
  headerExtra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/**
 * Modal con el lenguaje visual ERP: chrome recto (rounded-none, borde #d8d0c4,
 * fondo papel #fffdf9), header con eyebrow naranja + título Bebas Neue,
 * cuerpo con padding y barra de footer con fondo papel.
 */
export function ErpModal({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  headerExtra,
  children,
  footer,
  maxWidth = "max-w-[460px]",
}: ErpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex! max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-[#d8d0c4] bg-[#fffdf9] p-0 text-[#111416] shadow-[0_24px_50px_rgba(17,20,22,0.22)] ring-0",
          maxWidth,
          "sm:w-full"
        )}
      >
        <DialogHeader className="shrink-0 gap-1 border-b border-[#d8d0c4] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
          {eyebrow && (
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-6 bg-[#d9772f]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
                {eyebrow}
              </span>
            </div>
          )}
          <DialogTitle className="font-display text-[22px] sm:text-[26px] font-normal leading-[0.95] tracking-[0.01em] text-[#111416]">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[11px] leading-relaxed text-[#4e5558]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {headerExtra && <div className="shrink-0">{headerExtra}</div>}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid min-w-0 gap-4 px-4 py-4 sm:px-5">{children}</div>
        </div>

        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#d8d0c4] bg-[#f5f0e8]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5 sm:py-3.5">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
