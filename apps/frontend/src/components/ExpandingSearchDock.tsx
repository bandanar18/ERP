"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type ExpandingSearchDockProps = {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
};

export function ExpandingSearchDock({
  onSearch,
  placeholder = "Search...",
  className,
}: ExpandingSearchDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery("");
    onSearch?.(""); // Limpiamos la búsqueda al colapsar
  };

  // Emitimos el cambio en tiempo real
  useEffect(() => {
    onSearch?.(query);
  }, [query, onSearch]);

  return (
    <div className={cn("relative h-12 w-12", className)}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleExpand}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted shadow-sm"
          >
            <Search className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 48, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 48, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onSubmit={(e) => e.preventDefault()}
            className="absolute right-0 top-0 z-10 flex justify-end"
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)", width: 48 }}
              animate={{ backdropFilter: "blur(12px)", width: "min(320px, calc(100vw - 2rem))" }}
              className="flex items-center gap-2 overflow-hidden rounded-full border border-border bg-card/95 backdrop-blur-md shadow-lg"
            >
              <div className="ml-4 flex-shrink-0">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="h-12 flex-1 bg-transparent pr-4 text-sm outline-none placeholder:text-muted-foreground min-w-0"
              />
              <motion.button
                type="button"
                onClick={handleCollapse}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
