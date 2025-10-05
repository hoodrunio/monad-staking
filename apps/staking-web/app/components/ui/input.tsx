import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-border bg-muted/60 text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 border-2 px-4 py-2 text-sm tracking-[0.06em] shadow-[4px_4px_0_rgba(0,0,0,0.5)] outline-none transition-all duration-150',
        'file:inline-flex file:h-9 file:border-0 file:bg-transparent file:px-3 file:text-xs file:font-display file:uppercase file:tracking-[0.12em] file:text-foreground',
        'focus-visible:border-primary focus-visible:shadow-[6px_6px_0_rgba(108,246,255,0.55)]',
        'aria-invalid:border-destructive aria-invalid:shadow-[6px_6px_0_rgba(255,75,84,0.4)]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
