'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';
import { Activity02Icon, BarChartIcon, Coins01Icon, Menu01Icon, ShieldKeyIcon, Wallet02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { WalletConnectButton } from '@/app/components/wallet-connect-button';
import { ClientOnly } from '@/app/components/client-only';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface NavigationLink {
  href: Route;
  label: string;
  icon: IconSvgElement;
  badge?: string;
}

const navigationLinks: NavigationLink[] = [
  { href: '/' as Route, label: 'Overview', icon: ShieldKeyIcon },
  { href: '/stake' as Route, label: 'Stake', icon: Coins01Icon },
  { href: '/validators' as Route, label: 'Validators', icon: BarChartIcon },
  { href: '/account' as Route, label: 'Account', icon: Wallet02Icon },
];

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
      <div className="mx-auto hidden w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:flex lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" onClick={closeMobile} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <HugeiconsIcon icon={Activity02Icon} size={20} />
            </span>
            <span className="text-xl font-semibold text-foreground">Monad Stake</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navigationLinks.map((link) => {
              const active = activeHref === link.href;
              return (
                <Link key={link.href} href={link.href} onClick={closeMobile} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-sm ${active ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <HugeiconsIcon icon={link.icon} size={16} />
                    {link.label}
                  </Button>
                  {link.badge ? (
                    <Badge variant="accent" className="absolute -right-2 -top-2">
                      {link.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ClientOnly
            fallback={
              <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            }
          >
            <WalletConnectButton />
          </ClientOnly>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={Activity02Icon} size={20} />
          </span>
          <span className="text-lg font-semibold text-foreground">Monad Stake</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation"
            onClick={toggleMobile}
          >
            <HugeiconsIcon icon={mobileOpen ? Cancel01Icon : Menu01Icon} size={20} />
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/40 bg-background/90 lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
            <nav className="flex flex-col gap-2">
              {navigationLinks.map((link) => {
                const active = activeHref === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={closeMobile} className="relative">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 ${active ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <HugeiconsIcon icon={link.icon} size={16} />
                      {link.label}
                    </Button>
                    {link.badge ? <Badge variant="accent" className="absolute right-3 top-2">{link.badge}</Badge> : null}
                  </Link>
                );
              })}
            </nav>
            <ClientOnly
              fallback={
                <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
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
