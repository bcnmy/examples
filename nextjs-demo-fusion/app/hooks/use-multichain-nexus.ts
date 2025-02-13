import {
  type MultichainSmartAccount,
  toMultichainNexusAccount,
  createMeeClient,
  type MeeClient
} from "@biconomy/abstractjs-canary"
import { useEffect, useState } from "react"
import { custom, http, useAccount } from "wagmi"
import { baseSepolia, optimismSepolia } from "wagmi/chains"
import { type Address, createWalletClient } from "viem"

export function useMultichainNexus() {
  const [mcNexus, setMcNexus] = useState<MultichainSmartAccount | null>(null)
  const [mcNexusAddress, setMcNexusAddress] = useState<Address | null>(null)
  const [meeClient, setMeeClient] = useState<MeeClient | null>(null)
  const { address, chain, isConnected } = useAccount()

  useEffect(() => {
    if (!isConnected && mcNexus) {
      setMcNexus(null)
      setMcNexusAddress(null)
    }
  }, [isConnected, mcNexus])

  useEffect(() => {
    async function connect() {
      if (
        isConnected &&
        !!address &&
        !mcNexus &&
        !!global?.window?.ethereum &&
        chain?.id
      ) {
        const mcNexus = await toMultichainNexusAccount({
          chains: [optimismSepolia, baseSepolia],
          transports: [http(), http()],
          signer: createWalletClient({
            chain,
            account: address,
            transport: custom(global?.window?.ethereum ?? "")
          })
        })
        const meeClient = await createMeeClient({ account: mcNexus })
        setMcNexus(mcNexus)
        setMcNexusAddress(mcNexus.addressOn(chain.id, true))
        setMeeClient(meeClient)
      }
    }

    connect()
  }, [isConnected, address, chain, mcNexus])

  return {
    address,
    chain,
    isConnected,
    mcNexus,
    mcNexusAddress,
    meeClient
  }
}
