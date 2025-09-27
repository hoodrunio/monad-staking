import type { Metadata } from 'next';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from './providers';
import { SiteHeader } from '@/app/components/site-header';
import { ThemeProvider } from '@/app/theme-provider';

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
      <body
        className={`min-h-screen bg-background text-foreground antialiased font-sans ${GeistSans.variable} ${GeistMono.variable}`}
      >
        <ThemeProvider>
          <Providers>
            <div className="gradient-bg min-h-screen">
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
                  <main className="flex flex-1 flex-col gap-12 py-12">
                    {children}
                  </main>
                  <footer className="flex items-center justify-between border-t border-border/60 py-6 text-xs text-muted-foreground">
                    <span>Monad Staking &copy; {new Date().getFullYear()}</span>
                    <span className="hidden items-center gap-2 sm:inline-flex">
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
                      Securing the network together
                    </span>
                  </footer>
                </div>
              </div>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
