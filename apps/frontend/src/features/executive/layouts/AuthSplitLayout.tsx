import * as React from "react";
import { ShieldCheck, BarChart3, ClipboardCheck } from "lucide-react";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-5xl min-h-[650px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:grid-cols-2">
        <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 p-10 text-white md:flex">
          <div className="flex flex-col gap-2 relative z-10">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ShieldCheck className="h-8 w-8 text-blue-200" />
              <span>Portal Gestión</span>
            </div>
            <p className="text-blue-100/80 font-medium">Sistema Integral de Control</p>
          </div>
          
          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tighter">
              El control que tu empresa necesita.
            </h1>
            <p className="text-lg text-blue-100/90 leading-relaxed max-w-md">
              Monitorea el cumplimiento, evalúa métricas clave y genera reportes corporativos en tiempo real con total trazabilidad.
            </p>
          </div>

          <div className="flex gap-6 text-xs text-blue-100/70 relative z-10">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Indicadores en vivo
            </div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Auditorías centralizadas
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        </aside>

        <main className="flex flex-col justify-center bg-card p-8 text-card-foreground sm:p-10 md:p-12">
          {children}
        </main>
      </div>
    </div>
  )
}
