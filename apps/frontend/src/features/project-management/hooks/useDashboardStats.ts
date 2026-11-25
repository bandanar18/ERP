import { useState, useEffect } from "react";
import { projectService } from "../api";
import { companyService, type Company } from "../services/company.service";
import { userService, type User } from "../services/user.service";

export interface DashboardKPI {
  title: string;
  value: string;
  change: string;
  subLabel?: string;
  railWidth?: string;
}

export function useDashboardStats() {
  const [projects, setProjects] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardKPI[]>([
    { title: "Proyectos Gestionados", value: "0", change: "Cargando...", subLabel: "cargando" },
    { title: "Empresas Registradas", value: "0", change: "Cargando...", subLabel: "cargando" },
    { title: "Usuarios del Módulo", value: "0", change: "Cargando...", subLabel: "cargando" },
    { title: "Cumplimiento Global", value: "0%", change: "Cargando...", subLabel: "cargando" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsData, companiesData, usersData] = await Promise.allSettled([
          projectService.getAll(),
          companyService.getAll(),
          userService.getModuleUsers(),
        ]);

        const resolvedProjects: any[] =
          projectsData.status === "fulfilled" && Array.isArray(projectsData.value)
            ? projectsData.value
            : [];
        const resolvedCompanies: Company[] =
          companiesData.status === "fulfilled" && Array.isArray(companiesData.value)
            ? companiesData.value
            : [];
        const resolvedUsers: User[] =
          usersData.status === "fulfilled" && Array.isArray(usersData.value)
            ? usersData.value
            : [];

        if (!isMounted) return;

        setProjects(resolvedProjects);
        setCompanies(resolvedCompanies);
        setUsers(resolvedUsers);

        // Cálculo de KPIs reales
        const totalProjects = resolvedProjects.length;
        const inProgressProjects = resolvedProjects.filter(
          (p) => p.status === "IN_PROGRESS"
        ).length;
        const activeUsers = resolvedUsers.filter((u) => u.isActive !== false).length;
        const activeCompanies = resolvedCompanies.filter(
          (c) => (c._count?.projects ?? 0) > 0
        ).length;

        // Cumplimiento Global = (Total Cobrado / Total Facturado) * 100
        let totalCobrado = 0;
        let totalFacturado = 0;

        for (const p of resolvedProjects) {
          const cobrado = Number(p.collectedAmount ?? p.paidAmount ?? 0);
          totalCobrado += cobrado;

          let facturado = Number(p.billedAmount ?? 0);
          if (!facturado && Array.isArray(p.financialValuations) && p.financialValuations.length > 0) {
            const facturadas = p.financialValuations.filter(
              (v: any) => v.status === "FACTURADO"
            );
            facturado = facturadas.reduce(
              (sum: number, v: any) => sum + Number(v.amountUsd || 0),
              0
            );
          }
          totalFacturado += facturado;
        }

        const hasFacturado = totalFacturado > 0;
        const globalCompliancePct = hasFacturado
          ? Math.round((totalCobrado / totalFacturado) * 100)
          : 0;

        setStats([
          {
            title: "Proyectos Gestionados",
            value: String(totalProjects),
            change:
              totalProjects > 0
                ? `+${inProgressProjects} en ejecución`
                : "Sin proyectos activos",
            subLabel: totalProjects > 0 ? "en ejecución" : "activos",
          },
          {
            title: "Empresas Registradas",
            value: String(resolvedCompanies.length),
            change:
              resolvedCompanies.length > 0
                ? `${activeCompanies} con proyectos activos`
                : "Sin empresas",
            subLabel: "empresas",
          },
          {
            title: "Usuarios del Módulo",
            value: String(resolvedUsers.length),
            change:
              resolvedUsers.length > 0
                ? `${activeUsers} usuarios activos`
                : "Sin usuarios",
            subLabel: "activos",
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
        ]);
      } catch (err: any) {
        console.error("Error loading dashboard stats:", err);
        if (isMounted) setError("Error al cargar estadísticas del panel");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return { projects, companies, users, stats, loading, error };
}
