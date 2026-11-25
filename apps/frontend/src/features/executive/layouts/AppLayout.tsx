import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/store/auth.store';
import DashboardLayout from '../components/mvpblocks/ui/dashboard-layout';
import {
  LayoutDashboard,
  Target,
  User,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  History,
  Network,
} from 'lucide-react';
import type { NavItem } from '../components/mvpblocks/ui/personal-sidebar';

export const AppLayout: React.FC = () => {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/executive/login");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    );
  }

  const userRoles = user?.roles ?? [];
  const roleCodes = userRoles.map((r: any) =>
    typeof r === 'string' ? r : r.role?.code ?? r.code ?? r,
  );

  const isOwner = roleCodes.includes('PROCESS_OWNER');
  const isDirector = roleCodes.includes('DIRECTOR');
  const isAdmin = roleCodes.includes('ADMIN');

  // Build navigation items based on roles
  const ownerItems: NavItem[] = [
    { name: 'Inicio', href: '/executive/owner', icon: LayoutDashboard, exact: true },
    { name: 'Mis indicadores', href: '/executive/owner/indicators', icon: Target },
    { name: 'Historial', href: '/executive/owner/history', icon: History },
    { name: 'Mi perfil', href: '/executive/owner/profile', icon: User },
  ];

  const directorItems: NavItem[] = [
    { name: 'Dashboard Ejecutivo', href: '/executive/director', icon: LayoutDashboard, exact: true },
  ];

  const adminItems: NavItem[] = [
    { name: 'Panel Admin', href: '/executive/admin', icon: LayoutDashboard, exact: true },
    { name: 'Estructura organizacional', href: '/executive/admin/estructura', icon: Network },
    { name: 'Indicadores y metas', href: '/executive/admin/indicadores', icon: Target },
    { name: 'Usuarios y accesos', href: '/executive/administracion/accesos', icon: Users },
    { name: 'Revisión de mediciones', href: '/executive/admin/revision', icon: ShieldAlert },
    { name: 'Informes consolidados', href: '/executive/admin/informes', icon: FileSpreadsheet },
    { name: 'Bitácora de trazabilidad', href: '/executive/admin/auditoria', icon: History },
  ];

  // Pick the right set of navigation items
  let items: NavItem[] = [];
  let appName = 'Portal Gestión';

  if (isAdmin) {
    items = adminItems;
    appName = 'Panel de Control';
  } else if (isDirector) {
    items = directorItems;
    appName = 'Visión Estratégica';
  } else if (isOwner) {
    items = ownerItems;
    appName = 'Portal Operativo';
  }

  return (
    <DashboardLayout
      items={items}
      appName={appName}
      logoUrl="/business.webp"
      onLogout={handleLogout}
      user={user ?? undefined}
    >
      <Outlet />
    </DashboardLayout>
  );
};
