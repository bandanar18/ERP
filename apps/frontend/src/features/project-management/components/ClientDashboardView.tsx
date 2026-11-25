import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  FolderOpen,
  TrendingUp,
} from "lucide-react";
import { PmAppShell } from "./PmAppShell";
import { ProjectCard } from "./ProjectCard";
import { projectService } from "../api";
import { cn } from "@/lib/utils";

/* ============================================================================
   Vista del cliente / dirección
============================================================================ */
export function ClientDashboardView() {
  const [projects, setProjects] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // El frontend service ahora devuelve un array que también tiene la propiedad .company anexada
        const data: any = await projectService.getAll();
        setProjects(data);
        if (data.company) {
          setCompanyInfo(data.company);
        } else if (Array.isArray(data) && data[0]?.company) {
          setCompanyInfo(data[0].company);
        }
      } catch (err: any) {
        console.error("Error loading client projects:", err);
        setError("Error al cargar los proyectos de la empresa.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const totals = useMemo(() => {
    let facturado = 0;
    let porFacturar = 0;
    let porValuar = 0;
    let totalValuado = 0;
    projects.forEach((p) => {
      if (p.financialValuations && Array.isArray(p.financialValuations)) {
        p.financialValuations.forEach((v: any) => {
          const amount = Number(v.amountUsd || 0);
          totalValuado += amount;
          if (v.status === "FACTURADO") facturado += amount;
          if (v.status === "POR_FACTURAR") porFacturar += amount;
          if (v.status === "POR_VALUAR") porValuar += amount;
        });
      } else if (p.billedAmount) {
        facturado += Number(p.billedAmount || 0);
        totalValuado += Number(p.billedAmount || 0);
      }
    });
    return { facturado, porFacturar, porValuar, totalValuado };
  }, [projects]);

  if (loading) {
    return (
      <PmAppShell active="Resumen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Sincronizando información...</p>
          </div>
        </div>
      </PmAppShell>
    );
  }

  if (error) {
    return (
      <PmAppShell active="Resumen">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <AlertCircle className="mb-4 h-12 w-12 text-[#c85454]" />
          <p className="font-semibold text-[#c85454]">{error}</p>
        </div>
      </PmAppShell>
    );
  }

  const companyName = companyInfo?.name || (projects.length > 0 ? projects[0]?.company?.name : null) || "empresa";
  const companyLogo = companyInfo?.logoUrl || (projects.length > 0 ? projects[0]?.company?.logoUrl : null) || null;
  const totalOfferedAmount = projects.reduce((sum, p) => sum + Number(p.offeredAmount || 0), 0);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const kpis = [
    {
      title: "Monto Total Ofertado",
      value: fmtMoney(totalOfferedAmount),
      change: "Suma de todos los proyectos",
      rail: "bg-[#d9772f]",
      railWidth: "72%",
    },
    {
      title: "Proyectos",
      value: String(projects.length),
      change: `${projects.length} proyecto${projects.length !== 1 ? "s" : ""} en curso vinculados`,
      rail: "bg-[#5e8fc2]",
      railWidth: "100%",
    },
    {
      title: "Facturado",
      value: fmtMoney(totals.facturado),
      change: "Total facturado a la fecha",
      rail: "bg-[#b9cd48]",
      railWidth: "84%",
    },
    {
      title: "Valuado",
      value: fmtMoney(totals.totalValuado),
      change: "Suma total de valuaciones",
      rail: "bg-[#df6e84]",
      railWidth: "36%",
    },
  ];

  return (
    <PmAppShell
      active="Resumen"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span> <strong className="text-[#111416]">Resumen Ejecutivo</strong>
        </>
      }
    >
      {/* Cabecera */}
      <div className="mb-4 flex items-end justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start">
        <div>
          <p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
            Panel de control / Dirección y clientes
          </p>
          <h1 id="page-title" className="font-display mb-1 text-[clamp(30px,3vw,44px)] font-normal leading-[0.88] tracking-[0.01em]">
            Resumen ejecutivo
          </h1>
          <p className="text-[11px] text-[#4e5558]">
            Consolidado general y listado de todas las obras en curso vinculadas a su empresa
          </p>
        </div>
        <Link
          to="/project-management/explorar"
          className="inline-flex min-h-9 items-center justify-center gap-[9px] rounded-lg border border-[#d9772f] bg-[#d9772f] px-4 text-[11px] font-bold text-white transition-colors hover:border-[#b9561d] hover:bg-[#b9561d] max-[820px]:w-full"
        >
          <FolderOpen className="h-[15px] w-[15px]" />
          Ver proyectos
        </Link>
      </div>

      {/* Banner de empresa */}
      <div className="mb-3 flex flex-col gap-4 rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {companyLogo && !logoFailed ? (
            <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8d0c4] bg-white p-1.5 shadow-2xs">
              <img
                src={companyLogo}
                alt={`Logo ${companyName}`}
                className="max-h-full max-w-full object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          ) : (
            <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-[#111416] text-white shadow-2xs">
              <Building2 className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#111416]">
              Mis proyectos · {companyName}
            </h2>
            <p className="mt-0.5 text-[11px] text-[#4e5558]">
              {projects.length} proyecto{projects.length === 1 ? "" : "s"} en curso vinculados a su empresa
            </p>
          </div>
        </div>
      </div>

      {/* Métricas separadas */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
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
                <strong
                  className="font-display min-w-0 truncate text-[28px] font-normal leading-[0.9] tracking-[0.02em] max-[520px]:text-[22px]"
                  title={kpi.value}
                >
                  {kpi.value}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4e5558]">
                <TrendingUp className="h-3 w-3 shrink-0 stroke-2 text-[#4c9b7a]" />
                <span className="truncate" title={kpi.change}>{kpi.change}</span>
              </div>
            </div>
            <div className="mt-3 h-[3px] rounded-full bg-[#ece6dc]">
              <span
                className={cn("block h-full rounded-full", kpi.rail)}
                style={{ width: kpi.railWidth }}
              />
            </div>
          </article>
        ))}
      </div>

      {/* Detalle de proyectos */}
      <article className="rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#fffdf9] shadow-xs">
        <div className="flex items-center justify-between gap-[15px] border-b border-[#d8d0c4] p-[10px_16px_10px]">
          <div>
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
              Obras en curso
            </div>
            <h2 className="text-[16px] font-bold tracking-[-0.03em]">Detalle de proyectos</h2>
          </div>
          <span className="text-[10px] text-[#4e5558]">{projects.length} vinculados</span>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-[#d8d0c4]" />
            <h3 className="text-lg font-bold text-[#111416]">No hay proyectos vinculados</h3>
            <p className="mt-2 text-sm text-[#4e5558]">Aún no se ha asignado ningún proyecto a su empresa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </article>

      {/* Nota inferior */}
      <div className="mt-[14px] flex items-center justify-between gap-[15px] text-[10px] text-[#4e5558] max-[520px]:flex-col max-[520px]:items-start">
        <span>Business ERP · Workspace ES · Datos actualizados automáticamente</span>
        <Link
          to="/project-management/explorar"
          className="inline-flex items-center gap-[5px] text-[10px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] hover:underline hover:underline-offset-[3px]"
        >
          Ir al explorador
          <ArrowUpRight className="h-[13px] w-[13px]" />
        </Link>
      </div>
    </PmAppShell>
  );
}
