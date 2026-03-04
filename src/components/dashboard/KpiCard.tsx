import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-card border',
  accent: 'bg-accent/10 border border-accent/20',
  success: 'bg-success/10 border border-success/20',
  warning: 'bg-warning/10 border border-warning/20',
  destructive: 'bg-destructive/10 border border-destructive/20',
};

const iconStyles = {
  default: 'text-muted-foreground',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

export default function KpiCard({ label, value, icon: Icon, trend, variant = 'default' }: KpiCardProps) {
  return (
    <div className={cn('rounded-lg p-4 animate-fade-in', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {trend && <p className="mt-0.5 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('p-2 rounded-md bg-muted/50', iconStyles[variant])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
