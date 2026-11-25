import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ErpCreateFabAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface ErpCreateFabProps {
  title?: string;
  actions: ErpCreateFabAction[];
  position?: "bottom-right" | "bottom-left";
  fixed?: boolean;
}

/**
 * FAB con el lenguaje visual ERP: botón cuadrado naranja que despliega un
 * panel papel (#fffdf9) con acciones rectas estilo sistema.
 */
export function ErpCreateFab({
  title = "Acciones rápidas",
  actions,
  position = "bottom-right",
  fixed = false,
}: ErpCreateFabProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const posClass = position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6";

  return (
    <div
      ref={ref}
      className={cn(
        fixed ? "fixed" : "absolute",
        posClass,
        "z-50 flex flex-col items-end gap-2"
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-64 overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] shadow-[0_24px_50px_rgba(17,20,22,0.22)]"
            role="menu"
          >
            <div className="flex items-center gap-2 border-b border-[#d8d0c4] bg-[#f5f0e8]/40 px-4 py-2.5">
              <span className="h-[3px] w-4 bg-[#d9772f]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
                {title}
              </span>
            </div>
            <div className="p-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#f5f0e8]/60"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#d8d0c4] bg-[#fffdf9] text-[#b9561d]">
                    {action.icon}
                  </span>
                  <span className="text-[12px] font-bold text-[#111416]">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar acciones" : "Abrir acciones"}
        aria-expanded={open}
        className={cn(
          "grid h-12 w-12 place-items-center rounded-full border shadow-lg transition-colors",
          open
            ? "border-[#111416] bg-[#111416] text-white"
            : "border-[#b9561d] bg-[#d9772f] text-white hover:bg-[#b9561d]"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
