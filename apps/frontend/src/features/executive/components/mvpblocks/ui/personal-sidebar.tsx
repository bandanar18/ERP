'use client';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Menu,
  User,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/features/executive/utils/utils';
import { Button } from '@/features/executive/components/ui/button';

/* ─── Types ─── */

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  items: NavItem[];
  appName?: string;
  appIcon?: LucideIcon;
  logoUrl?: string;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  items,
  appName = 'Portal Gestión',
  appIcon: AppIcon = User,
  logoUrl,
  onLogout,
  userName,
  userEmail,
  userRole,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (item: NavItem) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button — pushes right when sidebar is open */}
      <div className={cn(
        'fixed top-3 left-3 z-50 transition-all duration-500 md:hidden',
        mobileOpen && 'left-72',
      )}>
        <Button
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="!bg-primary hover:!bg-primary rounded-sm text-white shadow-md"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'bg-background fixed inset-y-0 top-14 left-0 z-50 transform overflow-hidden border-r transition-all duration-500 ease-in-out',
          'md:translate-x-0',
          mobileOpen ? 'w-64 translate-x-0 shadow-xl' : 'w-64 -translate-x-full',
          !mobileOpen && collapsed && 'w-16 md:w-20',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="hidden items-center justify-between border-b md:flex">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-muted flex w-full cursor-pointer items-center justify-between p-3.5 transition-all duration-500"
            >
              <div
                className={cn(
                  'flex w-full items-center gap-3',
                  collapsed ? 'm-auto justify-center' : 'justify-start',
                )}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={appName}
                    className="size-8 rounded-md object-cover"
                  />
                ) : (
                  <AppIcon className="text-primary size-8" />
                )}
                {!collapsed && (
                  <h1 className="text-2xl font-medium">{appName}</h1>
                )}
              </div>
              <ChevronRight
                className={cn(
                  'size-5 transition-all duration-500',
                  collapsed ? 'hidden' : 'block',
                )}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-2 pt-4 md:p-4">
            {items.map((item) => {
              const active = isCurrent(item);
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'group flex w-full items-center rounded-sm border border-transparent p-3 text-sm font-medium transition-all duration-300 hover:scale-105',
                    active
                      ? 'border-primary/30 from-primary/10 text-primary bg-gradient-to-br'
                      : 'text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-muted/50',
                  )}
                >
                  <item.icon
                    className={cn(
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-primary',
                      collapsed ? 'mx-auto size-5' : 'mr-3 size-5',
                    )}
                  />
                  {!collapsed && item.name}
                </button>
              );
            })}
          </nav>

          {/* User info + Logout */}
          {onLogout && (
            <div className="border-t border-border/50 px-2 pt-3 pb-2 md:px-4 md:pt-3 md:pb-4">
              {/* Compact user info above logout */}
              {!collapsed && (
                <div className="mb-3 px-1">
                  <p className="text-xs font-semibold text-foreground truncate">{userName || 'Usuario'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{userEmail || ''}</p>
                  {userRole && (
                    <p className="text-[10px] font-semibold text-primary truncate mt-0.5">{userRole}</p>
                  )}
                </div>
              )}
              <button
                onClick={onLogout}
                className={cn(
                  'group flex w-full items-center rounded-sm border border-transparent p-3 text-sm font-medium transition-all duration-300 hover:scale-105',
                  'text-muted-foreground from-primary/10 hover:border-red-300 hover:text-red-600 hover:bg-gradient-to-br',
                )}
              >
                <LogOut
                  className={cn(
                    'text-muted-foreground group-hover:text-red-600',
                    collapsed ? 'mx-auto size-5' : 'mr-3 size-5',
                  )}
                />
                {!collapsed && 'Cerrar Sesión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
