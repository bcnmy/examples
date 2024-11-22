import { useEffect, useRef } from "react"
import { useMarketStore } from "@/app/stores/marketStore"
import { useToast } from "@/app/hooks/use-toast"
import { MOCK_USDC_ADDRESS, MOCK_WETH_ADDRESS } from "@/app/lib/constants"
import { useBalance } from "wagmi"
import { stringify } from "@biconomy/sdk"
import { TradeToast } from "@/app/components/ui/TradeToast"
import { useAssetBalances } from "./use-asset-balances"

export function useAutoTrade() {
  const { nexusClient, nexusAddress, isBullish } = useMarketStore()

  const sessionData = localStorage.getItem(`session_${nexusAddress}`)

  const assetBalances = useAssetBalances(nexusAddress)

  console.log({ assetBalances })

  const { toast } = useToast()

  const prevIsBullishRef = useRef(isBullish)

  useEffect(() => {
    // Only proceed if isBullish has changed
    if (prevIsBullishRef.current === isBullish) {
      return
    }

    // Don't execute if we don't have the required data
    if (!sessionData || !nexusClient || !nexusAddress) {
      return
    }

    // Update the ref
    prevIsBullishRef.current = isBullish

    const executeTrade = async () => {
      console.log(`Executing trade... ${isBullish ? "buy" : "sell"}`)

      try {
        // Don't trade if no balance for direction
        if (isBullish && assetBalances.usdcBalance <= 0n)
          throw new Error("No USDC balance")
        if (!isBullish && assetBalances.wethBalance <= 0n)
          throw new Error("No WETH balance")

        const response = await fetch("/api/trade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: stringify({
            userAddress: nexusAddress,
            isBullish,
            amount: isBullish
              ? assetBalances.usdcBalance
              : assetBalances.wethBalance,
            sessionData
          })
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(
            responseData.details || responseData.error || "Trade failed",
            {
              cause: responseData
            }
          )
        }

        toast({
          title: "Trade Executed",
          description: TradeToast({
            isBullish,
            userOpHash: responseData.userOpHash,
            transactionHash: responseData.transactionHash
          }),
          duration: 5000
        })
      } catch (error) {
        console.error("Trade failed:", error)

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred"

        const errorCause =
          error instanceof Error && error.cause
            ? (error.cause as { userOpHash?: string; transactionHash?: string })
            : undefined

        toast({
          title: "Trade Failed",
          description: TradeToast({
            isBullish,
            userOpHash: errorCause?.userOpHash,
            transactionHash: errorCause?.transactionHash,
            error: true,
            errorMessage
          }),
          variant: "destructive",
          duration: 7000
        })
      }
    }

    // Execute trade when isBullish changes
    executeTrade()
  }, [
    nexusClient,
    nexusAddress,
    sessionData,
    isBullish,
    assetBalances.wethBalance,
    assetBalances.usdcBalance,
    toast
  ])
}
