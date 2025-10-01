'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Moon02Icon, SunIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/app/components/ui/button';
import { useTheme } from '@/app/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="relative text-muted-foreground"
    >
      <HugeiconsIcon
        icon={SunIcon}
        altIcon={Moon02Icon}
        showAlt={theme === 'dark'}
        size={16}
        className="transition-transform"
      />
    </Button>
  );
}
