import { useState, useMemo, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowUpRight,
  Bell,
  CircleHelp,
  FolderKanban,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  X,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  User,
  UserRoundCog,
  UsersRound,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useUser } from "@/features/auth/hooks"
import { usePmAuthStore } from "../store/auth.store"
import { usePermission } from "../hooks/usePermission"
import { BusinessDevLogo } from "@/components/BusinessDevLogo"
import { cn } from "@/lib/utils"

/* ============================================================================
   Navegación del sidebar
============================================================================ */
type NavItem = { label: string; icon: typeof LayoutDashboard; to: string | null; tooltip?: string }

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operación",
    items: [
      { label: "Resumen", icon: LayoutDashboard, to: "/project-management" },
      { label: "Proyectos", icon: FolderKanban, to: "/project-management/explorar" },
      { label: "Adquisiciones", icon: ShoppingCart, to: null, tooltip: "Próximamente" },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Finanzas", icon: Landmark, to: "/project-management/finanzas" },
      { label: "Recursos", icon: UsersRound, to: null, tooltip: "Próximamente" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Usuarios", icon: UserRoundCog, to: "/project-management/usuarios" },
      { label: "Configuración", icon: SlidersHorizontal, to: null, tooltip: "Próximamente" },
    ],
  },
]

/* ============================================================================
   Shell reutilizable del ERP
   - sidebar oscura colapsable (drawer en móvil)
   - topbar con breadcrumb configurable + acciones + menú de perfil
   - contenedor de contenido
============================================================================ */
type PmAppShellProps = {
  children: ReactNode
  /** Label del ítem del sidebar que se marca como activo */
  active?: string
  /** Breadcrumb de la topbar (izquierda). Default: Inicio / Gestión de proyectos */
  crumb?: ReactNode
}

