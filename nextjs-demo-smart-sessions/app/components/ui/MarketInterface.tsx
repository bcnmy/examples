import React from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import Chart from "@/app/components/ui/Chart"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { TradingTray } from "@/app/components/ui/TradingTray"
import { useEffect, useState } from "react"
import type { Address } from "viem/accounts"
import { Button } from "@/app/components/ui/button"
import { CustomConnectButton } from "./ConnectButton"
import { useMarketStore } from "@/app/stores/marketStore"
import { useAccount } from "wagmi"
import { DemoBanner } from "./DemoBanner"
import { HowItWorksDialog } from "./HowItWorks"
import { useAutoTrade } from "@/app/hooks/use-auto-trade"
import { AccountLink } from "./AccountLink"
import { TradeHistory } from "./TradeHistory"
import { StatusBadge } from "./StatusBadge"
import { ActiveTrader } from "./ActiveTrader"

interface MarketInterfaceProps {
  price: string
  priceChange: string
  isBullish: boolean
  isLoading: boolean
  address?: Address
}

export function MarketInterface({
  price,
  priceChange,
  isBullish,
  isLoading
}: MarketInterfaceProps) {
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const [animationClass, setAnimationClass] = useState("")
  const { initializeNexusClient } = useMarketStore()
  const { address, isConnected, chain } = useAccount()

  const tradeState = useAutoTrade()

  useEffect(() => {
    if (address && chain && isConnected && initializeNexusClient) {
      initializeNexusClient(address, chain)
    }
  }, [address, chain, initializeNexusClient, isConnected])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setAnimationClass("animate-flash-glow")
    const timer = setTimeout(() => {
      setAnimationClass("")
    }, 1000)

    return () => clearTimeout(timer)
  }, [isBullish])

  if (isLoading) {
    return (
      <div className="container min-h-screen py-8 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <p className="text-lg text-white/60">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <main
      className={`min-h-screen bg-black bg-circuit-pattern
        before:content-[''] before:fixed before:inset-0 before:-z-10
        before:bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from)_0%,_var(--tw-gradient-to)_70%)]
        ${
          isBullish
            ? "before:from-emerald-500/10 before:to-transparent"
            : "before:from-bearish/10 before:to-transparent"
        }
        ${animationClass}
      `}
    >
      <DemoBanner />
      <ActiveTrader currentTrade={tradeState.currentTrade ?? null} />
      <div className="container mx-auto px-4 py-8">
        <Card className="border-none">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-white">WETH/USDC</h1>
                  <HowItWorksDialog />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 mr-4">
                    {isConnected ? (
                      <>
                        <ConnectButton />
                        <AccountLink />
                      </>
                    ) : null}
                  </div>
                  <div className="relative z-20">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${price}</p>
                      <p
                        className={`text-sm font-medium ${
                          isBullish ? "text-emerald-500" : "text-bearish"
                        }`}
                      >
                        {priceChange}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`relative w-full h-[600px] rounded-lg overflow-hidden
                  bg-clip-padding backdrop-filter backdrop-blur-sm
                  before:content-[''] before:absolute before:inset-0 before:p-[2px] before:rounded-lg before:-z-10
                  before:bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from)_0%,_var(--tw-gradient-to)_70%)]
                  ${
                    isBullish
                      ? "before:from-emerald-500/20 before:to-transparent"
                      : "before:from-bearish/20 before:to-transparent"
                  }
                  ${animationClass}
                `}
              >
                <Chart symbol="ETHUSDC" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg ">
                  <p className="text-sm text-white/60">Price</p>
                  <p className="text-xl font-semibold text-white">${price}</p>
                </div>
                <div className="p-4 rounded-lg ">
                  <div className="relative">
                    {isConnected ? (
                      <Button
                        onClick={() => setIsTrayOpen(!isTrayOpen)}
                        variant={isBullish ? "bullish" : "bearish"}
                        className="w-full h-full transform transition-all duration-500 
                          hover:scale-110 hover:rotate-1 hover:shadow-lg
                          hover:shadow-current"
                      >
                        <span className="text-lg">Auto Trade</span>
                      </Button>
                    ) : (
                      <CustomConnectButton />
                    )}

                    <TradingTray
                      isTrayOpen={isTrayOpen}
                      onTrayOpenChange={setIsTrayOpen}
                      isBullish={isBullish ?? false}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg text-right">
                  <p className="text-sm text-white/60">Market State</p>
                  <div className="flex items-center justify-end gap-2">
                    <p
                      className={`text-xl font-semibold transform transition-all duration-500
                        ${isBullish ? "text-emerald-500" : "text-bearish"}`}
                    >
                      {isBullish ? "BULLISH" : "BEARISH"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
