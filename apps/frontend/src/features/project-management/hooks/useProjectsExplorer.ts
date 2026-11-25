import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { projectService } from "../api";
import type { Project } from "../interfaces/project.types";

export type ExplorerViewMode = "companies" | "projects";

export function useProjectsExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get("tab") as ExplorerViewMode) || "companies";

  const setViewMode = (mode: ExplorerViewMode) => {
    setSearchParams({ tab: mode }, { replace: true });
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; logoUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsData, companiesData] = await Promise.all([
          projectService.getAll(),
          projectService.getCompanies(),
        ]);
        setProjects(projectsData);
        setCompanies(companiesData);
      } catch (err) {
        setError("Error al cargar los datos del explorador");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    viewMode,
    setViewMode,
    projects,
    companies,
    loading,
    error,
  };
}
