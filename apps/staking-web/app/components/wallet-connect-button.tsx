'use client';

import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) {
          return (
            <div aria-hidden>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-muted-foreground"
              >
                Connecting...
              </button>
            </div>
          );
        }

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90"
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="rounded-xl border border-destructive/60 bg-destructive/20 px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:border-destructive"
            >
              Wrong network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openChainModal}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-foreground transition hover:border-primary/40 hover:text-primary-foreground"
            >
              {chain.hasIcon && chain.iconUrl ? (
                <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={chain.iconUrl}
                    alt={chain.name ?? 'Chain icon'}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-cover"
                  />
                </span>
              ) : null}
              <span>{chain.name ?? 'Unknown network'}</span>
            </button>
            <button
              type="button"
              onClick={openAccountModal}
              className="rounded-xl border border-primary/40 bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/25"
            >
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
