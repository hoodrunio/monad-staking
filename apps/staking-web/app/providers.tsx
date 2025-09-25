'use client';

import { useState, useMemo, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';
import { createWagmiConfig } from '@/lib/wallet';

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
        <RainbowKitProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'bg-slate-800 text-slate-100 border border-slate-700',
              duration: 4000,
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
