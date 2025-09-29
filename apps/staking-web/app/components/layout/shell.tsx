import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ShellProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={cn('gradient-bg flex min-h-screen flex-col', className)}>
      {children}
    </div>
  );
}

type ShellMainProps<T extends ElementType = 'main'> = {
  readonly as?: T;
  readonly children: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function ShellMain<T extends ElementType = 'main'>({ as, children, className, ...props }: ShellMainProps<T>) {
  const Component = (as ?? 'main') as ElementType;
  return (
    <Component className={cn('flex flex-1 flex-col gap-12 py-12', className)} {...props}>
      {children}
    </Component>
  );
}

type ShellSectionWidth = 'narrow' | 'default' | 'wide' | 'full';

type ShellSectionProps<T extends ElementType = 'section'> = {
  readonly as?: T;
  readonly children: ReactNode;
  readonly className?: string;
  readonly padded?: boolean;
  readonly width?: ShellSectionWidth;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const widthClassMap: Record<ShellSectionWidth, string> = {
  narrow: 'mx-auto w-full max-w-4xl',
  default: 'mx-auto w-full max-w-6xl',
  wide: 'mx-auto w-full max-w-7xl',
  full: 'w-full',
};

export function ShellSection<T extends ElementType = 'section'>({
  as,
  children,
  className,
  padded = true,
  width = 'default',
  ...props
}: ShellSectionProps<T>) {
  const Component = (as ?? 'section') as ElementType;
  return (
    <Component
      className={cn(
        widthClassMap[width],
        padded ? 'px-4 sm:px-6 lg:px-8' : undefined,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
