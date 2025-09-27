'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/app/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/70 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
      aria-label="Toggle theme"
    >
      <SunIcon
        className={`h-5 w-5 transition-transform ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`}
      />
      <MoonIcon
        className={`absolute h-5 w-5 transition-transform ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`}
      />
    </button>
  );
}
