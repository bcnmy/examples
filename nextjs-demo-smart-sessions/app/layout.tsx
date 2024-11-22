'use client';

import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { useMarketStore } from './stores/marketStore';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { config } from './config/wallet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from "@/app/components/ui/toaster"
import { useEffect } from 'react';
import { useState } from 'react';

// Move these initializations outside the component
const queryClient = new QueryClient()

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isBullish = useMarketStore(state => state.isBullish);
  
  const bgColor = isBullish === null 
    ? 'bg-slate-900'
    : isBullish 
    ? 'bg-green-950' 
    : 'bg-bearish-dark';

  return (
    <html lang="en">
      <body className={`${ibmPlexMono.className} ${bgColor} text-slate-200 transition-colors duration-300 bg-black bg-circuit-pattern min-h-screen`}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider initialChain={baseSepolia}>
              {mounted ? children : null}
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
