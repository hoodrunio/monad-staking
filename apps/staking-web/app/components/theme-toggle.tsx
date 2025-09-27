'use client';

import { Moon, Sun } from 'lucide-react';
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
      <Sun className={`h-4 w-4 transition-transform ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      <Moon className={`absolute h-4 w-4 transition-transform ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
    </Button>
  );
}
