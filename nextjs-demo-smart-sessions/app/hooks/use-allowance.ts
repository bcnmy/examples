import { useCallback, useEffect, useState, useMemo } from "react"
import { createPublicClient, http, erc20Abi, type Hex } from "viem"
import { baseSepolia } from "viem/chains"
import {
  MOCK_POOL_ADDRESS,
  MOCK_USDC_ADDRESS,
  MOCK_WETH_ADDRESS
} from "@/app/lib/constants"

export function useAllowance(nexusAccountAddress?: Hex) {
  const [allowances, setAllowances] = useState<{
    usdc: bigint
    weth: bigint
  }>({
    usdc: 0n,
    weth: 0n
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Memoize the public client
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http()
      }),
    []
  ) // Empty dependency array as these values never change

  const checkAllowances = useCallback(async () => {
    if (!nexusAccountAddress) return

    try {
      setIsLoading(true)
      setError(null)

      const [wethAllowance, usdcAllowance] = await Promise.all([
        publicClient.readContract({
          address: MOCK_WETH_ADDRESS,
          abi: erc20Abi,
          functionName: "allowance",
          args: [nexusAccountAddress ?? "0x", MOCK_POOL_ADDRESS]
        }),
        publicClient.readContract({
          address: MOCK_USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "allowance",
          args: [nexusAccountAddress ?? "0x", MOCK_POOL_ADDRESS]
        })
      ])

      setAllowances({
        weth: wethAllowance,
        usdc: usdcAllowance
      })
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to check allowances")
      )
    } finally {
      setIsLoading(false)
    }
  }, [nexusAccountAddress, publicClient]) // Only depend on nexusAccountAddress and memoized publicClient

  useEffect(() => {
    // Only check allowances if we have an address
    if (nexusAccountAddress) {
      checkAllowances()
    }
  }, [checkAllowances, nexusAccountAddress]) // checkAllowances already includes all necessary dependencies

  return {
    allowances,
    isLoading,
    error,
    refetch: checkAllowances
  }
}
