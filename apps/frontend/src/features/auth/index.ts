// NOTA: el login del ERP (rutas /auth/*) fue ELIMINADO — el único login del sistema
// es el del módulo de Gestión de Proyectos (/project-management/login). Las rutas
// /auth/* redirigen al módulo desde el router raíz (routes/index.tsx).
export * from "./hooks/useAuth";
export * from "./services/auth.service";
