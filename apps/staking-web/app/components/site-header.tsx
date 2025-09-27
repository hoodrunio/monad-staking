'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRippleIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { WalletConnectButton } from '@/app/components/wallet-connect-button';
import { ClientOnly } from '@/app/components/client-only';

interface NavigationLink {
  href: Route;
  label: string;
  icon: typeof RectangleGroupIcon;
}

const navigationLinks: NavigationLink[] = [
  { href: '/' as Route, label: 'Overview', icon: RectangleGroupIcon },
  { href: '/stake' as Route, label: 'Stake', icon: ShieldCheckIcon },
  { href: '/validators' as Route, label: 'Validators', icon: ChartPieIcon },
  { href: '/account' as Route, label: 'Account', icon: CursorArrowRippleIcon },
];

function linkClasses(active: boolean): string {
  const base = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors';
  return active
    ? `${base} bg-primary/20 text-primary-foreground shadow-sm shadow-primary/20`
    : `${base} text-muted-foreground hover:bg-white/5 hover:text-foreground`;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeHref = useMemo(() => {
    if (!pathname) return '/' as Route;
    const match = navigationLinks.find((link) => link.href === pathname);
    if (match) return match.href;
    const prefix = navigationLinks.find((link) => link.href !== '/' && pathname.startsWith(link.href));
    return (prefix?.href ?? '/') as Route;
  }, [pathname]);

  const toggleMobile = () => setMobileOpen((value) => !value);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={closeMobile} className="group inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Monad Stake
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-border/50 bg-card/70 px-1 py-1 shadow-inner shadow-white/5 lg:flex">
          {navigationLinks.map((link) => {
            const active = activeHref === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={linkClasses(active)}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs uppercase tracking-wide text-primary-foreground">
            Beta Access
          </div>
          <ClientOnly
            fallback={
              <div className="rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            }
          >
            <WalletConnectButton />
          </ClientOnly>
        </div>

        <button
          type="button"
          onClick={toggleMobile}
          className="inline-flex items-center rounded-lg border border-border/60 bg-card/60 p-2 text-white transition hover:bg-white/20 lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/40 bg-background/95 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
            <nav className="flex flex-col gap-2">
              {navigationLinks.map((link) => {
                const active = activeHref === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobile}
                    className={linkClasses(active)}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <ClientOnly
              fallback={
                <div className="rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
                  Loading...
                </div>
              }
            >
              <WalletConnectButton />
            </ClientOnly>
          </div>
        </div>
      ) : null}
    </header>
  );
}
