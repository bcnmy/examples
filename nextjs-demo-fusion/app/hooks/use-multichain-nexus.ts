import {
  type MultichainSmartAccount,
  toMultichainNexusAccount,
  createMeeClient,
  type MeeClient
} from "@biconomy/abstractjs"
import { useEffect, useState } from "react"
import { custom, http, useAccount, useConnections, useWalletClient } from "wagmi"
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


        const sourceTransport = http(sourceChain.id === 10 ? "https://opt-mainnet.g.alchemy.com/v2/sW0MVUHI7kUFIKTmY9HV9G8o3tlffvv4" : undefined)
        const destinationTransport = http(destinationChain.id === 8453 ? "https://base-mainnet.g.alchemy.com/v2/sW0MVUHI7kUFIKTmY9HV9G8o3tlffvv4" : undefined)


        const signer = createWalletClient({
          chain,
          transport: custom(global?.window?.ethereum)
        })

        const mcNexus = await toMultichainNexusAccount({
          chains: [sourceChain, destinationChain],
          transports: [sourceTransport, destinationTransport],
          signer
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
    mode,
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
