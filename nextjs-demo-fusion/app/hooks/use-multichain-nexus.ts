import {
  type MultichainSmartAccount,
  toMultichainNexusAccount,
  createMeeClient,
  type MeeClient
} from "@biconomy/abstractjs"
import { useEffect, useState } from "react"
import { custom, http, useAccount } from "wagmi"
import { type Address, createWalletClient } from "viem"
import { useNetworkData } from "./use-network-data"
export function useMultichainNexus() {
  const { sourceChain, destinationChain, mode } = useNetworkData()
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
          chains: [sourceChain, destinationChain],
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
  }, [
    isConnected,
    address,
    chain,
    mcNexus,
    sourceChain,
    destinationChain,
    mode
  ])

  return {
    address,
    chain,
    isConnected,
    mcNexus,
    mcNexusAddress,
    meeClient
  }
}
