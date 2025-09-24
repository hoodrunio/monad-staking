import type { Metadata } from 'next';
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
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
