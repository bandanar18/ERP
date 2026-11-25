// Tipos públicos de la API
export interface LastProgressInfo {
  id: string;
  date: Date;           // Fecha de registro del reporte
  startDate?: Date | null;   // Fecha inicio del periodo reportado
  endDate?: Date | null;     // Fecha fin del periodo reportado
  actualProgress: string | null;
  plannedProgress: string | null;
  attentionPoints?: string | null;
}

export interface ManagerInfo {
  managerId: string;
  managerName: string;
  managerEmail: string;
}

export interface ProjectWithLastProgress {
  projectId: string;
  projectCode: string;
  projectName: string;
  shortName?: string | null;
  status: string;
  manager: ManagerInfo | null;
  lastProgress: LastProgressInfo | null;
}

export interface CompanyWithProjects {
  companyId: string;
  companyName: string;
  managers: ManagerInfo[];
  projects: ProjectWithLastProgress[];
}

export interface PlannerProgressResponse {
  companies: CompanyWithProjects[];
}

// Para el endpoint de últimos avances por empresa
export interface CompanyLatestProgress {
  companyId: string;
  companyName: string;
  managers: ManagerInfo[];
  latestProgress: Array<{
    projectId: string;
    projectCode: string;
    projectName: string;
    manager: ManagerInfo | null;
    progress: LastProgressInfo;
  }>;
}

// Para el endpoint de todos los avances de un proyecto
export interface ProjectAllProgressResponse {
  projectId: string;
  projectCode: string;
  projectName: string;
  manager: ManagerInfo | null;
  progress: Array<{
    id: string;
    date: Date;           // Fecha de registro del reporte
    startDate?: Date | null;   // Fecha inicio del periodo reportado
    endDate?: Date | null;     // Fecha fin del periodo reportado
    actualProgress: string | null;
    plannedProgress: string | null;
    attentionPoints?: string | null;
  }>;
}

// Tipos internos del servicio
export interface PlannerFilter {
  plannerId: string;
  companyId?: string;
}
