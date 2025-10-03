import type { Metadata } from 'next';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Press_Start_2P, VT323 } from 'next/font/google';
import { Providers } from './providers';
import { SiteHeader } from '@/app/components/site-header';
import { ThemeProvider } from '@/app/theme-provider';
import { Shell, ShellMain, ShellSection } from '@/app/components/layout/shell';

const pressStart = Press_Start_2P({
  subsets: ['latin'],
  variable: '--font-press-start',
  weight: '400',
  display: 'swap',
});

const vt323 = VT323({
  subsets: ['latin'],
  variable: '--font-vt323',
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Monad Staking Dashboard',
  description: 'Monitor validator epochs, delegations, and rewards across Monad networks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-background font-sans text-foreground antialiased ${pressStart.variable} ${vt323.variable}`}>
        <ThemeProvider>
          <Providers>
            <Shell>
              <SiteHeader />
              <ShellMain>
                {children}
              </ShellMain>
              <footer className="border-t border-border/60 py-6 text-xs text-muted-foreground">
                <ShellSection
                  as="div"
                  className="flex items-center justify-between"
                >
                  <span>Monad Staking &copy; {new Date().getFullYear()}</span>
                  <span className="hidden items-center gap-2 sm:inline-flex">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
                    Securing the network together
                  </span>
                </ShellSection>
              </footer>
            </Shell>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
