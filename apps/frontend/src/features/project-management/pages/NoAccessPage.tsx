import { motion } from "framer-motion"
import { LogOut, ShieldAlert } from "lucide-react"
import { usePmAuth } from "../hooks/usePmAuth"
import { PmAppShell } from "../components/PmAppShell"

/**
 * Página para usuarios autenticados que aún no tienen roles asignados en el módulo.
 * Evita el bucle de redirección: en vez de rebotar entre dashboards, se les muestra
 * este aviso con la opción de cerrar sesión.
 */
export function NoAccessPage() {
  const { user, logout } = usePmAuth()

  return (
    <PmAppShell
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span> <strong className="text-[#111416]">Acceso</strong>
        </>
      }
    >
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-[#d8d0c4] bg-[#fffdf9] p-8 text-center shadow-[0_24px_50px_rgba(28,15,8,0.12)]">
            <div className="mx-auto mb-5 inline-flex size-16 items-center justify-center rounded-full bg-[#d9772f]/10">
              <ShieldAlert className="h-8 w-8 text-[#d9772f]" />
            </div>

            <p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
              Control de acceso
            </p>
            <h1 className="font-display mb-2 text-[34px] font-normal leading-[0.9] tracking-[0.01em]">
              Sin permisos asignados
            </h1>
            <p className="mx-auto max-w-sm text-[13px] leading-[1.55] text-[#4e5558]">
              Tu cuenta <span className="font-bold text-[#111416]">{user?.email}</span> está activa, pero
              aún no tiene un rol en el módulo de Gestión de Proyectos. Contacta a un administrador
              para que te asigne permisos (<span className="font-bold">Gestión</span>,{" "}
              <span className="font-bold">Planificador</span> o{" "}
              <span className="font-bold">Dirección</span>).
            </p>

            <button
              onClick={logout}
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d9772f] bg-[#d9772f] px-6 text-[12px] font-bold text-white transition-colors hover:border-[#b9561d] hover:bg-[#b9561d]"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </motion.div>
      </div>
    </PmAppShell>
  )
}
