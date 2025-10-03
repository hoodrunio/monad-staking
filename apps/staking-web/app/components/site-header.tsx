'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  ChestPixelIcon,
  CoinPixelIcon,
  HourglassPixelIcon,
  KnightPixelIcon,
  SparklePixelIcon,
  HugeiconsIcon,
  Menu01Icon,
  Cancel01Icon,
} from '@/app/components/icons';
import { WalletConnectButton } from '@/app/components/wallet-connect-button';
import { ClientOnly } from '@/app/components/client-only';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface NavigationLink {
  href: Route;
  label: string;
  icon: (props: { className?: string; size?: number }) => JSX.Element;
  badge?: string;
}

const navigationLinks: NavigationLink[] = [
  { href: '/' as Route, label: 'Overview', icon: HourglassPixelIcon },
  { href: '/stake' as Route, label: 'Stake', icon: CoinPixelIcon },
  { href: '/validators' as Route, label: 'Validators', icon: KnightPixelIcon },
  { href: '/account' as Route, label: 'Account', icon: ChestPixelIcon },
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
    <header className="sticky top-0 z-40 border-b-2 border-border/80 bg-[#09041c]/95 backdrop-blur">
      <div className="mx-auto hidden w-full max-w-6xl items-center justify-between px-4 py-5 lg:flex">
        <div className="flex items-center gap-8">
          <Link href="/" onClick={closeMobile} className="group flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-secondary/60 shadow-[4px_4px_0_rgba(0,0,0,0.6)] transition-transform duration-150 group-hover:translate-x-[1px] group-hover:translate-y-[1px]">
              <SparklePixelIcon size={20} className="text-primary" />
            </span>
            <span className="font-display text-lg tracking-[0.16em] text-primary">
              <span className="block text-xs text-muted-foreground">Monad</span>
              Staking HQ
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            {navigationLinks.map((link) => {
              const active = activeHref === link.href;
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant={active ? 'accent' : 'outline'}
                  size="sm"
                  className="group gap-3 px-5"
                >
                  <Link href={link.href} onClick={closeMobile} className="flex items-center gap-3">
                    <Icon className={active ? 'text-primary-foreground' : 'text-primary'} size={18} />
                    <span>{link.label}</span>
                    {link.badge ? <Badge variant="accent">{link.badge}</Badge> : null}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ClientOnly
            fallback={
              <div className="pixel-panel pixel-border px-4 py-3 text-xs text-muted-foreground">
                Linking wallet...
              </div>
            }
          >
            <WalletConnectButton />
          </ClientOnly>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:hidden">
        <button
          type="button"
          className="flex items-center gap-3"
          onClick={closeMobile}
        >
          <span className="flex h-11 w-11 items-center justify-center border-2 border-primary bg-secondary/70 shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
            <SparklePixelIcon size={18} className="text-primary" />
          </span>
          <span className="font-display text-sm tracking-[0.14em] text-primary">Monad Staking HQ</span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Toggle navigation"
            onClick={toggleMobile}
          >
            <HugeiconsIcon icon={mobileOpen ? Cancel01Icon : Menu01Icon} size={20} />
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t-2 border-border/70 bg-[#09041c]/95 lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
            <nav className="flex flex-col gap-3">
              {navigationLinks.map((link) => {
                const active = activeHref === link.href;
                const Icon = link.icon;
                return (
                  <Button
                    key={link.href}
                    asChild
                    variant={active ? 'accent' : 'outline'}
                    className="justify-start gap-3"
                  >
                    <Link href={link.href} onClick={closeMobile} className="flex items-center gap-3">
                      <Icon className={active ? 'text-primary-foreground' : 'text-primary'} size={16} />
                      <span>{link.label}</span>
                      {link.badge ? <Badge variant="accent">{link.badge}</Badge> : null}
                    </Link>
                  </Button>
                );
              })}
            </nav>
            <ClientOnly
              fallback={
                <div className="pixel-panel pixel-border px-4 py-3 text-xs text-muted-foreground">
                  Linking wallet...
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
