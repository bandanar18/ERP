import React from "react"
import { Bell, KeyRound, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth, useUser } from "@/features/auth/hooks"
import { usePmAuthStore } from "@/features/project-management/store/auth.store"
import { Avatar } from "@/components/ui/avatar"

// Importamos las piezas del DropdownMenu de shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FeatureHeaderProps {
  children: React.ReactNode
}

export function FeatureHeader({ children }: FeatureHeaderProps) {
  const { logout: legacyLogout } = useAuth();
  const user = useUser();
  const navigate = useNavigate();

  // Sesión del módulo Project Management: si está activa, el logout debe
  // cerrar SOLO la sesión del módulo y volver al login del módulo
  // (/project-management/login), nunca al login general (/auth/login).
  const pmToken = usePmAuthStore((s) => s.token);
  const pmLogout = usePmAuthStore((s) => s.logout);

  const handleLogout = () => {
    if (pmToken) {
      pmLogout();
      navigate("/project-management/login", { replace: true });
    } else {
      legacyLogout();
    }
  };

  return (
    <header className="w-full bg-white border-b border-border/40 mb-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-[10%] py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        
        {/* Lado Izquierdo: Breadcrumbs u otro contenido dinámico */}
        <div className="flex-1">
          {children}
        </div>

        {/* Lado Derecho: Acciones y Usuario */}
        <div className="flex items-center gap-5 mt-4 sm:mt-0 text-muted-foreground">
          
          {/* Dropdown de Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-1 hover:text-foreground transition-colors outline-none">
                <Bell className="h-5 w-5" />
                {/* Indicador de notificaciones no leídas */}
                <span className="absolute top-0 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Ejemplo de items de notificación */}
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3">
                <span className="font-medium text-sm text-slate-800">Nueva orden de compra</span>
                <span className="text-xs text-muted-foreground">Se ha generado la OC-0042.</span>
                <span className="text-[10px] text-blue-500 font-medium mt-1">Hace 5 min</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <button className="w-full text-center text-xs text-blue-500 p-2 hover:underline">
                Marcar todas como leídas
              </button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown del Perfil de Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none hover:ring-2 hover:ring-slate-400 hover:ring-offset-2 transition-all rounded-full">
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  email={user?.email}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-800">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || "Usuario"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/project-management/cambiar-contrasena")}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Cambiar contraseña</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  )
}
