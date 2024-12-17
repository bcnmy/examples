import { useCallback, useEffect, useRef, useState } from "react"
import { useMarketStore } from "@/app/stores/marketStore"
import { useToast } from "@/app/hooks/use-toast"
import { stringify } from "@biconomy/sdk"
import { TradeToast } from "@/app/components/ui/TradeToast"
import { useAssetBalances } from "./use-asset-balances"
import { MOCK_POOL_ADDRESS } from "../lib/constants"
import { MOCK_USDC_ADDRESS, MOCK_WETH_ADDRESS } from "../lib/constants"
import { erc20Abi, http, createPublicClient, maxUint256 } from "viem"
import { baseSepolia } from "viem/chains"

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
  const [allowed, setAllowed] = useState(false)

  const checkAllowance = async () => {
    if (!nexusAddress || !sessionData) {
      console.log("Missing required data:", {
        nexusAddress,
        hasSessionData: !!sessionData
      })
      return false
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })

    // Check if the contract has allowance to spend tokens
    const [wethAllowance, usdcAllowance] = await Promise.all(
      [MOCK_WETH_ADDRESS, MOCK_USDC_ADDRESS].map((tokenAddress_) => {
        return publicClient.readContract({
          address: tokenAddress_,
          abi: erc20Abi,
          functionName: "allowance",
          args: [nexusAddress, MOCK_POOL_ADDRESS]
        })
      })
    )

    if (wethAllowance === maxUint256 && usdcAllowance === maxUint256) {
      console.log("Allowances are already set")
      setAllowed(true)
    } else {
      // Call approve route if allowance is not set
      try {
        console.log("Requesting approval with:", {
          userAddress: nexusAddress,
          hasSessionData: !!sessionData,
          currentAllowances: {
            WETH: wethAllowance.toString(),
            USDC: usdcAllowance.toString()
          }
        })

        const response = await fetch("/api/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: stringify({
            userAddress: nexusAddress,
            sessionData
          })
        })

        // Get the error details if available
        // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
        let errorDetails
        try {
          errorDetails = await response.json()
        } catch (e) {
          errorDetails = await response.text()
        }

        if (!response.ok) {
          throw new Error("Just waiting on approvals. Please stick around...")
        }

        const responseData = errorDetails

        // Wait for transaction receipt if available
        if (responseData.transactionHash && nexusClient) {
          await nexusClient.waitForTransactionReceipt({
            hash: responseData.transactionHash
          })
        }

        setAllowed(true)
      } catch (error) {
        console.error("Approval failed:", error)
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        toast({
          title: "Trade Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        })
        setAllowed(false)
      }
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const executeTrade = useCallback(async () => {
    // Prevent concurrent executions
    if (
      isExecutingRef.current ||
      !sessionData ||
      !nexusClient ||
      !nexusAddress
    ) {
      return
    }

    try {
      isExecutingRef.current = true

      if (!allowed) {
        const approvalSuccess = await checkAllowance()
        if (!approvalSuccess) {
          console.log("Approval needed")
          return
        }
      }

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

      // Add better error handling for JSON parsing
      let responseData: any
      try {
        responseData = await response.json()
      } catch (jsonError) {
        // If JSON parsing fails, try to get the raw text
        const rawText = await response.text()
        throw new Error(
          `Invalid response format: ${rawText.slice(0, 100)}...`, // Only show first 100 chars
          { cause: { rawResponse: rawText } }
        )
      }

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
    linkUserOpToTx,
    allowed
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
