import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { useDashboardStats } from "../hooks/useDashboardStats"
import { PmAppShell } from "./PmAppShell"
import { ProjectsFinancialTable } from "./ProjectsFinancialTable"
import { cn } from "@/lib/utils"

/* ============================================================================
   Vista de Gestión (Administrador)
============================================================================ */
export function ProjectDashboardView() {
  const navigate = useNavigate()
  const { stats, projects, companies, users } = useDashboardStats()

  const signals = useMemo(() => {
    const list: Array<{ title: string; meta: string; action: string; severity: string; to: string }> = []

    const withoutManager = projects.filter((p: any) => !p.manager && !p.managerId)
    if (withoutManager.length > 0) {
      list.push({
        title: `${withoutManager.length} proyecto${withoutManager.length > 1 ? "s" : ""} sin responsable`,
        meta: `${withoutManager[0].fullName || withoutManager[0].shortName || withoutManager[0].code} · requiere asignar planificador`,
        action: "Asignar",
        severity: "bg-[#df6e84]",
        to: `/project-management/detalle/${withoutManager[0].id}`,
      })
    }

    const withProgress = projects.filter((p: any) => p.lastProgress != null)
    if (withProgress.length > 0) {
      const latest = withProgress[0]
      list.push({
        title: "Avance físico registrado",
        meta: `${latest.fullName || latest.shortName || latest.code} · ${latest.lastProgress.actualProgress ?? "0%"} reportado`,
        action: "Ver",
        severity: "bg-[#4c9b7a]",
        to: `/project-management/detalle/${latest.id}`,
      })
    }

    const delayed = projects.filter((p: any) => p.status === "DELAYED")
    if (delayed.length > 0) {
      list.push({
        title: `${delayed.length} proyecto${delayed.length > 1 ? "s" : ""} con retraso operativo`,
        meta: `${delayed[0].fullName || delayed[0].shortName || delayed[0].code} · requiere atención inmediata`,
        action: "Revisar",
        severity: "bg-[#c85454]",
        to: `/project-management/detalle/${delayed[0].id}`,
      })
    }

    const onHold = projects.filter((p: any) => p.status === "ON_HOLD")
    if (onHold.length > 0) {
      list.push({
        title: `${onHold.length} proyecto${onHold.length > 1 ? "s" : ""} paralizado${onHold.length > 1 ? "s" : ""}`,
        meta: `${onHold[0].fullName || onHold[0].shortName || onHold[0].code} · actividades detenidas`,
        action: "Ver",
        severity: "bg-[#71717a]",
        to: `/project-management/detalle/${onHold[0].id}`,
      })
    }

    const inProgress = projects.filter((p: any) => p.status === "IN_PROGRESS")
    if (inProgress.length > 0) {
      list.push({
        title: `${inProgress.length} proyecto${inProgress.length > 1 ? "s" : ""} en ejecución activa`,
        meta: "Supervisión de cronogramas y entregables",
        action: "Revisar",
        severity: "bg-[#d9772f]",
        to: "/project-management/explorar",
      })
    }

    if (list.length === 0) {
      list.push({
        title: "Workspace operativo sin alertas",
        meta: "No hay incidencias críticas reportadas",
        action: "Explorar",
        severity: "bg-[#4c9b7a]",
        to: "/project-management/explorar",
      })
    }

    return list
  }, [projects])

  const accessList = useMemo(
    () => [
      {
        title: "Proyectos",
        desc: `${projects.length} totales · ${projects.filter((p: any) => p.status === "IN_PROGRESS").length} activos`,
        rail: "bg-[#d9772f]",
        to: "/project-management/explorar",
      },
      {
        title: "Empresas",
        desc: `${companies.length} clientes y empresas`,
        rail: "bg-[#5e8fc2]",
        to: "/project-management/explorar",
      },
      {
        title: "Usuarios",
        desc: `${users.length} usuarios en el módulo`,
        rail: "bg-[#b9cd48]",
        to: "/project-management/usuarios",
      },
      {
        title: "Contraseña",
        desc: "Cambia tu clave de acceso",
        rail: "bg-[#df6e84]",
        to: "/project-management/cambiar-contrasena",
      },
    ],
    [projects, companies, users]
  )

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" })
        .format(new Date())
        .replace(/^./, (c) => c.toUpperCase()),
    []
  )

  const trend = (change: string) => {
    if (change.startsWith("+")) return { Icon: TrendingUp, tone: "text-[#4c9b7a]" }
    if (change.startsWith("-")) return { Icon: TrendingDown, tone: "text-[#c85454]" }
    return { Icon: Minus, tone: "text-[#4e5558]" }
  }

  const railWidths = ["72%", "48%", "84%", "92%"]
  const railColors = ["bg-[#d9772f]", "bg-[#5e8fc2]", "bg-[#b9cd48]", "bg-[#df6e84]"]

  return (
    <PmAppShell active="Resumen">
      {/* Cabecera */}
      <div className="mb-4 flex items-end justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start">
        <div>
          <p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
            Panel de control / {todayLabel}
          </p>
          <h1 id="page-title" className="font-display mb-1 text-[clamp(30px,3vw,44px)] font-normal leading-[0.88] tracking-[0.01em]">
            Resumen operativo
          </h1>
          <p className="text-[11px] text-[#4e5558]">
            Última sincronización hace <strong className="text-[#111416]">4 min</strong> · lectura general del workspace
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/project-management/create")}
          className="inline-flex min-h-9 items-center justify-center gap-[9px] rounded-lg border border-[#d9772f] bg-[#d9772f] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#b9561d] hover:bg-[#b9561d] max-[820px]:w-full"
        >
          <Plus className="h-[15px] w-[15px]" />
          Nueva acción
        </button>
      </div>

      {/* Métricas */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((kpi, i) => {
          const { Icon, tone } = trend(String(kpi.change))
          return (
            <article
              key={i}
              className="flex min-w-0 flex-col justify-between rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-[12px_16px_12px] shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[0.04em] text-[#4e5558]">
                  <span className="truncate max-[520px]:text-[8px]">{kpi.title}</span>
                  <span className="font-display text-[15px] tracking-[0.05em] text-[#d8d0c4]">0{i + 1}</span>
                </div>
                <div className="my-[4px] mb-2 flex items-baseline gap-2">
                  <strong className="font-display text-[28px] font-normal leading-[0.9] tracking-[0.02em] max-[520px]:text-[22px]">
                    {kpi.value}
                  </strong>
                  <span className="max-[520px]:hidden">{kpi.subLabel ?? String(kpi.change).split(" ").slice(-2).join(" ")}</span>
                </div>
                <div className={cn("flex items-center gap-1.5 text-[10px] font-bold", tone)}>
                  <Icon className="h-3 w-3 stroke-2 shrink-0" />
                  <span className="truncate">{kpi.change}</span>
                </div>
              </div>
              <div className="mt-3 h-[3px] rounded-full bg-[#ece6dc]">
                <span className={cn("block h-full rounded-full", railColors[i % 4])} style={{ width: kpi.railWidth || railWidths[i % 4] }} />
              </div>
            </article>
          )
        })}
      </div>

      {/* Tabla Principal de Seguimiento de Proyectos */}
      <div className="mb-3">
        <ProjectsFinancialTable projects={projects} />
      </div>

      {/* Grid secundario: señales + accesos */}
      <div className="mb-3 grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-4 max-[820px]:grid-cols-1">
        <article aria-labelledby="signals-title" className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
          <div className="flex items-center justify-between gap-[15px] border-b border-[#d8d0c4] p-[10px_16px_10px]">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Bandeja de decisión
              </div>
              <h2 id="signals-title" className="text-[16px] font-bold tracking-[-0.03em]">
                Señales que requieren atención
              </h2>
            </div>
            <span className="text-[10px] text-[#4e5558]">{signals.length} pendientes</span>
          </div>
          <ul className="m-0 list-none p-0">
            {signals.map((s, i) => (
              <li key={i} className="grid min-h-[50px] grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d8d0c4] p-[10px_16px] last:border-b-0">
                <span className={cn("h-[28px] w-[6px] rounded-full", s.severity)} />
                <div className="min-w-0">
                  <div className="mb-[3px] text-[11px] font-bold">{s.title}</div>
                  <div className="text-[10px] text-[#4e5558]">{s.meta}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(s.to)}
                  className="inline-flex items-center gap-[6px] whitespace-nowrap text-[10px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] hover:underline hover:underline-offset-[3px]"
                >
                  {s.action}
                  <ArrowUpRight className="h-[14px] w-[14px]" />
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article aria-labelledby="access-title" className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
          <div className="flex items-center justify-between gap-[15px] border-b border-[#d8d0c4] p-[10px_16px_10px]">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Atajos
              </div>
              <h2 id="access-title" className="text-[16px] font-bold tracking-[-0.03em]">
                Accesos de operación
              </h2>
            </div>
            <span className="text-[10px] text-[#4e5558]">Abrir módulo</span>
          </div>
          <ul className="m-0 list-none p-0">
            {accessList.map((item, i) => (
              <li key={i} className="grid min-h-[50px] grid-cols-[5px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d8d0c4] p-[9px_16px] last:border-b-0">
                <span className={cn("h-8 w-[5px] rounded-full", item.rail)} />
                <div className="min-w-0">
                  <strong className="mb-0.5 block text-[11px]">{item.title}</strong>
                  <span className="text-[10px] text-[#4e5558]">{item.desc}</span>
                </div>
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-[5px] text-[10px] font-bold text-[#111416] transition-colors hover:text-[#b9561d] hover:underline hover:underline-offset-[3px]"
                >
                  Abrir <ArrowRight className="h-[13px] w-[13px]" />
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <div className="flex min-w-[190px] items-center gap-[9px]">
          <span>Preparación operativa</span>
          <span className="h-1 flex-1 rounded-full bg-[#d8d0c4]">
            <span className="block h-full w-[78%] rounded-full bg-[#111416]" />
          </span>
          <strong className="text-[#111416]">78%</strong>
        </div>
      </div>
    </PmAppShell>
  )
}
