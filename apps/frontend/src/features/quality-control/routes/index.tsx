import { Route, Routes } from "react-router-dom";
import {
  AdminDashboardPage,
  AuditLogPage,
  DirectorDashboardPage,
  IndicatorDetailPage,
  IndicatorsPage,
  LoginPage,
  MeasurementsPage,
  NoAccessPage,
  OwnerDashboardPage,
  ProcessesPage,
  RegisterPage,
  ReportsPage,
  UsersPage,
  AdminIndicatorsPage,
  ChangePasswordPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyPage,
} from "../pages";
import {
  PrivateRoute,
  PublicOnlyRoute,
  QcRoleDashboardRedirect,
  QcRoleRoute,
} from "./guards";
import { QC_ROLES } from "../types";

const ADMIN_ONLY = [QC_ROLES.ADMIN];
const MANAGER = [QC_ROLES.ADMIN, QC_ROLES.DIRECTOR];
const ALL_ROLES = [QC_ROLES.ADMIN, QC_ROLES.DIRECTOR, QC_ROLES.OWNER];

export const QualityControlRoutes = () => {
  return (
    <Routes>
      {/* Auth del módulo */}
      <Route
        path="login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      {/* verify NO va en PublicOnlyRoute: el login no exige emailVerified, así que
          un usuario con sesión pero email sin verificar debe poder completar el OTP. */}
      <Route path="verify" element={<VerifyPage />} />
      {/* forgot/reset quedan SIN PublicOnlyRoute: un usuario con sesión activa también
          puede necesitar recuperar/restablecer su contraseña (enlaces llegados por email). */}
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />

      {/* Rutas privadas — todas exigen sesión válida */}
      <Route element={<PrivateRoute />}>
        <Route index element={<QcRoleDashboardRedirect />} />

        {/* Cambiar contraseña — usuario logueado */}
        <Route path="cambiar-contrasena" element={<ChangePasswordPage />} />

        {/* Usuario autenticado sin rol asignado (evita bucles) */}
        <Route path="sin-acceso" element={<NoAccessPage />} />

        {/* Dashboards por rol */}
        <Route
          path="admin"
          element={
            <QcRoleRoute allowedRoles={ADMIN_ONLY}>
              <AdminDashboardPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="director"
          element={
            <QcRoleRoute allowedRoles={[QC_ROLES.DIRECTOR, QC_ROLES.ADMIN]}>
              <DirectorDashboardPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="owner"
          element={
            <QcRoleRoute allowedRoles={[QC_ROLES.OWNER, QC_ROLES.ADMIN, QC_ROLES.DIRECTOR]}>
              <OwnerDashboardPage />
            </QcRoleRoute>
          }
        />

        {/* Operación — todos los roles autenticados */}
        <Route
          path="indicadores"
          element={
            <QcRoleRoute allowedRoles={ALL_ROLES}>
              <IndicatorsPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="indicadores/:id"
          element={
            <QcRoleRoute allowedRoles={ALL_ROLES}>
              <IndicatorDetailPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="mediciones"
          element={
            <QcRoleRoute allowedRoles={ALL_ROLES}>
              <MeasurementsPage />
            </QcRoleRoute>
          }
        />

        {/* Control — solo admin/director */}
        <Route
          path="reportes"
          element={
            <QcRoleRoute allowedRoles={MANAGER}>
              <ReportsPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <QcRoleRoute allowedRoles={MANAGER}>
              <AuditLogPage />
            </QcRoleRoute>
          }
        />

        {/* Administración — solo QC_ADMIN */}
        <Route
          path="procesos"
          element={
            <QcRoleRoute allowedRoles={ADMIN_ONLY}>
              <ProcessesPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="admin/indicadores"
          element={
            <QcRoleRoute allowedRoles={ADMIN_ONLY}>
              <AdminIndicatorsPage />
            </QcRoleRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <QcRoleRoute allowedRoles={ADMIN_ONLY}>
              <UsersPage />
            </QcRoleRoute>
          }
        />
      </Route>
    </Routes>
  );
};
