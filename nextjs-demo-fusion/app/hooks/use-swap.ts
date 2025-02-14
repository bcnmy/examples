import { useState, useCallback } from "react"
import type { Hex } from "viem"
import { baseSepolia, optimismSepolia } from "viem/chains"
import {
  type MeeClient,
  type MultichainSmartAccount,
  testnetMcFusion,
  testnetMcUniswapSwapRouter,
  testnetMcUSDC,
  safeMultiplier,
  LARGE_DEFAULT_GAS_LIMIT
} from "@biconomy/abstractjs-canary"
import { useAccount } from "wagmi"

const ROUTER_ADDRESS = testnetMcUniswapSwapRouter.addressOn(baseSepolia.id)
const TOKEN0_ADDRESS = testnetMcUSDC.addressOn(baseSepolia.id)
const TOKEN1_ADDRESS = testnetMcFusion.addressOn(baseSepolia.id)

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

  console.log({ sellAmount })

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
        tokenAddress: testnetMcUSDC.addressOn(optimismSepolia.id),
        amount: sellAmount
      }

      const intent = mcNexus.build({
        type: "intent",
        data: {
          amount: sellAmount,
          mcToken: testnetMcUSDC,
          toChain: baseSepolia,
          mode: "OPTIMISTIC"
        }
      })

      const approval = mcNexus.build({
        type: "approve",
        data: {
          amount: sellAmount,
          chainId: baseSepolia.id,
          tokenAddress: TOKEN0_ADDRESS,
          spender: ROUTER_ADDRESS
        }
      })

      const swap = testnetMcUniswapSwapRouter.build({
        type: "exactInputSingle",
        data: {
          chainId: baseSepolia.id,
          args: [
            {
              tokenIn: TOKEN0_ADDRESS,
              tokenOut: TOKEN1_ADDRESS,
              fee: 3000,
              recipient: mcNexus.addressOn(baseSepolia.id, true),
              // @ts-expect-error: deadline is not a required field
              deadline: BigInt(Math.floor(Date.now() / 1000) + 900),
              amountIn: sellAmount,
              amountOutMinimum: 0n,
              sqrtPriceLimitX96: 0n
            }
          ],
          // Complex userOps will often require more gas. All surpluses are returned to the users smart account in native token
          gasLimit: LARGE_DEFAULT_GAS_LIMIT * 2n
        }
      })

      const withdraw = mcNexus.build({
        type: "withdrawal",
        data: {
          amount: safeMultiplier(sellAmount, 0.95), // Composability coming soon...
          chainId: baseSepolia.id,
          tokenAddress: TOKEN1_ADDRESS
        }
      })

      const feeToken = {
        address: testnetMcUSDC.addressOn(optimismSepolia.id),
        chainId: optimismSepolia.id
      }

      const fusionQuote = await meeClient.getFusionQuote({
        trigger,
        // @ts-expect-error: instructions is not a required field
        instructions: [intent, approval, swap, withdraw],
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
  }, [mcNexusAddress, mcNexus, sellAmount, account, meeClient])

  return {
    swap,
    isLoading,
    error,
    hash,
    success
  }
}