export function PmAppShell({ children, active, crumb }: PmAppShellProps) {
  const navigate = useNavigate()
  const user = useUser()
  const { logout: legacyLogout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const pmToken = usePmAuthStore((s) => s.token)
  const pmLogout = usePmAuthStore((s) => s.logout)
  const { isGestion, isFinancialAdmin, canViewPayables } = usePermission()

  // Menú adaptado al rol.
  // Administrador Financiero: vista exclusiva de Finanzas y Proyectos (lista de lectura).
  // Gestión/Admin: ven todo el menú.
  // "Sistema": solo para Gestión/Admin.
  const navGroups = useMemo(() => {
    if (isFinancialAdmin && !isGestion) {
      return [
        {
          label: "Control",
          items: [
            { label: "Finanzas", icon: Landmark, to: "/project-management/finanzas" },
          ],
        },
        {
          label: "Operación",
          items: [
            { label: "Proyectos", icon: FolderKanban, to: "/project-management/explorar" },
          ],
        },
      ];
    }

    return NAV_GROUPS.map((group) => {
      if (group.label === "Sistema" && !isGestion) {
        return null;
      }
      const filteredItems = group.items.filter((item) => {
        if (item.label === "Finanzas") {
          return canViewPayables || isFinancialAdmin || isGestion;
        }
        return item.to !== null || isGestion;
      });
      return {
        ...group,
        items: filteredItems,
      };
    }).filter((group): group is { label: string; items: NavItem[] } => group !== null && group.items.length > 0);
  }, [isFinancialAdmin, isGestion, canViewPayables]);

  const handleLogout = () => {
    if (pmToken) {
      pmLogout()
      navigate("/project-management/login", { replace: true })
    } else {
      legacyLogout()
    }
  }

  return (
    <div
      className={cn(
        "group font-grotesk min-h-screen bg-[#f5f0e8] text-[#111416]",
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
            "sticky top-0 z-40 flex h-screen w-[216px] min-w-[216px] flex-col overflow-y-auto bg-[#111416] p-[18px_12px_16px] text-[#f8f3eb] transition-[width,min-width,padding] duration-200",
            "max-[1024px]:fixed max-[1024px]:left-0 max-[1024px]:top-0 max-[1024px]:-translate-x-full max-[1024px]:shadow-[12px_0_30px_rgba(17,20,22,0.18)] max-[1024px]:transition-transform",
            "group-[.nav-collapsed]:w-[64px] group-[.nav-collapsed]:min-w-[64px] group-[.nav-collapsed]:px-[8px]",
            "group-[.nav-collapsed]:max-[1024px]:hidden",
            "group-[.menu-open]:max-[1024px]:translate-x-0"
          )}
        >
          {/* Wordmark */}
          <div className="flex items-start justify-between border-b border-white/20 px-[8px] pb-[16px] group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:px-0">
            <Link to="/project-management/gestion" className="group-[.nav-collapsed]:hidden">
              <BusinessDevLogo size={34} />
            </Link>
            <div className="flex items-start gap-[13px]">
              {/* Botón cerrar (solo móvil) */}
              <button
                type="button"
                title="Cerrar menú"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
                className="grid size-[26px] place-items-center rounded-none border border-white/25 bg-transparent p-0 text-[#d8d4cb] transition-colors hover:border-[#d9772f] hover:bg-[rgba(217,119,47,0.18)] hover:text-white hidden max-[1024px]:grid"
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
                  "grid size-[26px] place-items-center rounded-none border border-white/25 bg-transparent p-0 text-[#d8d4cb] transition-colors hover:border-[#d9772f] hover:bg-[rgba(217,119,47,0.18)] hover:text-white",
                  collapsed && "rotate-180",
                  "max-[1024px]:hidden"
                )}
              >
                <PanelLeftClose className="h-[14px] w-[14px] stroke-[1.8]" />
              </button>
              <span
                aria-label="Sistema sincronizado"
                title="Sistema sincronizado"
                className="mt-[3px] size-2 rounded-full bg-[#b9cd48] shadow-[0_0_0_4px_rgba(185,205,72,0.16)]"
              />
            </div>
          </div>

          {/* Navegación */}
          <nav className="group-[.nav-collapsed]:mt-[12px]">
            {navGroups.map((group) => (
              <div key={group.label} className="mt-[16px]">
                <div className="px-[8px] pb-1.5 text-[8px] font-bold tracking-[0.16em] text-[#8d918f] group-[.nav-collapsed]:invisible group-[.nav-collapsed]:h-2 group-[.nav-collapsed]:p-0">
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
                          "flex min-h-[34px] items-center gap-[10px] rounded-r-md border-l-2 border-transparent px-[8px] text-[11px] font-semibold text-[#bbb9b3] transition-colors hover:bg-white/5 hover:text-white",
                          item.label === active &&
                            "border-l-[#d9772f] bg-[rgba(217,119,47,0.18)] text-white [&_svg]:text-[#d9772f]",
                          "group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:gap-0 group-[.nav-collapsed]:px-0"
                        )}
                      >
                        <item.icon className="h-[15px] w-[15px] stroke-[1.8] text-[#858a87]" />
                        <span className="group-[.nav-collapsed]:hidden">{item.label}</span>
                      </Link>
                    ) : (
                      <span
                        key={item.label}
                        title={item.tooltip}
                        aria-disabled="true"
                        className="flex min-h-[34px] cursor-not-allowed items-center gap-[10px] border-l-2 border-transparent px-[8px] text-[11px] font-semibold text-[#8d918f]/60 opacity-60 group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:gap-0 group-[.nav-collapsed]:px-0"
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
          <div className="mt-auto border-t border-white/20 px-[8px] pb-0 pt-3">
            <span className="flex items-center gap-[8px] text-[10px] font-semibold text-[#d8d4cb] group-[.nav-collapsed]:justify-center group-[.nav-collapsed]:gap-0">
              <CircleHelp className="h-3.5 w-3.5 text-[#b9cd48]" />
              <span className="group-[.nav-collapsed]:hidden">Centro de ayuda</span>
              <ArrowUpRight className="ml-auto h-3 w-3 stroke-[1.8] group-[.nav-collapsed]:hidden" />
            </span>
            <p className="mt-2 text-[9px] leading-[1.45] text-[#8d918f] group-[.nav-collapsed]:hidden">
              Workspace ES · Operaciones
              <br />
              v2.4.06 / Conectado
            </p>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="flex min-h-[58px] items-center justify-between gap-4 border-b border-[#d8d0c4] bg-[rgba(245,240,232,0.88)] px-[26px] max-[1080px]:px-[20px] max-[1024px]:min-h-[56px] max-[1024px]:px-[14px]">
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="hidden size-[34px] place-items-center rounded-lg border border-[#d8d0c4] bg-[#fffdf9] text-[#111416] max-[1024px]:grid"
            >
              <Menu className="h-[17px] w-[17px]" />
            </button>

            <div className="text-[11px] font-semibold text-[#858178] max-[1024px]:hidden">
              {crumb ?? (
                <>
                  Inicio <span aria-hidden="true">/</span>{" "}
                  <strong className="text-[#111416]">Gestión de proyectos</strong>
                </>
              )}
            </div>

            <div className="flex items-center gap-[18px] max-[1024px]:ml-auto max-[1024px]:gap-[10px]">
              <div className="flex items-center gap-[7px] text-[10px] font-semibold text-[#4e5558] max-[1024px]:hidden">
                <span className="size-[6px] rounded-full bg-[#4c9b7a]" />
                12 eventos sincronizados
              </div>
              <button
                type="button"
                title="Buscar"
                aria-label="Buscar"
                className="grid size-[34px] place-items-center rounded-lg border border-transparent bg-transparent p-0 text-[#4e5558] transition-colors hover:border-[#d8d0c4] hover:bg-[#fffdf9] hover:text-[#111416]"
              >
                <Search className="h-[17px] w-[17px] stroke-[1.8]" />
              </button>
              <button
                type="button"
                title="Notificaciones"
                aria-label="Notificaciones"
                className="relative grid size-[34px] place-items-center rounded-lg border border-transparent bg-transparent p-0 text-[#4e5558] transition-colors hover:border-[#d8d0c4] hover:bg-[#fffdf9] hover:text-[#111416]"
              >
                <Bell className="h-[17px] w-[17px] stroke-[1.8]" />
                <span className="absolute right-[5px] top-[5px] size-[6px] rounded-full border border-[#f5f0e8] bg-[#c85454]" />
              </button>

              {/* Perfil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="outline-none"
                    aria-label={`Perfil de ${user?.firstName ?? "usuario"}`}
                  >
                    <Avatar firstName={user?.firstName} lastName={user?.lastName} email={user?.email} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-[#111416]">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email || "Usuario"}
                      </p>
                      <p className="text-xs leading-none text-[#4e5558]">{user?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate("/project-management/perfil")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate("/project-management/cambiar-contrasena")}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Cambiar contraseña</span>
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
  )
}
