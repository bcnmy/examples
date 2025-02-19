"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { SwapWidget } from "./components/ui/SwapWidget"
import { useERC20Balance } from "./hooks/use-erc20-balance"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { LoadingWidget } from "./components/LoadingWidget"
import { FaucetSection } from "./components/FaucetSection"
import { useNetworkData } from "./hooks/use-network-data"
import { NetworkToggle } from "./components/ui/NetworkToggle"
import { FaucetButton } from "./components/ui/FaucetButton"
export default function Home() {
  const { isConnected, address } = useAccount()
  const { sourceChain, destinationChain, inToken, outToken, mode } =
    useNetworkData()

  const usdcBalance = useERC20Balance({
    chain: sourceChain,
    address,
    mcToken: inToken
  })

  const outTokenBalance = useERC20Balance({
    chain: destinationChain,
    address,
    mcToken: outToken
  })

  const [state, setState] = useState<
    "funded" | "show-faucet" | "loading" | "not-connected"
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

    if (
      (mode && mode === "mainnet") ||
      (usdcBalance.balance && usdcBalance.balance > 0n)
    ) {
      setState("funded")
      return
    }

    setState("show-faucet")
  }, [
    isConnected,
    usdcBalance.balance,
    usdcBalance.isLoading,
    usdcBalance,
    mode
  ])

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl flex flex-col gap-4 justify-center items-center">
        {(() => {
          switch (state) {
            case "show-faucet":
              return <FaucetSection eoaAddress={address} />
            case "funded":
              return (
                <SwapWidget
                  usdcBalance={usdcBalance}
                  outTokenBalance={outTokenBalance}
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
    </main>
  )
}
