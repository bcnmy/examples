import { useBalance, useBlockNumber } from "wagmi"
import { MOCK_USDC_ADDRESS, MOCK_WETH_ADDRESS } from "@/app/lib/constants"
import { formatUnits } from "viem"
import { useEffect } from "react"

interface AssetBalances {
  wethBalance: bigint
  usdcBalance: bigint
  wethFormatted: string
  usdcFormatted: string
  blockNumber?: bigint
  isLoading: boolean
  isError: boolean
}

export function useAssetBalances(address?: string): AssetBalances {
  const { data: blockNumber } = useBlockNumber({
    watch: true
  })

  const {
    data: wethBalance,
    isLoading: isLoadingWeth,
    isError: isErrorWeth,
    refetch: refetchWeth
  } = useBalance({
    address: address as `0x${string}`,
    token: MOCK_WETH_ADDRESS
  })

  const {
    data: usdcBalance,
    isLoading: isLoadingUsdc,
    isError: isErrorUsdc,
    refetch: refetchUsdc
  } = useBalance({
    address: address as `0x${string}`,
    token: MOCK_USDC_ADDRESS
  })

  // Force refetch both balances when block number changes
  useEffect(() => {
    if (blockNumber) {
      refetchWeth()
      refetchUsdc()
    }
  }, [blockNumber, refetchWeth, refetchUsdc])

  return {
    wethBalance: wethBalance?.value ?? 0n,
    usdcBalance: usdcBalance?.value ?? 0n,
    wethFormatted: wethBalance
      ? formatUnits(wethBalance.value, wethBalance.decimals)
      : "0",
    usdcFormatted: usdcBalance
      ? formatUnits(usdcBalance.value, usdcBalance.decimals)
      : "0",
    blockNumber,
    isLoading: isLoadingWeth || isLoadingUsdc,
    isError: isErrorWeth || isErrorUsdc
  }
}
