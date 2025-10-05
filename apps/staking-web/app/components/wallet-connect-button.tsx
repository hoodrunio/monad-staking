'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/app/components/ui/button';
import { NetworkPixelIcon } from '@/app/components/icons';

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
          <div className="flex items-center gap-4">
            <Button 
              type="button" 
              onClick={openChainModal} 
              variant="outline" 
              size="icon" 
              className="hidden lg:inline-flex"
              aria-label={chain.name ? `Switch network: ${chain.name}` : 'Switch network'}
              title={chain.name ?? 'Switch network'}
            >
              <NetworkPixelIcon size={18} className="text-primary" />
            </Button>
            <span className="hidden mx-2 h-6 w-px bg-border/60 lg:block" />
            <Button 
              type="button" 
              onClick={openAccountModal} 
              variant="accent" 
              size="sm" 
              className="shrink-0 px-3 sm:px-4"
            >
              <span className="block max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[140px]">
                {account.displayName}
              </span>
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
