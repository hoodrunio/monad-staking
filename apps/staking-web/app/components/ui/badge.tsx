import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'secondary' | 'accent';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary rounded-full border border-primary/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
  secondary: 'bg-secondary/40 text-muted-foreground rounded-full border border-border/50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
  accent: 'bg-accent/15 text-accent rounded-full border border-accent/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return <span className={cn('inline-flex items-center gap-1', variantClasses[variant], className)} {...props} />;
}
