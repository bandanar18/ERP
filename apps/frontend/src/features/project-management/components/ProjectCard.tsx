import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "../interfaces/project.types";

interface ProjectCardProps {
  project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const fullName = project.fullName || project.projectName || "Sin nombre";
  const status = project.status || "";
  const statusConfig = PROJECT_STATUS_CONFIG[status] || {
    label: status || "N/A",
    badgeClass: "bg-[#ece6dc] text-[#4e5558]",
    barClass: "bg-[#71717a]",
  };
  const companyName = project.company?.name || "Sin empresa";
  const date = project.startDate
    ? new Date(project.startDate).toLocaleDateString()
    : "N/A";
  const amount = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(project.offeredAmount || 0);

  return (
    <Link
      to={`/project-management/detalle/${project.id}`}
      className="block h-full w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="group/card relative flex h-full min-h-[170px] flex-col overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 transition-all hover:border-[#b9561d] hover:shadow-xs">
        {/* Barra de estado superior */}
        <span
          className={cn(
            "absolute left-0 top-0 z-20 h-[3px] w-full",
            statusConfig.barClass
          )}
        />

        {/* Código + estado arriba */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="rounded-md border-[#a7c9b4] bg-[#f0f7f3] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#376850] shadow-none"
          >
            {project.code}
          </Badge>
          <Badge
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[9px] shadow-none",
              statusConfig.badgeClass
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Info principal: nombre en tipografía nítida y legible */}
        <div className="flex-1">
          <CardTitle className="line-clamp-2 text-[15px] font-extrabold leading-snug text-[#111416]">
            {fullName}
          </CardTitle>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold text-[#4e5558]">
            <span className="flex min-w-0 items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#b9561d]" />
              <span className="truncate">{companyName}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-[#8d918f]">{date}</span>
          </div>
        </div>

        {/* Pie: monto + abrir */}
        <div className="mt-3 flex items-center justify-between border-t border-[#d8d0c4] pt-2">
          <span className="text-[13px] font-bold text-[#111416]">{amount}</span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#b9561d] transition-transform group-hover/card:translate-x-0.5">
            Abrir <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
