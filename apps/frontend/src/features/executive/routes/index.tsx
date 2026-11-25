import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Spinner } from "@/features/executive/components/ui/spinner";
import { AppLayout } from "../layouts/AppLayout";

import { AdminHomePage } from "../pages/admin/AdminHomePage";
import { AdminStructurePage } from "../pages/admin/AdminStructurePage";
import { AdminIndicatorsPage } from "../pages/admin/AdminIndicatorsPage";
import { AccessManagementPage } from "../pages/admin/AccessManagementPage";
import { OwnerDashboardPage } from "../pages/owner/OwnerDashboardPage";
import { OwnerIndicatorsPage } from "../pages/owner/OwnerIndicatorsPage";
import { OwnerHistoryPage } from "../pages/owner/OwnerHistoryPage";
import { OwnerProfilePage } from "../pages/owner/OwnerProfilePage";
import { DirectorHomePage } from "../pages/director/DirectorHomePage";
import { IndicatorSheetPage } from "../pages/owner/IndicatorSheetPage";
import { MeasurementUploadPage } from "../pages/owner/MeasurementUploadPage";
import { MeasurementReviewPage } from "../pages/admin/MeasurementReviewPage";
import { AuditLogPage } from "../pages/admin/AuditLogPage";
import { ConsolidatedReportPage } from "../pages/admin/ConsolidatedReportPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import { useAuthStore } from "../shared/store/auth.store";
import { apiUrl } from "../shared/api/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute = ({ children }: { children?: ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/executive/login" replace />;
  // La autorización se valida en el servidor (@Roles) por endpoint.
  // Si un usuario accede a una ruta que no le corresponde, las llamadas fallan con 403.
  return children ? <>{children}</> : <Outlet />;
};

/**
 * Obtiene la ruta post-login desde el servidor (/auth/me/redirect)
 * para no exponer el mapeo rol→ruta en el cliente.
 */
function ServerRedirect({ fallback }: { fallback: string }) {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/executive/login", { replace: true });
      return;
    }

    fetch(apiUrl("/auth/me/redirect"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to get redirect");
        return res.json();
      })
      .then((data) => {
        let path =
          typeof data?.path === "string" && data.path.startsWith("/")
            ? data.path
            : fallback;
        // Fallback: sesión válida sin panel propio → panel admin.
        if (path === "/login") path = "/admin";
        navigate(`/executive${path}`, { replace: true });
      })
      .catch(() => {
        navigate(fallback, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [token, navigate, fallback]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return null;
}

const PublicOnlyRoute = ({ children }: { children?: ReactNode }) => {
  const { token } = useAuthStore();
  if (token) return <ServerRedirect fallback="/executive" />;
  return children ? <>{children}</> : <Outlet />;
};

const RootRedirect = () => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/executive/login" replace />;
  return <ServerRedirect fallback="/executive" />;
};

/**
 * Módulo del Sistema de Gestión de Calidad (QMS), integrado en el ERP.
 * Vive bajo /executive/* dentro del SPA principal (apps/frontend) y consume
 * el módulo ejecutivo del backend (/api/executive → puerto 3000).
 */
export const ExecutiveRoutes = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route index element={<RootRedirect />} />

        {/* Rutas protegidas con el layout del QMS (sidebar + header) */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Admin */}
          <Route path="admin" element={<AdminHomePage />} />
          <Route path="admin/estructura" element={<AdminStructurePage />} />
          <Route path="admin/indicadores" element={<AdminIndicatorsPage />} />
          <Route path="admin/revision" element={<MeasurementReviewPage />} />
          <Route path="admin/informes" element={<ConsolidatedReportPage />} />
          <Route path="admin/auditoria" element={<AuditLogPage />} />
          <Route path="administracion/accesos" element={<AccessManagementPage />} />

          {/* Director */}
          <Route path="director" element={<DirectorHomePage />} />

          {/* Process Owner — módulos operativos */}
          <Route path="owner" element={<OwnerDashboardPage />} />
          <Route path="owner/indicators" element={<OwnerIndicatorsPage />} />
          <Route path="owner/indicadores/:id" element={<IndicatorSheetPage />} />
          <Route path="owner/indicadores/:id/carga" element={<MeasurementUploadPage />} />
          <Route path="owner/profile" element={<OwnerProfilePage />} />
          <Route path="owner/history" element={<OwnerHistoryPage />} />

          {/* Redirecciones para rutas legacy */}
          <Route path="owner/upload" element={<Navigate to="/executive/owner/indicators" replace />} />
          <Route path="owner/bandeja" element={<Navigate to="/executive/owner/indicators" replace />} />
          <Route path="owner/processes" element={<Navigate to="/executive/owner/indicators" replace />} />
          <Route path="owner/docs" element={<Navigate to="/executive/owner/indicators" replace />} />
        </Route>

        {/* Auth público */}
        <Route
          path="login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* Legacy / redirects */}
        <Route path="dashboard" element={<RootRedirect />} />
        <Route path="process-owner" element={<RootRedirect />} />
        <Route path="revision-mediciones" element={<Navigate to="/executive/admin/revision" replace />} />
        <Route path="auditoria" element={<Navigate to="/executive/admin/auditoria" replace />} />
        <Route path="informes" element={<Navigate to="/executive/admin/informes" replace />} />

        <Route path="*" element={<RootRedirect />} />
      </Routes>

      <Toaster position="bottom-right" closeButton richColors />
    </QueryClientProvider>
  );
};
