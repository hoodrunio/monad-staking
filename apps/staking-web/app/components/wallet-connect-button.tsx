'use client';

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
                className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-400"
              >
                Connecting…
              </button>
            </div>
          );
        }

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow shadow-emerald-900/50 transition hover:bg-emerald-500"
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
              className="rounded-md border border-red-500/60 bg-red-600/20 px-4 py-2 text-sm font-medium text-red-100 hover:border-red-400"
            >
              Wrong network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openChainModal}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500"
            >
              {chain.hasIcon && chain.iconUrl ? (
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                  <img
                    src={chain.iconUrl}
                    alt={chain.name ?? 'Chain icon'}
                    className="h-4 w-4 rounded-full"
                  />
                </span>
              ) : null}
              {chain.name ?? 'Unknown Network'}
            </button>
            <button
              type="button"
              onClick={openAccountModal}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700"
            >
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
