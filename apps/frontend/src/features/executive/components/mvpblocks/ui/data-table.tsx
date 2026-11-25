import { Card, CardContent, CardHeader, CardTitle } from '@/features/executive/components/ui/card';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import SkeletonTableTwoWrapper from '../skeleton-table-2';

/* ─── Types ─── */

export interface Column<T> {
  key: string;
  label: string;
  /** Custom render function for the cell content */
  render?: (item: T, index: number) => ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on smaller screens: 'md' or 'lg' */
  hide?: 'md' | 'lg';
  /** CSS class for the cell */
  className?: string;
}

export interface TableActions<T> {
  /** Label for the action column header */
  label?: string;
  /** Render the action button(s) for each row */
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  titleIcon?: ReactNode;
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingSkeleton?: ReactNode;
  actions?: TableActions<T>;
  /** A detail dialog that opens when onRowClick is triggered */
  detailDialog?: (props: { item: T; isOpen: boolean; onClose: () => void }) => ReactNode;
}

/* ─── Default skeleton — SkeletonTableTwoWrapper with shimmer effect ─── */

function DefaultSkeleton({ cols }: { cols: number }) {
  // Generate a matching columnWidthArray for any number of columns
  const columnWidthArray = Array.from({ length: cols }, () => 'flex-1');
  return (
    <SkeletonTableTwoWrapper
      rowCount={5}
      columnCount={cols}
      showTopBar={false}
      bodyClassName=""
      columnWidthArray={columnWidthArray}
    />
  );
}

/* ─── Helpers ─── */

const alignToClass = (align?: string) => {
  switch (align) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return 'text-left';
  }
};

const hideToClass = (hide?: 'md' | 'lg') => {
  if (hide === 'md') return 'hidden md:table-cell';
  if (hide === 'lg') return 'hidden lg:table-cell';
  return '';
};

/* ─── DataTable ─── */

export function DataTable<T extends { id: string }>({
  title,
  titleIcon,
  columns,
  data,
  onRowClick,
  loading = false,
  error = null,
  emptyMessage = 'No hay registros.',
  loadingSkeleton,
  actions,
  detailDialog,
}: DataTableProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (detailDialog) {
      setSelectedItem(item);
      setIsDetailsOpen(true);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  const colspan = columns.length + (actions ? 1 : 0);

  return (
    <>
      <Card className="border-border/40 overflow-hidden rounded-xl shadow-sm">
        <CardHeader className="border-b border-border/30 bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {titleIcon ?? <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="overflow-x-auto">
              {loadingSkeleton ?? <DefaultSkeleton cols={colspan} />}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border/50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`py-3 px-3 sm:px-4 font-semibold whitespace-nowrap ${alignToClass(col.align)} ${hideToClass(col.hide)} ${col.className ?? ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                    {actions && (
                      <th className="py-3 px-3 sm:px-4 text-right font-semibold whitespace-nowrap">
                        {actions.label ?? <span className="sr-only">Acciones</span>}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {error ? (
                    <tr>
                      <td
                        colSpan={colspan}
                        className="px-4 py-8 text-center text-destructive text-sm"
                      >
                        {error}
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={colspan}
                        className="px-4 py-8 text-center text-muted-foreground text-sm"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className={`border-b border-border/30 transition-colors ${
                          onRowClick || detailDialog
                            ? 'cursor-pointer hover:bg-muted/50'
                            : ''
                        }`}
                        onClick={() => handleRowClick(item)}
                      >
                        {columns.map((col) => (
                          <td
                            key={`${item.id}-${col.key}`}
                            className={`py-3 px-3 sm:px-4 ${alignToClass(col.align)} ${hideToClass(col.hide)} ${col.className ?? ''}`}
                          >
                            {col.render
                              ? col.render(item, index)
                              : (item as any)[col.key] ?? '—'}
                          </td>
                        ))}
                        {actions && (
                          <td className="py-3 px-3 sm:px-4 text-right">
                            {actions.render(item)}
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {detailDialog && selectedItem && (
        <>{detailDialog({ item: selectedItem, isOpen: isDetailsOpen, onClose: handleCloseDetails })}</>
      )}
    </>
  );
}

/* ─── ChangeBadge — reusable for +/- change display ─── */

export function ChangeBadge({
  value,
  prefix = '$',
}: {
  value: number;
  prefix?: string;
}) {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center justify-end gap-1">
      {isPositive ? (
        <TrendingUp className="h-3 w-3 text-green-500" />
      ) : (
        <TrendingDown className="h-3 w-3 text-red-500" />
      )}
      <span
        className={`font-semibold whitespace-nowrap ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {isPositive ? '+' : '-'}
        {prefix}
        {Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

/* ─── StatusBadge — colored pill for status values ─── */

export function StatusBadge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
}) {
  const colorMap: Record<string, string> = {
    // Solid saturated bg + white text — universally readable in light AND dark mode.
    success: 'bg-emerald-600 text-white border-emerald-700',
    danger:  'bg-red-600 text-white border-red-700',
    warning: 'bg-amber-500 text-white border-amber-600',
    info:    'bg-sky-600 text-white border-sky-700',
    default: 'bg-slate-500 text-white border-slate-600',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
        colorMap[variant] ?? colorMap.default
      }`}
    >
      {label}
    </span>
  );
}
