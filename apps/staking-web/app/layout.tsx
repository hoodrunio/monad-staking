import type { Metadata } from 'next';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { SiteHeader } from '@/app/components/site-header';

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
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <div className="gradient-bg">
            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
              <SiteHeader />
              <main className="flex flex-1 flex-col gap-12 py-12">
                {children}
              </main>
              <footer className="flex items-center justify-between border-t border-white/5 py-6 text-xs text-muted-foreground">
                <span>Monad Staking &copy; {new Date().getFullYear()}</span>
                <span className="hidden sm:inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                  Securing the network together
                </span>
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
