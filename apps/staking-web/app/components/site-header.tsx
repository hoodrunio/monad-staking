'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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

const navigationLinks = [
  { href: '/', label: 'Dashboard', icon: RectangleGroupIcon },
  { href: '/stake', label: 'Stake', icon: ShieldCheckIcon },
  { href: '/validators', label: 'Validators', icon: ChartPieIcon },
  { href: '/account', label: 'Account', icon: CursorArrowRippleIcon },
];

function buildLinkClasses(active: boolean): string {
  const base = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors';
  return active
    ? `${base} bg-primary/15 text-primary-foreground ring-1 ring-primary/40`
    : `${base} text-muted-foreground hover:bg-white/10 hover:text-foreground`;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeHref = useMemo(() => {
    if (!pathname) return '/';
    const directMatch = navigationLinks.find((link) => link.href === pathname);
    if (directMatch) return directMatch.href;
    const prefix = navigationLinks.find((link) => link.href !== '/' && pathname.startsWith(`${link.href}/`));
    return prefix ? prefix.href : '/';
  }, [pathname]);

  const toggleMobile = () => setMobileOpen((value) => !value);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={closeMobile} className="group inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Monad Staking
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/10 px-1 py-1 lg:flex">
          {navigationLinks.map((link) => {
            const active = activeHref === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={buildLinkClasses(active)}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            beta access
          </div>
          <ClientOnly
            fallback={
              <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-muted-foreground">
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
          className="inline-flex items-center rounded-lg border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20 lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-background/95 lg:hidden">
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
                    className={buildLinkClasses(active)}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <ClientOnly
              fallback={
                <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-muted-foreground">
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
