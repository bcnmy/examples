import { useState, useCallback } from "react"
import type { Hex } from "viem"
import {
  type MeeClient,
  type MultichainSmartAccount,
  safeMultiplier,
  LARGE_DEFAULT_GAS_LIMIT,
  type GetFusionQuotePayload
} from "@biconomy/abstractjs"
import { useAccount } from "wagmi"
import { useNetworkData } from "./use-network-data"
export type UseSwapProps = {
  mcNexusAddress: Hex | null
  mcNexus: MultichainSmartAccount | null
  sellAmount: bigint
  meeClient: MeeClient | null
}

export function useSwap({
  mcNexusAddress,
  mcNexus,
  sellAmount,
  meeClient
}: UseSwapProps) {
  const account = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<Hex | null>(null)
  const [success, setSuccess] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)

  const {
    sourceChain,
    destinationChain,
    inToken,
    outToken,
    uniswapRouter,
    mode
  } = useNetworkData()

  // biome-ignore lint/correctness/useExhaustiveDependencies: explanation
  const swap = useCallback(
    async (fusionQuote: GetFusionQuotePayload) => {
      if (!mcNexus || !fusionQuote || !meeClient) {
        throw new Error("Missing required parameters")
      }

      setIsLoading(true)
      setError(null)
      setHash(null)

      try {
        console.log({ fusionQuote })
        const { hash } = await meeClient.executeFusionQuote({ fusionQuote })

        setHash(hash)
        setSuccess(true)
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to execute swap")
        console.error("Swap error details:", err)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    },
    [mcNexus, meeClient, mode]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const getQuote = useCallback(async () => {
    if (
      !mcNexus ||
      !mcNexusAddress ||
      !account ||
      !account.address ||
      !sellAmount ||
      !meeClient
    ) {
      throw new Error("Missing required parameters")
    }

    setIsQuoting(true)
    setError(null)

    try {
      const trigger = {
        chainId: sourceChain.id,
        tokenAddress: inToken.addressOn(sourceChain.id),
        amount: sellAmount
      }

      const intent = mcNexus.build({
        type: "intent",
        data: {
          amount: sellAmount,
          mcToken: inToken,
          toChain: destinationChain,
          mode: "OPTIMISTIC"
        }
      })

      const approval = mcNexus.build({
        type: "approve",
        data: {
          amount: sellAmount,
          chainId: destinationChain.id,
          tokenAddress: inToken.addressOn(destinationChain.id),
          spender: uniswapRouter.addressOn(destinationChain.id)
        }
      })

      const swap = uniswapRouter.build({
        type: "exactInputSingle",
        data: {
          chainId: destinationChain.id,
          args: [
            {
              tokenIn: inToken.addressOn(destinationChain.id),
              tokenOut: outToken.addressOn(destinationChain.id),
              fee: 3000,
              recipient: account.address,
              // @ts-expect-error: deadline not expected
              deadline: BigInt(Math.floor(Date.now() / 1000) + 900),
              amountIn: safeMultiplier(sellAmount, 0.8), // Composability coming soon...
              amountOutMinimum: 1n,
              sqrtPriceLimitX96: 0n
            }
          ],
          // Complex userOps will often require more gas. All surpluses are returned to the users smart account in native token
          gasLimit: LARGE_DEFAULT_GAS_LIMIT * 2n
        }
      })

      const feeToken = {
        address: inToken.addressOn(sourceChain.id),
        chainId: sourceChain.id
      }

      const fusionQuote = await meeClient.getFusionQuote({
        trigger,
        instructions: [intent, approval, swap],
        feeToken
      })

      return fusionQuote
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to get quote")
      console.error("Quote error details:", err)
      setError(error)
      throw error
    } finally {
      setIsQuoting(false)
    }
  }, [
    uniswapRouter,
    mcNexusAddress,
    mcNexus,
    sellAmount,
    account,
    meeClient,
    inToken,
    outToken,
    sourceChain.id,
    destinationChain,
    mode
  ])

  const handleSwap = useCallback(
    async (fusionQuote: any) => {
      setIsLoading(true)
      setError(null)
      setHash(null)

      if (!meeClient) {
        throw new Error("MEE client is not initialized")
      }

      try {
        const { hash } = await meeClient.executeFusionQuote({ fusionQuote })
        setHash(hash)
        setSuccess(true)
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to execute swap")
        console.error("Swap error details:", err)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    },
    [meeClient]
  )

  return {
    swap,
    getQuote,
    isLoading,
    isQuoting,
    error,
    hash,
    success
  }
}
