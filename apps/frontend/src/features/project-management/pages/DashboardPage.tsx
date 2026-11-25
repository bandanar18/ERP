import { ProjectDashboardView } from "../components/ProjectDashboardView";
import { Navigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

export const DashboardPage = () => {
  const { isDireccion } = usePermission();

  if (isDireccion) {
    return <Navigate to="/project-management/cliente" replace />;
  }

  return <ProjectDashboardView />;
};
