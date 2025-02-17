"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { SwapWidget } from "./components/ui/SwapWidget"
import { useERC20Balance } from "./hooks/use-erc20-balance"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { LoadingWidget } from "./components/LoadingWidget"
import { FaucetSection } from "./components/FaucetSection"
import { baseSepolia, optimismSepolia } from "viem/chains"
import { mcUSDC } from "./config/USDC"
import { mcFusion } from "./config/fusion"

export default function Home() {
  const { isConnected, address } = useAccount()

  const usdcBalance = useERC20Balance({
    chain: optimismSepolia,
    address,
    mcToken: mcUSDC,
    symbol: "USDC"
  })

  const fusionBalance = useERC20Balance({
    chain: baseSepolia,
    address,
    mcToken: mcFusion,
    symbol: "FUSE"
  })

  const [state, setState] = useState<
    "funded" | "not-funded" | "loading" | "not-connected"
  >("loading")

  useEffect(() => {
    if (!isConnected) {
      setState("not-connected")
      return
    }

    if (usdcBalance.isLoading) {
      setState("loading")
      return
    }

    if (usdcBalance.balance && usdcBalance.balance > 0n) {
      setState("funded")
      return
    }

    setState("not-funded")
  }, [isConnected, usdcBalance.balance, usdcBalance.isLoading, usdcBalance])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4 justify-center items-center h-[calc(100vh-160px)]">
      {(() => {
        switch (state) {
          case "not-funded":
            return <FaucetSection eoaAddress={address} />
          case "funded":
            return (
              <SwapWidget
                usdcBalance={usdcBalance}
                fusionBalance={fusionBalance}
              />
            )
          case "loading":
            return <LoadingWidget />
          case "not-connected":
            return <ConnectButton />
          default:
            return <ConnectButton />
        }
      })()}
    </div>
  )
}
