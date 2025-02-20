import { useEffect, useState } from "react"
import type { Address, Chain } from "viem"
import { useBlockNumber } from "wagmi"
import { createPublicClient, erc20Abi, http } from "viem"
import type { MultichainToken } from "@biconomy/abstractjs-canary"
import { useNetworkStore } from "../store/network-store"

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
  decimals: number
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
  const [decimals, setDecimals] = useState<number>(18)
  const { mode } = useNetworkStore()
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

        const [rawBalance, symbol, decimals] = await Promise.all([
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
          }),
          publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "decimals"
          })
        ])

        // const symbol = await mcToken.deploymentOn(chain.id).symbol()

        setSymbol(symbol)
        setBalance(rawBalance)
        setDecimals(decimals)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch balance")
        )
        setBalance(undefined)
      }
    }

    fetchBalance()
  }, [address, token, bNum, chain, mode])

  return {
    balance,
    isLoading: balance === undefined,
    error,
    chain,
    symbol,
    decimals
  }
}
