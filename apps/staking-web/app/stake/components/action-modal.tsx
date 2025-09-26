'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div
        className={`relative w-full rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-emerald-500/10 ${SIZE_CLASS[size]}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 transition hover:text-slate-300"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
            {description && <p className="text-sm text-slate-400">{description}</p>}
          </header>

          <div>{children}</div>

          {footer && <div className="pt-2">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
