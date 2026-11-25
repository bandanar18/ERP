"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/features/executive/utils/utils";
import { Button } from "@/features/executive/components/ui/button";
import { useMemo } from "react";

interface BasicPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  showFirstLast?: boolean;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  const totalNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis slots

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-end", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightCount },
      (_, i) => totalPages - rightCount + i + 1,
    );
    return [1, "ellipsis-start", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  );
  return [1, "ellipsis-start", ...middleRange, "ellipsis-end", totalPages];
}

export function BasicPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  showFirstLast = false,
  size = "default",
  disabled = false,
}: BasicPaginationProps) {
  const pages = useMemo(
    () => generatePageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount],
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* First page */}
      {showFirstLast && (
        <Button
          variant="outline"
          size={size}
          disabled={currentPage === 1 || disabled}
          onClick={() => onPageChange(1)}
          aria-label="Primera página"
          className="hidden sm:inline-flex"
        >
          <span className="sr-only">Primera</span>
          <span aria-hidden>⟪</span>
        </Button>
      )}

      {/* Previous */}
      <Button
        variant="outline"
        size={size === "sm" ? "sm" : size === "lg" ? "default" : "sm"}
        disabled={currentPage === 1 || disabled}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Ir a la página anterior"
        className="gap-1 pl-2 pr-3"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <span
                key={page}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={`page-${page}`}
              variant={isActive ? "default" : "outline"}
              size={size === "sm" ? "sm" : size === "lg" ? "default" : "sm"}
              disabled={disabled}
              onClick={() => onPageChange(page)}
              aria-label={`Página ${page}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "min-w-[2.25rem] font-medium transition-all",
                isActive && "shadow-sm",
              )}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next */}
      <Button
        variant="outline"
        size={size === "sm" ? "sm" : size === "lg" ? "default" : "sm"}
        disabled={currentPage === totalPages || disabled}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Ir a la página siguiente"
        className="gap-1 pl-3 pr-2"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page */}
      {showFirstLast && (
        <Button
          variant="outline"
          size={size}
          disabled={currentPage === totalPages || disabled}
          onClick={() => onPageChange(totalPages)}
          aria-label="Última página"
          className="hidden sm:inline-flex"
        >
          <span className="sr-only">Última</span>
          <span aria-hidden>⟫</span>
        </Button>
      )}
    </nav>
  );
}

export function usePagination<T>(items: T[], itemsPerPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  const paginatedItems = (page: number): T[] => {
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  return { totalPages, paginatedItems };
}
