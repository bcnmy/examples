import { useCallback, useEffect, useRef } from "react"
import { useMarketStore } from "@/app/stores/marketStore"
import { useToast } from "@/app/hooks/use-toast"
import { stringify } from "@biconomy/sdk"
import { TradeToast } from "@/app/components/ui/TradeToast"
import { useAssetBalances } from "./use-asset-balances"

export type TradeState = {
  status: "idle" | "preparing" | "trading" | "submitted" | "confirmed" | "error"
  isBullish: boolean | null
  error?: string
  userOpHash?: string
  transactionHash?: string
  amount?: string
  price?: string
}

export function useAutoTrade() {
  const {
    nexusClient,
    nexusAddress,
    isBullish,
    addTrade,
    updateTrade,
    linkUserOpToTx,
    tracking
  } = useMarketStore()

  const sessionData = localStorage.getItem(`session_${nexusAddress}`)
  const assetBalances = useAssetBalances(nexusAddress)
  const { toast } = useToast()
  const prevIsBullishRef = useRef(isBullish)
  const currentTradeIdRef = useRef<string | null>(null)
  const isExecutingRef = useRef(false)

  const executeTrade = useCallback(async () => {
    // Prevent concurrent executions
    if (isExecutingRef.current || !sessionData || !nexusClient || !nexusAddress) {
      return
    }

    try {
      isExecutingRef.current = true

      // Create initial trade record
      const amount = isBullish
        ? assetBalances.usdcBalance.toString()
        : assetBalances.wethBalance.toString()

      currentTradeIdRef.current = addTrade({
        isBullish,
        status: "preparing",
        amount
      })

      // Update to trading status
      updateTrade(currentTradeIdRef.current, { status: "trading" })

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
          { cause: responseData }
        )
      }

      // Update trade with userOpHash and status
      updateTrade(currentTradeIdRef.current, {
        status: "submitted",
        userOpHash: responseData.userOpHash
      })

      // Link userOp to transaction if available
      if (responseData.transactionHash) {
        linkUserOpToTx(responseData.userOpHash, responseData.transactionHash)
      }

      // Wait for transaction receipt
      const receipt = await nexusClient.waitForTransactionReceipt({
        hash: responseData.transactionHash
      })

      // Update final status
      updateTrade(currentTradeIdRef.current, {
        status: "confirmed",
        transactionHash: receipt.transactionHash
      })

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

      if (currentTradeIdRef.current) {
        updateTrade(currentTradeIdRef.current, {
          status: "error",
          error: errorMessage,
          userOpHash: errorCause?.userOpHash,
          transactionHash: errorCause?.transactionHash
        })
      }

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
    } finally {
      isExecutingRef.current = false
    }
  }, [
    nexusClient,
    nexusAddress,
    sessionData,
    isBullish,
    assetBalances.wethBalance,
    assetBalances.usdcBalance,
    toast,
    addTrade,
    updateTrade,
    linkUserOpToTx
  ])

  useEffect(() => {
    // Skip if same direction or already executing
    if (prevIsBullishRef.current === isBullish || isExecutingRef.current) {
      return
    }

    // Debounce the execution slightly to prevent double triggers
    const timeoutId = setTimeout(() => {
      prevIsBullishRef.current = isBullish
      executeTrade()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isBullish, executeTrade])

  return {
    currentTrade: currentTradeIdRef.current
      ? tracking.trades.find((t) => t.id === currentTradeIdRef.current)
      : null,
    trades: tracking.trades,
    pendingTrades: Array.from(tracking?.pendingTrades?.values() ?? [])
  }
}
