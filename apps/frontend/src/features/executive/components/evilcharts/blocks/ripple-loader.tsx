"use client";

import { cn } from "@/features/executive/utils/utils";
import { useState } from "react";

interface RippleLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "muted" | "white";
  speed?: "slow" | "normal" | "fast";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: { outer: "h-12 w-12", dot: "h-2 w-2" },
  md: { outer: "h-20 w-20", dot: "h-3 w-3" },
  lg: { outer: "h-28 w-28", dot: "h-4 w-4" },
};

const colorMap = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  muted: "bg-muted-foreground/30",
  white: "bg-white",
};

const speedMap: Record<string, string> = {
  slow: "3s",
  normal: "2s",
  fast: "1.2s",
};

export function RippleLoader({
  size = "md",
  color = "primary",
  speed = "normal",
  label,
  className,
}: RippleLoaderProps) {
  const [dots] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i * 360) / 8,
      delay: i * 0.12,
    })),
  );

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div
        className={cn("relative flex items-center justify-center", sizeMap[size].outer)}
        role="status"
        aria-label={label || "Loading"}
      >
        {/* Center pulse ring */}
        <span
          className={cn(
            "absolute inset-2 animate-ping rounded-full opacity-20",
            colorMap[color],
          )}
          style={{ animationDuration: speedMap[speed] }}
        />

        {/* Ripple dots orbiting */}
        {dots.map((dot) => {
          const angleRad = (dot.angle * Math.PI) / 180;
          const radius = 38;
          return (
            <span
              key={dot.angle}
              className={cn(
                "absolute rounded-full animate-ping",
                sizeMap[size].dot,
                colorMap[color],
              )}
              style={{
                left: `calc(50% + ${Math.cos(angleRad) * radius}% - 50%)`,
                top: `calc(50% + ${Math.sin(angleRad) * radius}% - 50%)`,
                animationDuration: speedMap[speed],
                animationDelay: `${dot.delay}s`,
                animationIterationCount: "infinite",
              }}
            />
          );
        })}

        {/* Center dot */}
        <span
          className={cn(
            "relative z-10 rounded-full",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
            colorMap[color],
          )}
        />
      </div>

      {label && (
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
