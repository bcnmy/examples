import { useState, useCallback } from "react"
import type { Hex } from "viem"
import { baseSepolia, optimismSepolia } from "viem/chains"
import {
  type MeeClient,
  type MultichainSmartAccount,
  safeMultiplier,
  LARGE_DEFAULT_GAS_LIMIT
} from "@biconomy/abstractjs"
import { useAccount } from "wagmi"
import { mcUSDC } from "../config/USDC"
import { mcFusion } from "../config/fusion"
import { uniswapSwapRouter } from "../config/uniswapRouter"

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

  const usdc = mcUSDC.addressOn(baseSepolia.id)
  const fuse = mcFusion.addressOn(baseSepolia.id)

  const swap = useCallback(async () => {
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

    setIsLoading(true)
    setError(null)
    setHash(null)

    try {
      const trigger = {
        chainId: optimismSepolia.id,
        tokenAddress: mcUSDC.addressOn(optimismSepolia.id),
        amount: sellAmount
      }

      const intent = mcNexus.build({
        type: "intent",
        data: {
          amount: sellAmount,
          mcToken: mcUSDC,
          toChain: baseSepolia,
          mode: "OPTIMISTIC"
        }
      })

      const approval = mcNexus.build({
        type: "approve",
        data: {
          amount: sellAmount,
          chainId: baseSepolia.id,
          tokenAddress: usdc,
          spender: uniswapSwapRouter.addressOn(baseSepolia.id)
        }
      })

      const swap = uniswapSwapRouter.build({
        type: "exactInputSingle",
        data: {
          chainId: baseSepolia.id,
          args: [
            {
              tokenIn: usdc,
              tokenOut: fuse,
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

      const approveAndSwap = mcNexus.build({
        type: "batch",
        data: {
          instructions: [approval, swap]
        }
      })

      const feeToken = {
        address: mcUSDC.addressOn(optimismSepolia.id),
        chainId: optimismSepolia.id
      }

      const fusionQuote = await meeClient.getFusionQuote({
        trigger,
        instructions: [intent, approveAndSwap],
        feeToken
      })

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
  }, [mcNexusAddress, mcNexus, sellAmount, account, meeClient, usdc, fuse])

  return {
    swap,
    isLoading,
    error,
    hash,
    success
  }
}
