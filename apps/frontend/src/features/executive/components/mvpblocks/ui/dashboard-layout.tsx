'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import PersonalSidebar from './personal-sidebar';
import PersonalHeader from './personal-header';
import type { NavItem } from './personal-sidebar';

export interface UserInfo {
  id: string;
  email: string;
  roles: string[];
  permissions?: string[];
  scopes?: { processes: string[]; subprocesses: string[]; projects: string[] };
}

interface DashboardLayoutProps {
  children: ReactNode;
  items?: NavItem[];
  appName?: string;
  logoUrl?: string;
  onLogout?: () => void;
  user?: UserInfo;
}

export default function DashboardLayout({
  children,
  items = [],
  appName = 'Portal Gestión',
  logoUrl,
  onLogout,
  user,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Get display name from email
  const displayName = user?.email?.split('@')[0] || 'Usuario';
  const roleLabel = (() => {
    if (!user?.roles) return '';
    const codes = user.roles.map(r => typeof r === 'string' ? r : (r as any).code ?? r);
    if (codes.includes('ADMIN')) return 'Administrador';
    if (codes.includes('DIRECTOR')) return 'Director';
    if (codes.includes('PROCESS_OWNER')) return 'Dueño de Proceso';
    return codes.join(', ');
  })();

  return (
    <div className="min-h-screen w-full">
      <div
        className={`mt-16 grid min-h-screen grid-cols-1 transition-all duration-500 ${
          collapsed ? 'md:grid-cols-[5rem_1fr]' : 'md:grid-cols-[16rem_1fr]'
        }`}
      >
        <div>
          <PersonalSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            items={items}
            appName={appName}
            logoUrl={logoUrl}
            onLogout={onLogout}
            userName={displayName}
            userEmail={user?.email}
            userRole={roleLabel}
          />
        </div>
        <div className="flex w-full flex-col transition-all duration-500">
          <PersonalHeader />
          <main className="flex-1 overflow-x-hidden p-3 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
