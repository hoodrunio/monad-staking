import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monad Staking Dashboard',
  description:
    'Monitor validator epochs, delegations, and rewards across Monad networks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="border-b border-slate-800 bg-slate-950/80">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-100">
                Monad Staking
              </span>
              <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-300">
                dApp
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <Link
                href="/"
                className="rounded-md px-3 py-2 transition hover:bg-slate-800/60 hover:text-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/validators"
                className="rounded-md px-3 py-2 transition hover:bg-slate-800/60 hover:text-slate-100"
              >
                Validators
              </Link>
            </div>
          </nav>
        </div>
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
