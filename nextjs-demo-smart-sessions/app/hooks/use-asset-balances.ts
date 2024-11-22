import { useBalance, useBlockNumber } from "wagmi"
import { MOCK_USDC_ADDRESS, MOCK_WETH_ADDRESS } from "@/app/lib/constants"
import { formatUnits } from "viem"

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
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const {
    data: wethBalance,
    isLoading: isLoadingWeth,
    isError: isErrorWeth
  } = useBalance({
    address: address as `0x${string}`,
    token: MOCK_WETH_ADDRESS,
    blockNumber
  })

  const {
    data: usdcBalance,
    isLoading: isLoadingUsdc,
    isError: isErrorUsdc
  } = useBalance({
    address: address as `0x${string}`,
    token: MOCK_USDC_ADDRESS,
    blockNumber
  })

  return {
    wethBalance: wethBalance?.value ?? 0n,
    usdcBalance: usdcBalance?.value ?? 0n,
    wethFormatted: wethBalance
      ? formatUnits(wethBalance.value, wethBalance.decimals)
      : "0",
    usdcFormatted: usdcBalance
      ? formatUnits(usdcBalance.value, usdcBalance.decimals)
      : "0",
    blockNumber: blockNumber,
    isLoading: isLoadingWeth || isLoadingUsdc,
    isError: isErrorWeth || isErrorUsdc
  }
}
