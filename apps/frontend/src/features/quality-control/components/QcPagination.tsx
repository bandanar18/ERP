import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QcPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

/** Construye la lista de páginas con elipsis: 1 … 4 5 6 … 20 */
function buildPages(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export function QcPagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: QcPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  if (total === 0) return null;

  const pageBtn =
    "grid size-8 place-items-center rounded-lg border text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef4f0] bg-[#f7faf8] px-4 py-3">
      <p className="text-[11px] font-semibold text-[#7c9186]">
        Mostrando <span className="font-bold text-[#101f19]">{from}–{to}</span> de{" "}
        <span className="font-bold text-[#101f19]">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {pageSizeOptions && onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Filas por página"
            className="h-8 rounded-lg border border-[#d8e6de] bg-white px-2 text-[11px] font-bold text-[#5b7267] outline-none transition-colors focus:border-[#059669]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / pág
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Página anterior"
          className={cn(pageBtn, "border-[#d8e6de] bg-white text-[#5b7267] hover:border-[#059669] hover:text-[#047857]")}
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {buildPages(safePage, totalPages).map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-0.5 text-[11px] font-bold text-[#9db0a5]">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Página ${item}`}
              aria-current={item === safePage ? "page" : undefined}
              className={cn(
                pageBtn,
                item === safePage
                  ? "border-[#059669] bg-[#059669] text-white shadow-sm"
                  : "border-[#d8e6de] bg-white text-[#5b7267] hover:border-[#059669] hover:text-[#047857]"
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label="Página siguiente"
          className={cn(pageBtn, "border-[#d8e6de] bg-white text-[#5b7267] hover:border-[#059669] hover:text-[#047857]")}
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
