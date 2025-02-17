import { useEffect, useState } from "react"
import type { Address, Chain } from "viem"
import { useBlockNumber } from "wagmi"
import { createPublicClient, erc20Abi, http } from "viem"
import type { MultichainToken } from "@biconomy/abstractjs"

interface UseERC20BalanceProps {
  symbol: string
  address?: Address
  mcToken: MultichainToken
  chain: Chain
}

export type BalancePayload = {
  balance: bigint | undefined
  isLoading: boolean
  error: Error | null
  chain: Chain
  symbol: string
}

export function useERC20Balance({
  symbol,
  address,
  mcToken,
  chain
}: UseERC20BalanceProps) {
  const token = mcToken?.addressOn(chain.id)
  const [balance, setBalance] = useState<bigint | undefined>()
  const [error, setError] = useState<Error | null>(null)
  const { data: bNum } = useBlockNumber({ watch: true })

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    async function fetchBalance() {
      if (!address || !token) {
        setBalance(undefined)
        return
      }

      try {
        const rawBalance = await createPublicClient({
          chain,
          transport: http()
        }).readContract({
          address: token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address]
        })

        setBalance(rawBalance)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch balance")
        )
        setBalance(undefined)
      }
    }

    fetchBalance()
  }, [address, token, bNum, chain])

  return {
    balance,
    isLoading: balance === undefined,
    error,
    chain,
    symbol
  }
}
