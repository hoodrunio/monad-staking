import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'rounded-xl bg-primary text-primary-foreground shadow-glow hover:bg-primary/90',
  secondary: 'rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90',
  ghost: 'rounded-xl bg-transparent text-foreground hover:bg-white/5',
  outline: 'rounded-xl border border-border/60 bg-transparent text-foreground hover:border-primary/40 hover:text-primary',
  accent: 'rounded-xl bg-accent text-accent-foreground shadow-[0_20px_45px_-30px_rgba(131,110,249,0.65)] hover:bg-accent/90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
  icon: 'h-9 w-9 p-0 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

export function Button({ variant = 'default', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)} {...props} />;
}
