import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  Boxes,
  CircleHelp,
  ClipboardCheck,
  FileBarChart2,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  X,
  ScrollText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQcAuthStore } from "../store/auth.store";
import { useQcPermission } from "../hooks/useQcPermission";
import { cn } from "@/lib/utils";
import { BusinessDevLogo } from "./QcBrandMark";

/* ============================================================================
   Navegación del sidebar del módulo Quality Control
============================================================================ */
type NavItem = { label: string; icon: typeof LayoutDashboard; to: string | null; tooltip?: string };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operación",
    items: [
      { label: "Resumen", icon: LayoutDashboard, to: "/quality-control" },
      { label: "Matriz de indicadores", icon: Gauge, to: "/quality-control/indicadores" },
      { label: "Mediciones", icon: ClipboardCheck, to: "/quality-control/mediciones" },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Reportes", icon: FileBarChart2, to: "/quality-control/reportes" },
      { label: "Auditoría", icon: ScrollText, to: "/quality-control/auditoria" },
    ],
  },
  {
    label: "Administración",
    items: [
      { label: "Procesos", icon: Boxes, to: "/quality-control/procesos" },
      { label: "Indicadores", icon: SlidersHorizontal, to: "/quality-control/admin/indicadores" },
      { label: "Usuarios y roles", icon: UsersRound, to: "/quality-control/usuarios" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  QC_ADMIN: "Administrador de Calidad",
  QC_DIRECTOR: "Director Ejecutivo",
  QC_OWNER: "Responsable de Proceso",
};

/* ============================================================================
   Shell del módulo Quality Control
   - sidebar verde bosque colapsable (drawer en móvil)
   - topbar con breadcrumb + acciones + perfil
   - contenedor de contenido
============================================================================ */
type QcAppShellProps = {
  children: ReactNode;
  /** Label del ítem del sidebar que se marca como activo */
  active?: string;
  /** Breadcrumb de la topbar (izquierda). Default: Inicio / Calidad */
  crumb?: ReactNode;
};

export function QcAppShell({ children, active, crumb }: QcAppShellProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useQcAuthStore((s) => s.user);
  const logout = useQcAuthStore((s) => s.logout);
  const { isAdmin, isOwner } = useQcPermission();

  // Menú adaptado al rol:
  //  - Admin: ve todo (incluida Administración).
  //  - Director: Operación + Control.
  //  - Owner: solo Operación (sin Control ni Administración).
  const navGroups = isAdmin
    ? NAV_GROUPS
    : NAV_GROUPS.filter((group) => {
        if (group.label === "Administración") return false;
        if (group.label === "Control" && isOwner && !isAdmin) return false;
        return true;
      });

  const roleLabel =
    (user?.roles ?? [])
      .map((role) => ROLE_LABELS[role])
      .filter(Boolean)
      .join(" · ") || "Usuario";

  const handleLogout = () => {
    logout();
    navigate("/quality-control/login", { replace: true });
  };

  const displayName = user?.email || "Usuario";

  return (
    <div
      className={cn(
        "group font-grotesk min-h-screen bg-[#f2f7f4] text-[#101f19]",
        collapsed && "nav-collapsed",
        menuOpen && "menu-open"
      )}
    >
      <div className="flex min-h-screen">
        {/* ================= BACKDROP (móvil) ================= */}
        {menuOpen && (
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 max-[1024px]:block hidden"
          />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside
          aria-label="Navegación principal"
          className={cn(
            "sticky top-0 z-40 flex h-screen w-[216px] min-w-[216px] flex-col overflow-y-auto bg-[#0b1f16] p-[18px_12px_16px] text-[#eaf6f0] transition-[width,min-width,padding] duration-200",
            "max-[1024px]:fixed max-[1024px]:left-0 max-[1024px]:top-0 max-[1024px]:-translate-x-full max-[1024px]:shadow-[12px_0_30px_rgba(8,24,17,0.25)] max-[1024px]:transition-transform",
            "group-[.nav-collapsed]:w-[64px] group-[.nav-collapsed]:min-w-[64px] group-[.nav-collapsed]:px-[8px]",
            "group-[.nav-collapsed]:max-[1024px]:hidden",
            "group-[.menu-open]:max-[1024px]:translate-x-0"
          )}
        >
          {/* Wordmark */}
          <div className="flex items-start justify-between border-b border-white/15 px-[8px] pb-[16px] group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:px-0">
            <Link to="/quality-control" className="flex items-center gap-2.5 group-[.nav-collapsed]:hidden">
              <BusinessDevLogo size={34} />
            </Link>
            <div className="flex items-start gap-[13px]">
              {/* Botón cerrar (solo móvil) */}
              <button
                type="button"
                title="Cerrar menú"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
                className="grid size-[26px] place-items-center rounded-none border border-white/20 bg-transparent p-0 text-[#cfe6da] transition-colors hover:border-[#34d399] hover:bg-[rgba(52,211,153,0.16)] hover:text-white hidden max-[1024px]:grid"
              >
                <X className="h-[14px] w-[14px] stroke-[1.8]" />
              </button>
              {/* Botón colapsar (solo desktop) */}
              <button
                type="button"
                title={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                aria-label={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                onClick={() => setCollapsed((c) => !c)}
                className={cn(
                  "grid size-[26px] place-items-center rounded-none border border-white/20 bg-transparent p-0 text-[#cfe6da] transition-colors hover:border-[#34d399] hover:bg-[rgba(52,211,153,0.16)] hover:text-white",
                  collapsed && "rotate-180",
                  "max-[1024px]:hidden"
                )}
              >
                <PanelLeftClose className="h-[14px] w-[14px] stroke-[1.8]" />
              </button>
              <span
                aria-label="Sistema sincronizado"
                title="Sistema sincronizado"
                className="mt-[3px] size-2 rounded-full bg-[#34d399] shadow-[0_0_0_4px_rgba(52,211,153,0.18)]"
              />
            </div>
          </div>

          {/* Navegación */}
          <nav className="group-[.nav-collapsed]:mt-[12px]">
            {navGroups.map((group) => (
              <div key={group.label} className="mt-[16px]">
                <div className="px-[8px] pb-1.5 text-[8px] font-bold tracking-[0.16em] text-[#6f8a7c] group-[.nav-collapsed]:invisible group-[.nav-collapsed]:h-2 group-[.nav-collapsed]:p-0">
                  {group.label}
                </div>
                <div className="grid gap-[2px]">
                  {group.items.map((item) =>
                    item.to ? (
                      <Link
                        key={item.label}
                        to={item.to}
                        title={item.label}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex min-h-[34px] items-center gap-[10px] border-l-2 border-transparent px-[8px] text-[11px] font-semibold text-[#a9c4b4] transition-colors hover:bg-white/5 hover:text-white",
                          item.label === active &&
                            "border-l-[#34d399] bg-[rgba(52,211,153,0.14)] text-white [&_svg]:text-[#34d399]",
                          "group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:gap-0 group-[.nav-collapsed]:px-0"
                        )}
                      >
                        <item.icon className="h-[15px] w-[15px] stroke-[1.8] text-[#70907f]" />
                        <span className="group-[.nav-collapsed]:hidden">{item.label}</span>
                      </Link>
                    ) : (
                      <span
                        key={item.label}
                        title={item.tooltip}
                        aria-disabled="true"
                        className="flex min-h-[34px] cursor-not-allowed items-center gap-[10px] border-l-2 border-transparent px-[8px] text-[11px] font-semibold text-[#6f8a7c]/60 opacity-60 group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:gap-0 group-[.nav-collapsed]:px-0"
                      >
                        <item.icon className="h-4 w-4 stroke-[1.8]" />
                        <span className="group-[.nav-collapsed]:hidden">{item.label}</span>
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </nav>

          {/* Pie del sidebar */}
          <div className="mt-auto border-t border-white/15 px-[8px] pb-0 pt-3">
            <span className="flex items-center gap-[8px] text-[10px] font-semibold text-[#cfe6da] group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:gap-0">
              <CircleHelp className="h-3.5 w-3.5 text-[#34d399]" />
              <span className="group-[.nav-collapsed]:hidden">Centro de ayuda</span>
              <ArrowUpRight className="ml-auto h-3 w-3 stroke-[1.8] group-[.nav-collapsed]:hidden" />
            </span>
            <p className="mt-2 text-[9px] leading-[1.45] text-[#6f8a7c] group-[.nav-collapsed]:hidden">
              Workspace ES · Calidad
              <br />
              v1.0.0 / Conectado
            </p>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="flex min-h-[58px] items-center justify-between gap-4 border-b border-[#d3e3da] bg-[rgba(242,247,244,0.9)] px-[26px] max-[1080px]:px-[20px] max-[1024px]:min-h-[56px] max-[1024px]:px-[14px]">
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="hidden size-[34px] place-items-center border border-[#d3e3da] bg-[#fbfdfc] text-[#101f19] max-[1024px]:grid"
            >
              <Menu className="h-[17px] w-[17px]" />
            </button>

            <div className="text-[11px] font-semibold text-[#7c9186] max-[1024px]:hidden">
              {crumb ?? (
                <>
                  Inicio <span aria-hidden="true">/</span>{" "}
                  <strong className="text-[#101f19]">Gestión de calidad</strong>
                </>
              )}
            </div>

            <div className="flex items-center gap-[18px] max-[1024px]:ml-auto max-[1024px]:gap-[10px]">
              <div className="flex items-center gap-[7px] text-[10px] font-semibold text-[#4a6256] max-[1024px]:hidden">
                <span className="size-[6px] rounded-full bg-[#10b981]" />
                Período de reporte activo
              </div>
              <button
                type="button"
                title="Buscar"
                aria-label="Buscar"
                className="grid size-[34px] place-items-center border border-transparent bg-transparent p-0 text-[#4a6256] transition-colors hover:border-[#d3e3da] hover:bg-[#fbfdfc] hover:text-[#101f19]"
              >
                <Search className="h-[17px] w-[17px] stroke-[1.8]" />
              </button>
              <button
                type="button"
                title="Notificaciones"
                aria-label="Notificaciones"
                className="relative grid size-[34px] place-items-center border border-transparent bg-transparent p-0 text-[#4a6256] transition-colors hover:border-[#d3e3da] hover:bg-[#fbfdfc] hover:text-[#101f19]"
              >
                <Bell className="h-[17px] w-[17px] stroke-[1.8]" />
                <span className="absolute right-[5px] top-[5px] size-[6px] rounded-full border border-[#f2f7f4] bg-[#c85454]" />
              </button>

              {/* Perfil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="outline-none" aria-label={`Perfil de ${displayName}`}>
                    <Avatar email={user?.email} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-[#101f19]">{displayName}</p>
                      <p className="text-xs leading-none text-[#4a6256]">{roleLabel}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/quality-control")}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Mi dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Contenido */}
          <div className="mx-auto w-full max-w-[1520px] px-[26px] pb-[44px] pt-[22px] max-[1080px]:px-[20px] max-[1024px]:px-[14px] max-[1024px]:pb-[36px] max-[1024px]:pt-[18px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
