'use client';

import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/app/components/ui/button';

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
              <Button variant="outline" size="sm" className="cursor-wait">
                Connecting…
              </Button>
            </div>
          );
        }

        if (!connected) {
          return (
            <Button type="button" onClick={openConnectModal} variant="accent">
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              type="button"
              onClick={openChainModal}
              variant="outline"
              className="border-destructive/60 bg-destructive/10 text-destructive hover:border-destructive"
            >
              Wrong network
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <Button type="button" onClick={openChainModal} variant="outline" size="sm" className="gap-2">
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
            </Button>
            <Button type="button" onClick={openAccountModal} variant="accent" size="sm" className="px-4">
              {account.displayName}
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
