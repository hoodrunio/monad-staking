'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ActionModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<ActionModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function ActionModal({ open, title, description, onClose, children, footer, size = 'md' }: ActionModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div
        className={cn(
          'relative w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-foreground shadow-[0_50px_90px_-45px_rgba(56,189,248,0.6)]',
          SIZE_CLASS[size],
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="space-y-5">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </header>

          <div className="space-y-4">{children}</div>

          {footer ? <div className="pt-2">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
