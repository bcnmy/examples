import React, { useRef } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import Chart from "@/app/components/ui/Chart"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { TradingTray } from "@/app/components/ui/TradingTray"
import { useEffect, useState } from "react"
import type { Address } from "viem/accounts"
import { useBalances } from "@/app/hooks/use-balances"
import { useToast } from "@/app/hooks/use-toast"

interface MarketInterfaceProps {
  price: string
  priceChange: string
  isBullish: boolean
  isLoading: boolean
  isConnected: boolean
  claimTokens: (address: Address) => void
  address?: Address
}

export function MarketInterface({
  price,
  priceChange,
  isBullish,
  isLoading,
  isConnected,
  address,
  claimTokens,
}: MarketInterfaceProps) {

  const balances = useBalances()
  const { toast } = useToast()

  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const [tradeAmount, setTradeAmount] = useState("0")
  const [animationClass, setAnimationClass] = useState("")
  const hasClaimedRef = useRef(false)
  const hasShownBannerRef = useRef(false)

  const handleTrade = () => {
    console.log("Trade initiated with amount:", tradeAmount)
  }

  // Add this effect to handle automatic claiming when wallet connects
  // Add a ref to track if we've already claimed
  useEffect(() => {
    // Check if we've shown the banner before in this browser
    const hasShownBefore = localStorage.getItem('hasShownWelcomeBanner')
    
    if (!isConnected) {
      hasClaimedRef.current = false
      return
    }

    // Only show toast if:
    // 1. User is connected
    // 2. Haven't shown banner before in this session
    // 3. Haven't shown banner before in this browser
    // 4. User has zero balance (indicating they're new)
    if (
      address && 
      claimTokens && 
      !hasClaimedRef.current && 
      !hasShownBannerRef.current && 
      !hasShownBefore &&
      balances.hasZeroBalance 
    ) {
      hasClaimedRef.current = true
      hasShownBannerRef.current = true
      localStorage.setItem('hasShownWelcomeBanner', 'true')
      claimTokens(address)
      
      toast({
        variant: "default",
        title: "Welcome!",
        description: "We're sending you some test tokens to get started. You'll receive 10 USDC and 0.003 ETH to try out the platform."
      })
    }
  }, [isConnected, address, claimTokens, balances.hasZeroBalance, toast])

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
            : "before:from-red-500/10 before:to-transparent"
        }
        ${animationClass}
      `}
    >
      <div className="container mx-auto px-4 py-8">
        <Card className="border-none">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">ETH/USDC</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 mr-4">
                    {isConnected ? <ConnectButton /> : null}
                  </div>
                  <div className="relative z-20">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${price}</p>
                      <p
                        className={`text-sm font-medium ${
                          isBullish ? "text-emerald-500" : "text-red-500"
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
                      : "before:from-red-500/20 before:to-transparent"
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
                      <button
                        type="button"
                        onClick={() => setIsTrayOpen(!isTrayOpen)}
                        className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-lg 
                            transform transition-all duration-500 hover:scale-110 hover:rotate-1
                            ${
                              isBullish
                                ? "bg-emerald-500/80 hover:bg-emerald-400/90 hover:shadow-lg hover:shadow-emerald-500/50"
                                : "bg-red-500/80 hover:bg-red-400/90 hover:shadow-lg hover:shadow-red-500/50"
                            } text-white font-bold
                            ${animationClass}`}
                      >
                        <span className="text-lg mb-1">Auto Trade</span>
                      </button>
                    ) : (
                      <ConnectButton.Custom>
                        {({ openConnectModal }) => (
                          <button
                            type="button"
                            onClick={openConnectModal}
                            className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-lg 
                                transform transition-all duration-500 hover:scale-110
                                ${
                                  isBullish
                                    ? "bg-emerald-500/80 hover:bg-emerald-400/90 hover:shadow-lg hover:shadow-emerald-500/50"
                                    : "bg-red-500/80 hover:bg-red-400/90 hover:shadow-lg hover:shadow-red-500/50"
                                } text-white font-bold`}
                          >
                            <span className="text-lg mb-1">Connect Wallet</span>
                          </button>
                        )}
                      </ConnectButton.Custom>
                    )}

                    <TradingTray
                      isTrayOpen={isTrayOpen}
                      isBullish={isBullish ?? false}
                      tradeAmount={tradeAmount.toString()}
                      onTradeAmountChange={setTradeAmount}
                      onTrade={handleTrade}
                      balances={balances}
                      onMaxClick={() => setTradeAmount("0.01")}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg  text-right">
                  <p className="text-sm text-white/60">Market State</p>
                  <p
                    className={`text-xl font-semibold transform transition-all duration-500
                      ${isBullish ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {isBullish ? "BULLISH" : "BEARISH"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
