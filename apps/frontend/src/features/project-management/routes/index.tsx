import { Route, Routes } from "react-router-dom";
import {
  DashboardPage,
  ProjectsExplorerPage,
  CompanyDetailsPage,
  TransferProjectsPage,
  EditCompanyPage,
  ProjectDetailsPage,
  ProjectPhysicalProgressPage,
  CreateCompanyPage,
  CreateProjectPage,
  AssignPlannerPage,
  PlannerDashboardPage,
  CreatePhysicalProgressPage,
  ClientDashboardPage,
  ProjectGalleryPage,
  NoAccessPage,
  LoginPage,
  RegisterPage,
  VerifyPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ChangePasswordPage,
  ProfilePage,
  FinancialDashboardPage,
  CreateObligationPage,
} from "../pages";
import { PrivateRoute, PublicOnlyRoute, PmRoleRoute, RoleDashboardRedirect } from "./guards";
import { UsersManagementView } from "../components/UsersManagementView";

import { lazy, Suspense } from "react";

const FinancialPlanningView = lazy(() => import("../pages/FinancialPlanningView").then(m => ({ default: m.FinancialPlanningView })));
const CostPlanningView = lazy(() => import("../pages/CostPlanningView").then(m => ({ default: m.CostPlanningView })));
const PayablesView = lazy(() => import("../pages/PayablesView").then(m => ({ default: m.PayablesView })));
const ProjectExpensesView = lazy(() => import("../pages/ProjectExpensesView").then(m => ({ default: m.ProjectExpensesView })));
const ProjectCollectionsView = lazy(() => import("../pages/ProjectCollectionsView").then(m => ({ default: m.ProjectCollectionsView })));

// Roles del módulo Project Management
const PM_GESTION_ADMIN = ["PM_GESTION", "PM_ADMIN"];
const PM_DASHBOARD_GESTION_ROLES = ["PM_GESTION", "PM_ADMIN"];
const PM_PLANIFICADOR_ADMIN = ["PM_PLANIFICADOR", "PM_ADMIN"];
const PM_DIRECCION_ADMIN = ["PM_DIRECCION", "PM_ADMIN"];
// Lectura de proyectos/empresas/satélites: todos los roles del módulo (el backend
// filtra por empresa para dirección). PM_DIRECCION debe poder entrar a los detalles.
const PM_READ_ROLES = ["PM_GESTION", "PM_ADMIN", "PM_PLANIFICADOR", "PM_DIRECCION", "PM_ADMIN_FINANCIERO"];
const PM_PAYABLES_READ_ROLES = ["PM_ADMIN", "PM_GESTION", "PM_ADMIN_FINANCIERO"];
const PM_PAYABLES_WRITE_ROLES = ["PM_ADMIN", "PM_ADMIN_FINANCIERO"];
// Avance físico: lectura (planificador, gestión, admin, dirección). El financiero no accede a avances.
const PM_PROGRESS_READ_ROLES = ["PM_GESTION", "PM_ADMIN", "PM_PLANIFICADOR", "PM_DIRECCION"];
// Crear avance físico: SOLO quien puede escribirlos (planificador/gestión/admin).
// Dirección NO crea avances (el backend rechaza con 403).
const PM_PROGRESS_WRITE_ROLES = ["PM_GESTION", "PM_ADMIN", "PM_PLANIFICADOR"];
// Galería de archivos: lectura (planificador, gestión, admin, dirección). El financiero no accede a galería.
const PM_GALLERY_READ_ROLES = ["PM_GESTION", "PM_ADMIN", "PM_PLANIFICADOR", "PM_DIRECCION"];

