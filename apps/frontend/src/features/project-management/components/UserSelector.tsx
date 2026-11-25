import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { User, Search, X, ChevronDown } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { userService, type User as UserType } from "../api";

const overlayTransition: Transition = { duration: 0.24, ease: "easeOut" };

interface UserSelectorProps {
  onSelect: (user: UserType) => void;
  selectedId?: string;
  inline?: boolean;
}

export function UserSelector({ onSelect, selectedId, inline = false }: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Cargar planificadores cuando se abre.
  // Usa los usuarios del módulo (pm_users con rol PM_PLANIFICADOR): sus ids son
  // los que referencia pm_projects.managerId (el endpoint legacy /api/users
  // devuelve ids del ERP, que rompen la FK al asignar).
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getModuleByRole("PM_PLANIFICADOR");
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      // Fallback al endpoint legacy si el del módulo falla
      try {
        const legacy = await userService.getByRole("planificador");
        setUsers(legacy);
      } catch (legacyError) {
        console.error("Error loading legacy users:", legacyError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar si está en modo inline
  useEffect(() => {
    if (inline) {
      loadUsers();
    }
  }, [inline]);

  // Cargar usuarios cuando se abre el modal
  useEffect(() => {
    if (isOpen && !inline) {
      loadUsers();
    }
  }, [isOpen, inline]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        const search = query.toLowerCase();
        return fullName.includes(search) || email.includes(search);
      }),
    [query, users]
  );

  const panelVariants: Variants = shouldReduceMotion
    ? {
        initial: { opacity: 0, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 1 },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 20, filter: "blur(6px)" },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.28, ease: [0.18, 0.89, 0.32, 1.12] },
        },
        exit: {
          opacity: 0,
          scale: 0.97,
          y: 12,
          filter: "blur(8px)",
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
        },
      };

  const selectedUser = users.find(u => u.id === selectedId);

  const getFullName = (user: UserType) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return name || user.email || "Planificador";
  };

  return (
    <div className="relative">
      {/* Botón selector */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 text-sm text-[#111416] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9772f]/40 ${
          inline
            ? "w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 py-2.5 hover:border-[#b9561d]"
            : "w-full rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-lg hover:border-border"
        }`}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
      >
        <User className="h-4 w-4 flex-shrink-0 text-[#d9772f]" aria-hidden />
        <span className="flex-1 text-left font-medium truncate">
          {selectedUser ? getFullName(selectedUser) : "Seleccionar planificador..."}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-[#4e5558] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Solo mostrar overlay si NO es inline */}
            {!inline && (
              <motion.div
                aria-hidden
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={overlayTransition}
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Contenedor del dropdown */}
            <div className={inline ? "relative z-10 mt-2" : "fixed inset-0 z-[65] flex items-start justify-center px-4 pt-24 sm:px-6"}>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Selector de planificadores"
                {...panelVariants}
                className={`overflow-hidden border ${
                  inline
                    ? "relative w-full rounded-xl border-[#d8d0c4] bg-[#fffdf9] shadow-lg"
                    : "relative w-full max-w-xl rounded-3xl border-border/60 bg-card/90 shadow-2xl backdrop-blur-2xl"
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                >
                  <motion.div
                    className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[150px]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: [0.25, 0.55, 0.25],
                            scale: [0.92, 1.08, 0.98],
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : { duration: 8, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                </div>

                {/* Header con búsqueda */}
                <div className={`relative flex items-center gap-3 border-b px-5 py-3 ${inline ? "border-[#d8d0c4]" : "border-border/60"}`}>
                  <Search className={`h-5 w-5 flex-shrink-0 ${inline ? "text-[#b9561d]" : "text-primary"}`} aria-hidden />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar planificador..."
                    className="flex-1 bg-transparent text-sm text-[#111416] outline-none placeholder:text-[#8d918f]"
                    autoFocus
                  />
                  {!inline && (
                    <motion.button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      whileHover={
                        shouldReduceMotion
                          ? undefined
                          : { rotate: 90, scale: 1.05 }
                      }
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                    >
                      <X className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Cerrar</span>
                    </motion.button>
                  )}
                </div>

                {/* Lista de usuarios */}
                <motion.div
                  className={`relative overflow-y-auto ${inline ? "max-h-48" : "max-h-96"} px-3 py-3 scrollbar-hide`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d9772f] border-t-transparent" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className={`p-6 text-center text-sm ${inline ? "rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 text-[#4e5558]" : "rounded-2xl border border-border/60 bg-white/5 text-muted-foreground backdrop-blur"}`}>
                      No se encontraron planificadores.
                    </div>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {filteredUsers.map((user, index) => {
                        const isSelected = user.id === selectedId;
                        return (
                          <motion.li
                            key={user.id}
                            initial={{
                              opacity: shouldReduceMotion ? 1 : 0,
                              y: shouldReduceMotion ? 0 : 12,
                            }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : {
                                    delay: 0.04 * index,
                                    duration: 0.24,
                                    ease: "easeOut",
                                  }
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelect(user);
                                setIsOpen(false);
                              }}
                              className={`group flex w-full items-center justify-between border px-4 text-left transition-colors duration-200 ${
                                isSelected
                                  ? "border-[#d9772f] bg-[#d9772f]/10"
                                  : inline
                                    ? "border-transparent py-2.5 hover:border-[#d8d0c4] hover:bg-[#f5f0e8]/60"
                                    : "border-transparent bg-white/5 py-3 hover:border-border hover:bg-white/10"
                              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9772f]/50 ${inline ? "rounded-lg" : "rounded-xl"}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full border flex-shrink-0 ${
                                  isSelected
                                    ? "border-[#d9772f] bg-[#d9772f] text-white"
                                    : "border-[#d8d0c4] bg-[#f5f0e8]/50 text-[#b9561d]"
                                }`}>
                                  <User className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-medium text-[#111416]">
                                    {getFullName(user)}
                                  </span>
                                  <span className="truncate text-xs text-[#4e5558]">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                              {user.role && (
                                <span className="max-w-[120px] flex-shrink-0 truncate text-xs text-[#4e5558]">
                                  {user.role.name}
                                </span>
                              )}
                            </button>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
