"use client"

import { IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@rainbow-me/rainbowkit/styles.css"
import { Toaster } from "./components/ui/toaster"
import { testnetConfig, mainnetConfig } from "./config/wallet"
import { useNetworkStore } from "./store/network-store"
import { useNetworkData } from "./hooks/use-network-data"
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
})

// Create QueryClient outside of component
const queryClient = new QueryClient()

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { mode } = useNetworkStore()
  const config = mode === "mainnet" ? mainnetConfig : testnetConfig
  const { sourceChain } = useNetworkData()

  return (
    <html lang="en">
      <body
        className={`${ibmPlexMono.className} bg-slate-900 text-slate-200 transition-colors duration-300 bg-black bg-circuit-pattern min-h-screen`}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider initialChain={sourceChain}>
              {children}
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
