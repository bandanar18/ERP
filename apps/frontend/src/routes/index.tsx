import { useRoutes, Navigate, useLocation, Link } from "react-router-dom"
import type { NavigateProps } from "react-router-dom"
import { Compass, Home } from "lucide-react"
import { ProjectManagementRoutes } from "@/features/project-management"
import { QualityControlRoutes } from "@/features/quality-control"
import { ExecutiveRoutes } from "@/features/executive"
import { LandingPage } from "@/pages/LandingPage"
import { getActiveModule } from "@/config/domains"

/**
 * Puente de compatibilidad: cualquier ruta legacy /project/* se redirige a su
 * equivalente del módulo /project-management/* preservando la sub-ruta.
 */
const LegacyProjectRedirect = (props: Partial<NavigateProps>) => {
  const location = useLocation()
  const target = location.pathname.replace(/^\/project\//, "/project-management/")
  return <Navigate to={target} replace {...props} />
}

/**
 * El login del ERP (features/auth legacy) fue ELIMINADO: el único login del
 * sistema es el del módulo de Gestión de Proyectos. Cualquier ruta /auth/*
 * (login, register, verify, forgot/reset-password) redirige a su equivalente
 * en /project-management/* preservando query params (p. ej. ?email=...).
 */
const LEGACY_AUTH_MAP: Record<string, string> = {
  "/auth/login": "/project-management/login",
  "/auth/register": "/project-management/register",
  "/auth/verify": "/project-management/verify",
  "/auth/forgot-password": "/project-management/forgot-password",
  "/auth/reset-password": "/project-management/reset-password",
}

const LegacyAuthRedirect = (props: Partial<NavigateProps>) => {
  const location = useLocation()
  const base = LEGACY_AUTH_MAP[location.pathname] || "/project-management/login"
  const target = base + location.search + location.hash
  return <Navigate to={target} replace {...props} />
}

export const AppRoutes = () => {
  const activeModule = getActiveModule();

  // Subdominio de módulo → montar SOLO ese módulo (login directo, sin landing
  // ni otros módulos). La raíz redirige al login del módulo; las rutas internas
  // conservan su prefijo para no romper las navegaciones hardcodeadas.
  if (activeModule === "project-management") {
    return useRoutes([
      { path: "/", element: <Navigate to="/project-management/login" replace /> },
      { path: "/project-management/*", element: <ProjectManagementRoutes /> },
      { path: "*", element: <Navigate to="/project-management/login" replace /> },
    ]);
  }
  if (activeModule === "quality-control") {
    return useRoutes([
      { path: "/", element: <Navigate to="/quality-control/login" replace /> },
      { path: "/quality-control/*", element: <QualityControlRoutes /> },
      { path: "*", element: <Navigate to="/quality-control/login" replace /> },
    ]);
  }

  // Apex (bdgestion.org / www) y entorno local: landing + módulos bajo prefijo.
  const routes = [
    {
      path: "/auth/*",
      element: <LegacyAuthRedirect />,
    },
    {
      path: "/project-management/*",
      element: <ProjectManagementRoutes />
    },
    {
      path: "/project/*",
      element: <LegacyProjectRedirect />
    },
    {
      path: "/quality-control/*",
      element: <QualityControlRoutes />
    },
    {
      path: "/executive/*",
      element: <ExecutiveRoutes />,
    },
    {
      path: "/",
      // Landing principal del ERP: acceso a todos los módulos.
      element: <LandingPage />,
    },
    {
      path: "*",
      element: (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#f5f0e8] px-6 text-center">
          <div className="grid size-16 place-items-center rounded-2xl border border-[#d8d0c4] bg-white text-[#d9772f] shadow-[0_12px_30px_rgba(28,15,8,0.08)]">
            <Compass className="size-8 stroke-[1.6]" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9561d]">Error 404</p>
            <h1 className="font-display text-[clamp(36px,6vw,64px)] font-normal leading-none tracking-[0.01em] text-[#111416]">
              Página no encontrada
            </h1>
            <p className="mx-auto mt-3 max-w-[420px] text-[13px] leading-relaxed text-[#4e5558]">
              La página que buscas no existe o fue movida. Revisa la dirección o vuelve al inicio.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2 border border-[#d9772f] bg-[#d9772f] px-5 text-[12px] font-bold text-white no-underline transition-colors hover:border-[#b9561d] hover:bg-[#b9561d]"
          >
            <Home className="size-4" />
            Volver al inicio
          </Link>
        </div>
      ),
    },
  ]

  return useRoutes(routes)
}
