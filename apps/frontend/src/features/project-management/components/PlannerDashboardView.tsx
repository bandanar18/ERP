import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Minus,
  Plus,
  TrendingUp,
} from "lucide-react"
import { PmAppShell } from "./PmAppShell"
import { usePmAuthStore } from "../store/auth.store"
import { projectService } from "../services/project.service"
import { companyService } from "../services/company.service"
import { ProjectsFinancialTable } from "./ProjectsFinancialTable"
import { cn } from "@/lib/utils"

/* ============================================================================
   Vista del Planificador
============================================================================ */
export function PlannerDashboardView() {
  const navigate = useNavigate()
  const user = usePmAuthStore((s) => s.user)

  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any | null>(null)
  const [, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const companyId = user?.scopes?.companyIds?.[0]

        const [projectsRes, companyRes] = await Promise.allSettled([
          projectService.getAll(),
          companyId ? companyService.getById(companyId) : Promise.resolve(null),
        ])

        if (!isMounted) return

        let fetchedProjects: any[] = []
        if (projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value)) {
          fetchedProjects = projectsRes.value
        }

        let fetchedCompany: any = null
        if (companyRes.status === "fulfilled" && companyRes.value) {
          fetchedCompany = companyRes.value
        } else if (fetchedProjects.length > 0 && fetchedProjects[0]?.company) {
          fetchedCompany = fetchedProjects[0].company
        }

        setProjects(fetchedProjects)
        setCompany(fetchedCompany)
      } catch (err) {
        console.error("Error al cargar datos del planificador:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      isMounted = false
    }
  }, [user])

  /* Cálculos derivados reales */
  const companyName = company?.name || projects[0]?.company?.name || "Sin empresa asignada"
  const totalProjects = projects.length
  const inProgressProjects = projects.filter((p) => p.status === "IN_PROGRESS").length

  const projectsWithProgress = useMemo(
    () => projects.filter((p) => p.lastProgress?.actualProgress != null),
    [projects]
  )

  const avgProgress = useMemo(() => {
    if (projectsWithProgress.length === 0) return 0
    const sum = projectsWithProgress.reduce((acc, p) => {
      const raw = p.lastProgress.actualProgress
      const num = parseInt(String(raw).replace("%", ""))
      return acc + (isNaN(num) ? 0 : num)
    }, 0)
    return Math.round(sum / projectsWithProgress.length)
  }, [projectsWithProgress])

  const latestProject = useMemo(() => {
    if (projectsWithProgress.length === 0) return null
    return [...projectsWithProgress].sort((a, b) => {
      const tA = a.lastProgress?.date ? new Date(a.lastProgress.date).getTime() : 0
      const tB = b.lastProgress?.date ? new Date(b.lastProgress.date).getTime() : 0
      return tB - tA
    })[0]
  }, [projectsWithProgress])

  const latestProgressDate = latestProject?.lastProgress?.date
    ? new Date(latestProject.lastProgress.date)
        .toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
        .toUpperCase()
    : "Sin avances"

  // Cumplimiento Global = (Total Cobrado / Total Facturado o Valuado) * 100 de sus proyectos
  const { globalCompliancePct, hasFacturado } = useMemo(() => {
    let cobradoSum = 0
    let facturadoSum = 0

    for (const p of projects) {
      const cobrado = Number(p.collectedAmount || p.paidAmount || 0)
      cobradoSum += cobrado

      let facturado = Number(p.billedAmount || p.valuatedAmount || 0)
      if (!facturado && Array.isArray(p.financialValuations) && p.financialValuations.length > 0) {
        const facturadas = p.financialValuations.filter((v: any) => v.status === "FACTURADO")
        if (facturadas.length > 0) {
          facturado = facturadas.reduce((sum: number, v: any) => sum + Number(v.amountUsd || 0), 0)
        } else {
          facturado = p.financialValuations.reduce((sum: number, v: any) => sum + Number(v.amountUsd || 0), 0)
        }
      }
      facturadoSum += facturado
    }

    const hasBase = facturadoSum > 0
    const pct = hasBase ? Math.round((cobradoSum / facturadoSum) * 100) : 0
    return {
      globalCompliancePct: pct,
      hasFacturado: hasBase,
    }
  }, [projects])

  const plannerStats = [
    {
      title: "Proyectos Asignados",
      value: String(totalProjects),
      change:
        totalProjects > 0
          ? `+${inProgressProjects} en ejecución`
          : "Sin proyectos aún",
      subLabel: totalProjects > 0 ? "en ejecución" : "asignados",
      railWidth: totalProjects > 0 ? "72%" : "0%",
    },
    {
      title: "Cumplimiento Global",
      value: `${globalCompliancePct}%`,
      change: hasFacturado
        ? (globalCompliancePct > 0
            ? `+${globalCompliancePct}% cobrado de facturado`
            : `0% cobrado de facturado`)
        : "Sin base de cálculo",
      subLabel: hasFacturado ? "cobros / facturado" : "sin facturación",
      railWidth: hasFacturado
        ? `${Math.min(100, Math.max(0, globalCompliancePct))}%`
        : "0%",
    },
    {
      title: "Empresa Asignada",
      value: companyName,
      change: `${totalProjects} proyectos vinculados`,
      subLabel: "empresa",
      railWidth: "84%",
    },
    {
      title: "Último Avance",
      value: latestProgressDate,
      change: latestProject ? `Proyecto ${latestProject.code || latestProject.projectCode}` : "Sin actividad reciente",
      subLabel: latestProject ? "reciente" : "sin registro",
      railWidth: "92%",
    },
  ]

  const activityList = useMemo(() => {
    if (projects.length === 0) return []
    return projects.slice(0, 4).map((p) => {
      if (p.lastProgress) {
        return {
          title: "Avance registrado",
          meta: `${p.code} (${p.fullName}) · ${new Date(p.lastProgress.date).toLocaleDateString("es-ES")} - ${p.lastProgress.actualProgress}%`,
          action: "Ver",
          severity: "bg-[#4c9b7a]",
          to: `/project-management/detalle/${p.id}`,
        }
      }
      return {
        title: "Avance pendiente",
        meta: `${p.code} (${p.fullName}) · Sin reporte registrado`,
        action: "Registrar",
        severity: "bg-[#d9772f]",
        to: `/project-management/detalle/${p.id}`,
      }
    })
  }, [projects])

  const trend = (change: string) => {
    if (change.startsWith("+") || change.includes("activos")) return { Icon: TrendingUp, tone: "text-[#4c9b7a]" }
    if (change.startsWith("-") || change.includes("Sin")) return { Icon: Minus, tone: "text-[#4e5558]" }
    return { Icon: TrendingUp, tone: "text-[#4c9b7a]" }
  }

  const railWidths = ["72%", "48%", "84%", "92%"]
  const railColors = ["bg-[#d9772f]", "bg-[#5e8fc2]", "bg-[#b9cd48]", "bg-[#df6e84]"]

  return (
    <PmAppShell
      active="Resumen"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span> <strong className="text-[#111416]">Panel de Planificador</strong>
        </>
      }
    >
      {/* Cabecera */}
      <div className="mb-4 flex items-end justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start">
        <div>
          <div className="mb-[4px] flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
              Panel de control / Rol Planificador
            </span>
            {company && (
              <>
                <span className="text-[#d8d0c4]">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#111416]">
                  <Building2 className="h-3 w-3 text-[#d9772f]" />
                  {company.name}
                </span>
              </>
            )}
          </div>
          <h1 id="page-title" className="font-display mb-1 text-[clamp(30px,3vw,44px)] font-normal leading-[0.88] tracking-[0.01em]">
            Panel de planificador
          </h1>
          <p className="text-[11px] text-[#4e5558]">
            {company
              ? `Empresa: ${company.name} · Proyectos asignados y avances físicos de tu planificación`
              : "Proyectos asignados · avances físicos y próximos hitos de tu planificación"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/project-management/explorar")}
          className="inline-flex min-h-9 items-center justify-center gap-[9px] rounded-lg border border-[#d9772f] bg-[#d9772f] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#b9561d] hover:bg-[#b9561d] max-[820px]:w-full"
        >
          <Plus className="h-[15px] w-[15px]" />
          Ver proyectos y avances
        </button>
      </div>

      {/* Métricas */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plannerStats.map((kpi, i) => {
          const { Icon, tone } = trend(kpi.change)
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
                  <strong className="font-display truncate text-[28px] font-normal leading-[0.9] tracking-[0.02em] max-[520px]:text-[20px]" title={kpi.value}>
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

      {/* Grid secundario: actividad + accesos */}
      <div className="mb-3 grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-4 max-[820px]:grid-cols-1">
        <article aria-labelledby="activity-title" className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
          <div className="flex items-center justify-between gap-[15px] border-b border-[#d8d0c4] p-[10px_16px_10px]">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Actividad de proyectos
              </div>
              <h2 id="activity-title" className="text-[16px] font-bold tracking-[-0.03em]">
                Movimientos de tu planificación
              </h2>
            </div>
            <span className="text-[10px] text-[#4e5558]">{activityList.length} recientes</span>
          </div>
          {activityList.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#4e5558]">
              No hay proyectos o reportes registrados todavía.
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {activityList.map((a, i) => (
                <li key={i} className="grid min-h-[50px] grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d8d0c4] p-[10px_16px] last:border-b-0">
                  <span className={cn("h-[28px] w-[6px] rounded-full", a.severity)} />
                  <div className="min-w-0">
                    <div className="mb-[3px] truncate text-[11px] font-bold">{a.title}</div>
                    <div className="truncate text-[10px] text-[#4e5558]">{a.meta}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(a.to)}
                    className="inline-flex items-center gap-[6px] whitespace-nowrap text-[10px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] hover:underline hover:underline-offset-[3px]"
                  >
                    {a.action}
                    <ArrowUpRight className="h-[14px] w-[14px]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article aria-labelledby="access-title" className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
          <div className="flex items-center justify-between gap-[15px] border-b border-[#d8d0c4] p-[10px_16px_10px]">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Atajos
              </div>
              <h2 id="access-title" className="text-[16px] font-bold tracking-[-0.03em]">
                Accesos de planificación
              </h2>
            </div>
            <span className="text-[10px] text-[#4e5558]">Abrir módulo</span>
          </div>
          <ul className="m-0 list-none p-0">
            <li className="grid min-h-[50px] grid-cols-[5px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d8d0c4] p-[9px_16px]">
              <span className="h-8 w-[5px] rounded-full bg-[#d9772f]" />
              <div className="min-w-0">
                <strong className="mb-0.5 block text-[11px]">Mis Proyectos</strong>
                <span className="text-[10px] text-[#4e5558]">Ver todos los proyectos asignados</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/project-management/explorar")}
                className="inline-flex items-center gap-[5px] text-[10px] font-bold text-[#111416] transition-colors hover:text-[#b9561d] hover:underline hover:underline-offset-[3px]"
              >
                Ingresar <ArrowRight className="h-[13px] w-[13px]" />
              </button>
            </li>
            <li className="grid min-h-[50px] grid-cols-[5px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d8d0c4] p-[9px_16px] last:border-b-0">
              <span className="h-8 w-[5px] rounded-full bg-[#5e8fc2]" />
              <div className="min-w-0">
                <strong className="mb-0.5 block text-[11px]">Avances Físicos</strong>
                <span className="text-[10px] text-[#4e5558]">Historial y registro de avances</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/project-management/explorar")}
                className="inline-flex items-center gap-[5px] text-[10px] font-bold text-[#111416] transition-colors hover:text-[#b9561d] hover:underline hover:underline-offset-[3px]"
              >
                Ingresar <ArrowRight className="h-[13px] w-[13px]" />
              </button>
            </li>
          </ul>
        </article>
      </div>

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <div className="flex min-w-[190px] items-center gap-[9px]">
          <span>Avance general</span>
          <span className="h-1 flex-1 rounded-full bg-[#d8d0c4]">
            <span className="block h-full rounded-full bg-[#111416]" style={{ width: `${avgProgress}%` }} />
          </span>
          <strong className="text-[#111416]">{avgProgress}%</strong>
        </div>
      </div>
    </PmAppShell>
  )
}
