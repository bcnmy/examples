import { useEffect, useState } from "react"
import type { Address, Chain } from "viem"
import { useBlockNumber } from "wagmi"
import { createPublicClient, erc20Abi, http } from "viem"
import type { MultichainToken } from "@biconomy/abstractjs-canary"

interface UseERC20BalanceProps {
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
  address,
  mcToken,
  chain
}: UseERC20BalanceProps) {
  const token = mcToken?.addressOn(chain.id)
  const [balance, setBalance] = useState<bigint | undefined>()
  const [error, setError] = useState<Error | null>(null)
  const { data: bNum } = useBlockNumber({ watch: true })
  const [symbol, setSymbol] = useState<string>("UNK")

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    async function fetchBalance() {
      if (!address || !token) {
        setBalance(undefined)
        return
      }

      try {
        const publicClient = createPublicClient({
          chain,
          transport: http()
        })

        const [rawBalance, symbol] = await Promise.all([
          publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address]
          }),
          publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "symbol"
          })
        ])

        // const symbol = await mcToken.deploymentOn(chain.id).symbol()

        setSymbol(symbol)
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