export const ProjectManagementRoutes = () => {
  return (
    <Routes>
      {/* Auth del módulo — identifica el módulo en la ruta */}
      <Route
        path="login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="register" element={
        <PublicOnlyRoute>
          <RegisterPage />
        </PublicOnlyRoute>
      } />
      {/* verify NO va en PublicOnlyRoute: el login no exige emailVerified, así que
          un usuario con sesión pero email sin verificar debe poder completar el OTP. */}
      <Route path="verify" element={<VerifyPage />} />
      {/* forgot/reset quedan SIN PublicOnlyRoute: un usuario con sesión activa también
          puede necesitar recuperar/restablecer su contraseña (enlaces llegados por email). */}
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />

      {/* Rutas privadas del módulo — TODAS exigen sesión válida (token no expirado) */}
      <Route element={<PrivateRoute />}>
        <Route index element={<RoleDashboardRedirect />} />

        {/* Perfil del usuario logueado */}
        <Route path="perfil" element={<ProfilePage />} />

        {/* Cambiar contraseña — usuario logueado */}
        <Route path="cambiar-contrasena" element={<ChangePasswordPage />} />

        {/* Dashboards - protegidos por rol */}
        <Route path="gestion" element={
          <PmRoleRoute allowedRoles={PM_DASHBOARD_GESTION_ROLES}>
            <DashboardPage />
          </PmRoleRoute>
        } />
        <Route path="planificador" element={
          <PmRoleRoute allowedRoles={PM_PLANIFICADOR_ADMIN}>
            <PlannerDashboardPage />
          </PmRoleRoute>
        } />
        <Route path="cliente" element={
          <PmRoleRoute allowedRoles={PM_DIRECCION_ADMIN}>
            <ClientDashboardPage />
          </PmRoleRoute>
        } />
        <Route path="finanzas" element={
          <PmRoleRoute allowedRoles={PM_PAYABLES_READ_ROLES}>
            <FinancialDashboardPage />
          </PmRoleRoute>
        } />

        {/* Usuario autenticado sin rol asignado (evita bucles de redirección) */}
        <Route path="sin-acceso" element={<NoAccessPage />} />

        {/* Explorar y detalles - accesible para todos los roles autenticados (con restricciones) */}
        <Route path="explorar" element={
          <PmRoleRoute allowedRoles={PM_READ_ROLES}>
            <ProjectsExplorerPage />
          </PmRoleRoute>
        } />
        <Route path="empresa/:id" element={
          <PmRoleRoute allowedRoles={PM_READ_ROLES}>
            <CompanyDetailsPage />
          </PmRoleRoute>
        } />
        <Route path="empresa/:id/editar" element={
          <PmRoleRoute allowedRoles={PM_GESTION_ADMIN}>
            <EditCompanyPage />
          </PmRoleRoute>
        } />
        <Route path="empresa/:id/transferir" element={
          <PmRoleRoute allowedRoles={PM_GESTION_ADMIN}>
            <TransferProjectsPage />
          </PmRoleRoute>
        } />
        <Route path="detalle/:id" element={
          <PmRoleRoute allowedRoles={PM_READ_ROLES}>
            <ProjectDetailsPage />
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/avances" element={
          <PmRoleRoute allowedRoles={PM_PROGRESS_READ_ROLES}>
            <ProjectPhysicalProgressPage />
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/galeria" element={
          <PmRoleRoute allowedRoles={PM_GALLERY_READ_ROLES}>
            <ProjectGalleryPage />
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/financiero" element={
          <PmRoleRoute allowedRoles={PM_READ_ROLES}>
            <Suspense fallback={<div>Cargando...</div>}>
              <FinancialPlanningView />
            </Suspense>
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/costos" element={
          <PmRoleRoute allowedRoles={PM_READ_ROLES}>
            <Suspense fallback={<div>Cargando...</div>}>
              <CostPlanningView />
            </Suspense>
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/cuentas-por-pagar" element={
          <PmRoleRoute allowedRoles={PM_PAYABLES_READ_ROLES}>
            <Suspense fallback={<div>Cargando...</div>}>
              <PayablesView />
            </Suspense>
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/desembolsos" element={
          <PmRoleRoute allowedRoles={PM_PAYABLES_READ_ROLES}>
            <Suspense fallback={<div>Cargando...</div>}>
              <ProjectExpensesView />
            </Suspense>
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/costo-real" element={
          <PmRoleRoute allowedRoles={PM_PAYABLES_READ_ROLES}>
            <Suspense fallback={<div>Cargando...</div>}>
              <ProjectExpensesView />
            </Suspense>
          </PmRoleRoute>
        } />
        <Route path="detalle/:id/cobros" element={
          <PmRoleRoute allowedRoles={PM_PAYABLES_READ_ROLES}>
            <Suspense fallback={<div>Cargando...</div>}>
              <ProjectCollectionsView />
            </Suspense>
          </PmRoleRoute>
        } />

        {/* Gestión de usuarios */}
        <Route
          path="usuarios"
          element={
            <PmRoleRoute allowedRoles={PM_GESTION_ADMIN}>
              <UsersManagementView />
            </PmRoleRoute>
          }
        />

        {/* Creación y asignación - SOLO gestión y administrador */}
        <Route
          path="company/create"
          element={
            <PmRoleRoute allowedRoles={PM_GESTION_ADMIN}>
              <CreateCompanyPage />
            </PmRoleRoute>
          }
        />
        <Route
          path="create"
          element={
            <PmRoleRoute allowedRoles={PM_GESTION_ADMIN}>
              <CreateProjectPage />
            </PmRoleRoute>
          }
        />
        <Route
          path="detalle/:id/asignar-planificador"
          element={
            <PmRoleRoute allowedRoles={PM_GESTION_ADMIN}>
              <AssignPlannerPage />
            </PmRoleRoute>
          }
        />

        {/* Crear avance físico - Planificador, gestión y administrador (NO dirección) */}
        <Route
          path="detalle/:id/crear-avance"
          element={
            <PmRoleRoute allowedRoles={PM_PROGRESS_WRITE_ROLES}>
              <CreatePhysicalProgressPage />
            </PmRoleRoute>
          }
        />

        {/* Crear obligación (cuentas por pagar) - Administrador y Administrador Financiero */}
        <Route
          path="detalle/:id/crear-obligacion"
          element={
            <PmRoleRoute allowedRoles={PM_PAYABLES_WRITE_ROLES}>
              <CreateObligationPage />
            </PmRoleRoute>
          }
        />
        <Route
          path="detalle/:id/nueva-obligacion"
          element={
            <PmRoleRoute allowedRoles={PM_PAYABLES_WRITE_ROLES}>
              <CreateObligationPage />
            </PmRoleRoute>
          }
        />
      </Route>
    </Routes>
  );
};
