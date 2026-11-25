"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { type ReactNode, useState, useCallback, useEffect, useRef } from "react";

interface FolderAnimationProps {
  /**
   * Duration of the animation cycle in seconds.
   * Default: 3
   */
  animationDuration?: number;
  /**
   * Custom folder icon to display. If not provided, a default folder icon is rendered.
   */
  folderIcon?: ReactNode;
  /**
   * Content to display in the card footer.
   */
  children?: ReactNode;
  /**
   * Additional CSS classes for the container.
   */
  className?: string;
  /**
   * Height of the animation area.
   * Default: h-64
   */
  height?: string;
  /**
   * Accessible label for the animation area.
   */
  ariaLabel?: string;
}

export function FolderAnimation({
  animationDuration = 3,
  folderIcon,
  children,
  className,
  height = "h-64",
  ariaLabel = "Animated folder illustration",
}: FolderAnimationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimationControls();
  const blurControls = useAnimationControls();
  const isAnimatingRef = useRef(false);
  const shouldStopRef = useRef(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleFocus = useCallback(() => setIsHovered(true), []);
  const handleBlur = useCallback(() => setIsHovered(false), []);

  const runAnimation = useCallback(async () => {
    if (prefersReducedMotion) return;

    isAnimatingRef.current = true;
    shouldStopRef.current = false;

    while (!shouldStopRef.current) {
      await Promise.all([
        controls.start({
          x: "150%",
          opacity: [1, 1, 0],
          transition: {
            duration: animationDuration / 2,
            ease: "easeIn",
            times: [0, 0.7, 1],
          },
        }),
        blurControls.start({
          filter: ["blur(0px)", "blur(0px)", "blur(8px)", "blur(16px)"],
          transition: {
            duration: animationDuration / 2,
            ease: "easeIn",
            times: [0, 0.5, 0.75, 1],
          },
        }),
      ]);

      if (shouldStopRef.current) break;

      await controls.set({ x: "-150%", opacity: 0 });
      await blurControls.set({ filter: "blur(16px)" });

      if (shouldStopRef.current) break;

      await Promise.all([
        controls.start({
          x: "0%",
          opacity: [0, 1, 1],
          transition: {
            duration: animationDuration / 2,
            ease: "easeOut",
            times: [0, 0.3, 1],
          },
        }),
        blurControls.start({
          filter: ["blur(16px)", "blur(8px)", "blur(0px)", "blur(0px)"],
          transition: {
            duration: animationDuration / 2,
            ease: "easeOut",
            times: [0, 0.25, 0.5, 1],
          },
        }),
      ]);

      if (shouldStopRef.current) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    isAnimatingRef.current = false;
  }, [controls, blurControls, animationDuration, prefersReducedMotion]);

  const returnToCenter = useCallback(async () => {
    shouldStopRef.current = true;

    await Promise.all([
      controls.start({
        x: "0%",
        opacity: 1,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }),
      blurControls.start({
        filter: "blur(0px)",
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      }),
    ]);

    isAnimatingRef.current = false;
  }, [controls, blurControls]);

  useEffect(() => {
    if (isHovered && !prefersReducedMotion) {
      runAnimation();
    } else {
      returnToCenter();
    }
  }, [isHovered, prefersReducedMotion, runAnimation, returnToCenter]);

  useEffect(() => {
    controls.set({ x: "0%", opacity: 1 });
    blurControls.set({ filter: "blur(0px)" });
  }, [controls, blurControls]);

  return (
    <div className={cn(className)}>
      <div className="bg-card p-2 rounded-lg overflow-hidden w-full border border-border shadow-sm hover:shadow-md transition-shadow">
        <div
          className={cn(
            "relative w-full bg-muted overflow-hidden flex items-center justify-center rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            height
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
          role="img"
          aria-label={ariaLabel}
        >
          <motion.div
            animate={controls}
            className="absolute"
            style={{ willChange: "transform, opacity" }}
          >
            <motion.div
              animate={blurControls}
              className="relative"
              style={{ willChange: "filter" }}
            >
              {folderIcon ? (
                <div className="flex items-center justify-center">{folderIcon}</div>
              ) : (
                <div className="relative w-20 h-16">
                  <div className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20" />
                  <div className="absolute bottom-1.5 inset-x-1.5 h-10 bg-background border border-border rounded shadow-sm z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-md rounded-lg border-t border-white/20 shadow-lg z-20 flex items-center justify-center" />
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {children && <div className="p-2 mt-2">{children}</div>}
      </div>
    </div>
  );
}
