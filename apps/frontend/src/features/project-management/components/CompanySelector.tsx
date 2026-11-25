"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { Building2, Search, X, Plus, ChevronDown } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { companyService, type Company } from "../api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const overlayTransition: Transition = { duration: 0.24, ease: "easeOut" };

interface CompanySelectorProps {
  onSelect: (company: Company) => void;
  selectedId?: string;
  createNewLabel?: string;
  inline?: boolean;
}

export function CompanySelector({ onSelect, selectedId, createNewLabel = "Crear nueva empresa", inline = false }: CompanySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  // Cargar empresas cuando se abre
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empresas al montar si está en modo inline
  useEffect(() => {
    if (inline) {
      loadCompanies();
    }
  }, [inline]);

  // Cargar empresas cuando se abre el modal
  useEffect(() => {
    if (isOpen && !inline) {
      loadCompanies();
    }
  }, [isOpen, inline]);


  const filteredCompanies = useMemo(
    () =>
      companies.filter((company) =>
        company.name.toLowerCase().includes(query.toLowerCase())
      ),
    [query, companies]
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

  const selectedCompany = companies.find((c: any) => c.id === selectedId);

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
        <Building2 className="h-4 w-4 flex-shrink-0 text-[#d9772f]" aria-hidden />
        <span className="flex-1 text-left font-medium truncate">
          {selectedCompany ? selectedCompany.name : "Seleccionar empresa..."}
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
                aria-label="Selector de empresas"
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
                    placeholder="Buscar empresa..."
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

                {/* Lista de empresas */}
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
                  ) : filteredCompanies.length === 0 ? (
                    <div className={`p-6 text-center text-sm ${inline ? "rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 text-[#4e5558]" : "rounded-2xl border border-border/60 bg-white/5 text-muted-foreground backdrop-blur"}`}>
                      No se encontraron empresas.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/project-management/company/create");
                        }}
                        className="text-primary font-medium hover:underline"
                      >
                        Crear nueva empresa
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {filteredCompanies.map((company, index) => {
                        const isSelected = company.id === selectedId;
                        return (
                          <motion.li
                            key={company.id}
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
                                onSelect(company);
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
                                <span className={`flex h-8 w-8 items-center justify-center rounded-md border flex-shrink-0 ${
                                  isSelected
                                    ? "border-[#d9772f] bg-[#d9772f] text-white"
                                    : "border-[#d8d0c4] bg-[#f5f0e8]/50 text-[#b9561d]"
                                }`}>
                                  <Building2 className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-medium text-[#111416]">
                                    {company.name}
                                  </span>
                                  {company.taxId && (
                                    <span className="truncate text-xs text-[#4e5558]">
                                      {company.taxId}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {company._count && (
                                <span className="flex-shrink-0 text-xs text-[#4e5558]">
                                  {company._count.projects}
                                </span>
                              )}
                            </button>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>

                {/* Footer con botón de crear - solo si NO es inline */}
                {!inline && (
                  <div className="border-t border-border/60 px-5 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/project-management/company/create");
                      }}
                      className="w-full gap-2 rounded-none border-[#d8d0c4] bg-[#fffdf9] text-[#111416] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#b9561d]"
                    >
                      <Plus className="h-4 w-4" />
                      {createNewLabel}
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
