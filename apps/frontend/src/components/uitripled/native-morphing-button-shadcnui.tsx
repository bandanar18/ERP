"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";

import { Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface MorphingButtonAction {
  /**
   * Display label for the action.
   */
  label: string;
  /**
   * Icon to display alongside the label.
   */
  icon: React.ReactNode;
  /**
   * Callback when action is clicked.
   */
  onClick: () => void;
}

export interface NativeMorphingButtonProps {
  /**
   * Array of actions to display in the expanded menu.
   */
  actions: MorphingButtonAction[];
  /**
   * Position of the FAB.
   * Default: 'bottom-right'
   */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /**
   * Whether to use fixed positioning.
   * Default: false (relative to container)
   */
  fixed?: boolean;
  /**
   * Custom icon when collapsed.
   */
  icon?: React.ReactNode;
  /**
   * Custom close icon when expanded.
   */
  closeIcon?: React.ReactNode;
  className?: string;
}

const positionClasses = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
};



export function NativeMorphingButton({
  actions,
  position = "bottom-right",
  fixed = false,
  icon,
  closeIcon,
  className,
}: NativeMorphingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);



  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded]);

  return (
    <div
      ref={containerRef}
      className={cn(
        fixed ? "fixed" : "absolute",
        positionClasses[position],
        "z-50",
        className
      )}
    >
      <LayoutGroup>
        <motion.div
          layout
          className="relative"
          style={{ width: 56, height: 56 }}
        >
          {/* Main FAB Button - Siempre en la misma posición */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute right-0 bottom-0 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
            whileHover={shouldReduceMotion || isExpanded ? undefined : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            animate={{
              opacity: isExpanded ? 0 : 1,
              scale: isExpanded ? 0.8 : 1,
              pointerEvents: isExpanded ? "none" : "auto",
            }}
            transition={{
              opacity: { duration: 0.15 },
              scale: { duration: 0.2, ease: "easeOut" },
            }}
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            aria-expanded={isExpanded}
          >
            <AnimatePresence mode="wait">
              {!isExpanded ? (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {icon ?? <Plus className="h-5 w-5" />}
                </motion.div>
              ) : (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  {closeIcon ?? <X className="h-5 w-5" />}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Expanded Menu */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.9, y: 10 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-0 right-0 w-[280px] rounded-2xl border border-border bg-card p-5 shadow-2xl"
                role="menu"
              >
                <div className="mb-2 space-y-2">
                  {actions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, x: -20 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      onClick={() => {
                        action.onClick();
                        setIsExpanded(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                      role="menuitem"
                    >
                      <span className="text-muted-foreground">
                        {action.icon}
                      </span>
                      <span className="font-medium text-base">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
