'use client';

import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}

export function useTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const activeTheme = (theme === 'system' ? resolvedTheme : theme) ?? 'dark';

  return {
    theme: activeTheme as Theme,
    setTheme: (next) => setTheme(next),
    toggleTheme: () => setTheme(activeTheme === 'light' ? 'dark' : 'light'),
  };
}
