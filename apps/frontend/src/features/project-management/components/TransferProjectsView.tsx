import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { ChevronLeft, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/shared/hooks/useToast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { projectService } from "../api"
import type { Project } from "../interfaces/project.types"
import { PmAppShell } from "./PmAppShell"
import { ErpPageHeader } from "./ErpPageHeader"

type PanelId = "source" | "target"

type CompanyOption = { id: string; name: string }

const SOURCE_PANEL = "source-panel"
const TARGET_PANEL = "target-panel"

export function TransferProjectsView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [companyName, setCompanyName] = useState("Empresa")
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [targetCompanyId, setTargetCompanyId] = useState("")
  const [sourceProjects, setSourceProjects] = useState<Project[]>([])
  const [pendingProjects, setPendingProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const [{ projects, summary }, companyList] = await Promise.all([
          projectService.getProjectsByCompany(id),
          projectService.getCompanies(),
        ])
        setSourceProjects(projects)
        setPendingProjects([])
        if (summary?.companyName) {
          setCompanyName(summary.companyName)
        } else if (projects[0]?.company?.name) {
          setCompanyName(projects[0].company.name)
        } else {
          setCompanyName(companyList.find((company) => company.id === id)?.name || "Empresa")
        }
        setCompanies(companyList.filter((company) => company.id !== id))
      } catch (error) {
        console.error(error)
        toast.error("No se pudieron cargar los proyectos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const targetCompany = companies.find((company) => company.id === targetCompanyId) ?? null
  const activeProject = useMemo(() => {
    if (!activeId) return null
    return (
      sourceProjects.find((project) => project.id === activeId) ??
      pendingProjects.find((project) => project.id === activeId) ??
      null
    )
  }, [activeId, pendingProjects, sourceProjects])
  const activePanel: PanelId | null = activeProject
    ? sourceProjects.some((project) => project.id === activeProject.id)
      ? "source"
      : "target"
    : null

  const moveToPending = (projectId: string) => {
    const project = sourceProjects.find((item) => item.id === projectId)
    if (!project || !targetCompanyId) return
    setSourceProjects((current) => current.filter((item) => item.id !== projectId))
    setPendingProjects((current) =>
      current.some((item) => item.id === projectId) ? current : [...current, project]
    )
  }

  const returnToSource = (projectId: string) => {
    const project = pendingProjects.find((item) => item.id === projectId)
    if (!project) return
    setPendingProjects((current) => current.filter((item) => item.id !== projectId))
    setSourceProjects((current) =>
      current.some((item) => item.id === projectId) ? current : [...current, project]
    )
  }

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const onDragEnd = (event: DragEndEvent) => {
    const projectId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    setActiveId(null)
    if (!overId) return
    if (overId === TARGET_PANEL) moveToPending(projectId)
    if (overId === SOURCE_PANEL) returnToSource(projectId)
  }

  const confirmTransfer = async () => {
    if (!id || !targetCompanyId || pendingProjects.length === 0) return
    try {
      setSaving(true)
      await projectService.transferProjects({
        sourceCompanyId: id,
        targetCompanyId,
        projectIds: pendingProjects.map((project) => project.id),
      })
      toast.success("Proyectos trasladados")
      setConfirmOpen(false)
      navigate(`/project-management/empresa/${id}`)
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "error" in error
          ? String((error as { error?: string }).error)
          : "No se pudo completar el traslado"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando proyectos...</p>
          </div>
        </div>
      </PmAppShell>
    )
  }

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <Link to={`/project-management/empresa/${id}`} className="hover:text-[#111416]">
            {companyName}
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Transferir</strong>
        </>
      }
    >
      <div className="mb-4">
        <Link
          to={`/project-management/empresa/${id}`}
          className="flex w-fit items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416]"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a la empresa
        </Link>
      </div>

      <ErpPageHeader
        eyebrow="Empresa / Configuración"
        title="Transferir proyectos"
        copy="Arrastra los proyectos al panel de destino. El cambio se guarda al confirmar."
      />

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <ProjectPanel
            droppableId={SOURCE_PANEL}
            title={companyName}
            subtitle="Empresa actual"
            projects={sourceProjects}
            highlight={activePanel === "target"}
            emptyLabel="No quedan proyectos en esta empresa"
          />
          <DestinationPanel
            companies={companies}
            targetCompanyId={targetCompanyId}
            onTargetChange={setTargetCompanyId}
            projects={pendingProjects}
            highlight={Boolean(targetCompanyId) && activePanel === "source"}
            dropEnabled={Boolean(targetCompanyId)}
          />
        </div>

        <DragOverlay>
          {activeProject ? <ProjectCardView project={activeProject} floating /> : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-[#d8d0c4] py-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => navigate(`/project-management/empresa/${id}`)}
          className="h-10 rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-sm font-bold text-[#111416] transition-colors hover:bg-[#f5f0e8]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pendingProjects.length === 0 || !targetCompanyId}
          onClick={() => setConfirmOpen(true)}
          className="h-10 rounded-lg bg-[#111416] px-4 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirmar traslado
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-[#fffdf9] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#111416]">Confirmar traslado</DialogTitle>
            <DialogDescription className="text-[#4e5558]">
              {pendingProjects.length === 1 ? "Este proyecto" : `Estos ${pendingProjects.length} proyectos`} pasarán a{" "}
              <span className="font-semibold text-[#111416]">{targetCompany?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {pendingProjects.map((project) => (
              <li key={project.id} className="rounded-lg border border-[#d8d0c4] bg-white px-3 py-2">
                <p className="text-sm font-bold text-[#111416]">{project.fullName}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d918f]">{project.code}</p>
              </li>
            ))}
          </ul>
          <DialogFooter className="bg-[#f7f3ec]">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="h-9 rounded-lg border border-[#d8d0c4] bg-white px-3 text-sm font-bold text-[#111416]"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={confirmTransfer}
              className="h-9 rounded-lg bg-[#111416] px-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Trasladando..." : "Confirmar traslado"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PmAppShell>
  )
}

function ProjectPanel({
  droppableId,
  title,
  subtitle,
  projects,
  highlight,
  emptyLabel,
}: {
  droppableId: string
  title: string
  subtitle: string
  projects: Project[]
  highlight: boolean
  emptyLabel: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  const active = highlight && isOver

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[280px] flex-col rounded-xl border bg-[#fffdf9] p-3 transition-[border-color,background-color,box-shadow] duration-200 sm:min-h-[420px] sm:p-4",
        active
          ? "border-[#d9772f] bg-[#fff7ef] shadow-[0_0_0_3px_rgba(217,119,47,0.16)]"
          : "border-[#d8d0c4]"
      )}
    >
      <header className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">{subtitle}</p>
        <h2 className="text-base font-bold text-[#111416]">{title}</h2>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {projects.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#d8d0c4] px-4 text-center text-sm text-[#8d918f]">
            {emptyLabel}
          </p>
        ) : (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        )}
      </div>
    </section>
  )
}

function DestinationPanel({
  companies,
  targetCompanyId,
  onTargetChange,
  projects,
  highlight,
  dropEnabled,
}: {
  companies: CompanyOption[]
  targetCompanyId: string
  onTargetChange: (value: string) => void
  projects: Project[]
  highlight: boolean
  dropEnabled: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: TARGET_PANEL, disabled: !dropEnabled })
  const active = highlight && isOver
  const selected = companies.find((company) => company.id === targetCompanyId)

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[280px] flex-col rounded-xl border bg-[#fffdf9] p-3 transition-[border-color,background-color,box-shadow] duration-200 sm:min-h-[420px] sm:p-4",
        active
          ? "border-[#d9772f] bg-[#fff7ef] shadow-[0_0_0_3px_rgba(217,119,47,0.16)]"
          : "border-[#d8d0c4]"
      )}
    >
      <header className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">Empresa de destino</p>
        <label className="mt-2 block text-xs font-semibold text-[#4e5558]" htmlFor="target-company">
          Recibe los proyectos
        </label>
        <select
          id="target-company"
          value={targetCompanyId}
          onChange={(event) => onTargetChange(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-[#d8d0c4] bg-white px-3 text-sm font-semibold text-[#111416] outline-none focus:border-[#d9772f] focus:shadow-[0_0_0_3px_rgba(217,119,47,0.12)]"
        >
          <option value="">Selecciona una empresa</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {!dropEnabled && (
          <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#d8d0c4] px-4 py-8 text-center text-sm text-[#8d918f]">
            Selecciona una empresa de destino
          </p>
        )}
        {dropEnabled && projects.length === 0 && (
          <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#d8d0c4] px-4 py-8 text-center text-sm text-[#8d918f]">
            Arrastra los proyectos aquí
          </p>
        )}
        {projects.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-[#4e5558]">
              {selected ? `Pendientes para ${selected.name}` : "Pendientes de transferir"}
            </p>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <ProjectCardView project={project} />
    </div>
  )
}

function ProjectCardView({ project, floating = false }: { project: Project; floating?: boolean }) {
  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#d8d0c4] bg-white px-3 py-3",
        floating
          ? "cursor-grabbing shadow-lg"
          : "cursor-grab touch-none active:cursor-grabbing"
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-[#8d918f]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#111416]">{project.fullName}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d918f]">{project.code}</p>
      </div>
    </article>
  )
}
