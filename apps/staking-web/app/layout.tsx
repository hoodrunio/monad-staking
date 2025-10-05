import type { Metadata } from 'next';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Press_Start_2P, VT323 } from 'next/font/google';
import { Providers } from './providers';
import { SiteHeader } from '@/app/components/site-header';
import { ThemeProvider } from '@/app/theme-provider';
import { Shell, ShellMain, ShellSection } from '@/app/components/layout/shell';
import { SparklePixelIcon } from '@/app/components/icons';

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
      <body className={`font-sans text-foreground antialiased ${pressStart.variable} ${vt323.variable}`}>
        <ThemeProvider>
          <Providers>
            <Shell>
              <SiteHeader />
              <ShellMain>
                {children}
              </ShellMain>
              <footer className="border-t-2 border-border bg-secondary/40 py-6 text-xs text-muted-foreground shadow-[0_-4px_0_rgba(0,0,0,0.35)]">
                <ShellSection
                  as="div"
                  className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-display text-[10px] uppercase tracking-[0.14em] text-primary">
                    Monad Staking &copy; {new Date().getFullYear()}
                  </span>
                  <span className="inline-flex items-center justify-center gap-2 font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <SparklePixelIcon size={12} className="text-primary" />
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
