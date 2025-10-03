'use client';

import { useState, useMemo, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, type Theme } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';
import { createWagmiConfig } from '@/lib/wallet';

const pixelTheme = (): Theme => {
  const baseTheme = darkTheme({
    accentColor: '#6cf6ff',
    accentColorForeground: '#05030f',
    borderRadius: 'none',
    fontStack: 'system',
    overlayBlur: 'small',
  });

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      accentColor: '#6cf6ff',
      accentColorForeground: '#05030f',
      actionButtonBorder: 'rgba(108, 246, 255, 0.3)',
      actionButtonBorderMobile: 'rgba(108, 246, 255, 0.3)',
      actionButtonSecondaryBackground: 'rgba(16, 10, 36, 0.8)',
      closeButton: 'rgba(255, 255, 255, 0.7)',
      closeButtonBackground: 'rgba(16, 10, 36, 0.8)',
      connectButtonBackground: '#100a24',
      connectButtonBackgroundError: '#1b0828',
      connectButtonInnerBackground: 'rgba(27, 8, 40, 0.95)',
      connectButtonText: '#ffffff',
      connectButtonTextError: '#ff6b6b',
      connectionIndicator: '#6cf6ff',
      downloadBottomCardBackground: 'linear-gradient(180deg, rgba(16, 10, 36, 0.98) 0%, rgba(27, 8, 40, 1) 100%)',
      downloadTopCardBackground: 'linear-gradient(180deg, rgba(16, 10, 36, 0.98) 0%, rgba(27, 8, 40, 1) 100%)',
      error: '#ff6b6b',
      generalBorder: 'rgba(108, 246, 255, 0.3)',
      generalBorderDim: 'rgba(108, 246, 255, 0.15)',
      menuItemBackground: 'rgba(16, 10, 36, 0.6)',
      modalBackdrop: 'rgba(5, 3, 15, 0.85)',
      modalBackground: '#100a24',
      modalBorder: 'rgba(108, 246, 255, 0.4)',
      modalText: '#ffffff',
      modalTextDim: 'rgba(255, 255, 255, 0.6)',
      modalTextSecondary: 'rgba(255, 255, 255, 0.7)',
      profileAction: 'rgba(16, 10, 36, 0.8)',
      profileActionHover: 'rgba(22, 13, 65, 0.9)',
      profileForeground: 'rgba(16, 10, 36, 0.95)',
      selectedOptionBorder: 'rgba(108, 246, 255, 0.6)',
      standby: '#ffd700',
    },
    fonts: {
      body: 'var(--font-display)',
    },
    radii: {
      actionButton: '0px',
      connectButton: '0px',
      menuButton: '0px',
      modal: '0px',
      modalMobile: '0px',
    },
    shadows: {
      connectButton: '0 0 0 0 transparent',
      dialog: '0 0 40px rgba(108, 246, 255, 0.25), inset 0 0 0 2px rgba(9, 5, 24, 0.95), 8px 8px 0 rgba(0, 0, 0, 0.4)',
      profileDetailsAction: '3px 3px 0 rgba(0, 0, 0, 0.5)',
      selectedOption: '4px 4px 0 rgba(0, 0, 0, 0.5)',
      selectedWallet: '4px 4px 0 rgba(0, 0, 0, 0.5)',
      walletLogo: '0 0 0 0 transparent',
    },
  };
};

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  
  // Create wagmi config only on client-side to avoid SSR issues with indexedDB
  const wagmiConfig = useMemo(() => {
    if (!mounted) return null;
    return createWagmiConfig();
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render wagmi providers until mounted on client-side
  if (!mounted || !wagmiConfig) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={pixelTheme()}
          appInfo={{
            appName: 'Monad Staking HQ',
            learnMoreUrl: 'https://monad.xyz',
          }}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-background/80 text-foreground backdrop-blur',
              duration: 4000,
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
