import { Outlet } from "react-router-dom"

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Aquí iría tu Header o Navbar (ej. componente de shadcn) */}
      <header className="h-16 border-b flex items-center px-6">
        <h1 className="font-bold">Mi Aplicación</h1>
      </header>

      {/* Aquí se renderizan las rutas hijas (el contenido dinámico) */}
      <main className="flex-1 bg-background">
        <Outlet /> 
      </main>

      {/* Aquí iría tu Footer */}
      <footer className="h-14 border-t flex items-center justify-center text-sm">
        © 2026 Todos los derechos reservados
      </footer>
    </div>
  )
}