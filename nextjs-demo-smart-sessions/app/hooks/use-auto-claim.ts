import { useEffect, useRef } from "react"
import type { Address } from "viem/accounts"
import { MOCK_USDC_ADDRESS } from "../lib/constants"
import { useBalance } from "wagmi"
import { MOCK_WETH_ADDRESS } from "../lib/constants"
import { useFaucet } from "./use-faucet"
import { useMarketStore } from "../stores/marketStore"
import { useAssetBalances } from "./use-asset-balances"

interface UseAutoClaimResult {
  shouldAutoClaim: boolean
}

export function useAutoClaim(): UseAutoClaimResult {
  const { nexusAddress } = useMarketStore()
  const { claimTokens } = useFaucet()

  const { usdcBalance, wethBalance } = useAssetBalances(nexusAddress)

  const hasZeroBalance = usdcBalance <= 0n || wethBalance <= 0n

  const hasClaimedRef = useRef(false)
  const previousAddressRef = useRef<Address>()

  // Reset claim state when address changes
  useEffect(() => {
    if (nexusAddress !== previousAddressRef.current) {
      hasClaimedRef.current = false
      previousAddressRef.current = nexusAddress
    }
  }, [nexusAddress])

  // Reset claim state when disconnected
  useEffect(() => {
    if (!nexusAddress) {
      hasClaimedRef.current = false
      previousAddressRef.current = undefined
    }
  }, [nexusAddress])

  // Determine if user should be able to claim
  const shouldAutoClaim = Boolean(
    nexusAddress && !hasClaimedRef.current && hasZeroBalance
  )

  // Handle auto-claiming
  useEffect(() => {
    if (shouldAutoClaim && nexusAddress) {
      hasClaimedRef.current = true
      console.log("Claiming tokens...")
      claimTokens(nexusAddress)
    }
  }, [nexusAddress, claimTokens, shouldAutoClaim])

  return {
    shouldAutoClaim
  }
}
