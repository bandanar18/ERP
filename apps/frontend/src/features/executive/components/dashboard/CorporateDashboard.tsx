import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/features/executive/components/ui/card';
import { Button } from '@/features/executive/components/ui/button';
import { RippleLoader } from '../../components/evilcharts/blocks/ripple-loader';
import { ArrowRight, TrendingUp, type LucideIcon } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg?: string;
  colorClass?: string;
}

interface CorporateDashboardProps {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  indicatorId: string;
  metrics: MetricItem[];
}

export const CorporateDashboard: React.FC<CorporateDashboardProps> = ({
  title,
  subtitle,
  isLoading,
  indicatorId,
  metrics,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <RippleLoader size="md" label="Cargando indicador..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`
        w-full transition-all duration-300 shadow-sm
        ${isHovered
      ? 'border-primary/30 shadow-md shadow-primary/5 -translate-y-0.5'
      : 'hover:border-border/80'
    }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="border-b border-border/50 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-lg font-bold text-card-foreground leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            to={`/owner/indicadores/${indicatorId}`}
            className="shrink-0"
          >
            <Button
              variant="ghost"
              size="sm"
              className={`
                gap-1.5 text-xs font-semibold transition-all rounded-lg
                ${isHovered
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
    }
              `}
            >
              Detalle
              <ArrowRight
                className={`h-3.5 w-3.5 transition-transform duration-300 ${
                  isHovered ? 'translate-x-0.5' : ''
                }`}
              />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className={`
                  group relative flex flex-col gap-3 rounded-xl p-4
                  transition-all duration-200 border
                  ${isHovered
                ? 'bg-muted/60 border-border/40'
                : 'bg-muted/20 border-transparent hover:bg-muted/60 hover:border-border/40'
              }
                `}
              >
                {/* Icon */}
                <div
                  className={`
                    flex items-center justify-center h-9 w-9 rounded-lg
                    transition-all duration-200 shrink-0
                    ${metric.iconBg || 'bg-muted text-muted-foreground'}
                    ${isHovered ? 'scale-105' : 'group-hover:scale-105'}
                  `}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </div>

                {/* Label & Value */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </p>
                  <p
                    className={`
                      text-lg font-bold leading-tight
                      transition-colors duration-200
                      ${metric.colorClass || 'text-card-foreground'}
                    `}
                  >
                    {metric.value}
                  </p>
                </div>

                {/* Hover accent bar */}
                <span
                  className={`
                    absolute bottom-0 left-3 right-3 h-0.5 rounded-full
                    bg-primary/20
                    transition-all duration-300
                    ${isHovered ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
                  `}
                />
              </div>
            );
          })}
        </div>

        {/* Footer: quick trend link */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <Link
            to={`/owner/indicadores/${indicatorId}`}
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Ver tendencia histórica
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
