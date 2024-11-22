import { create } from "zustand"
import {
  createWalletClient,
  custom,
  http,
  type Address,
  type Chain
} from "viem"
import {
  createBicoPaymasterClient,
  createNexusClient,
  type NexusClient
} from "@biconomy/sdk"

type MarketState = {
  isBullish: boolean
  nexusClient: NexusClient | null
  nexusAddress: Address | undefined
  setIsBullish: (state: boolean) => void
  initializeNexusClient: (address: Address, chain: Chain) => Promise<void>
  resetNexusClient: () => void
  sessionData: string | null
  setSessionData: (data: string | null) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  isBullish: true,
  nexusClient: null,
  nexusAddress: undefined,
  sessionData: null,
  setIsBullish: (state) => set({ isBullish: state }),
  initializeNexusClient: async (address, chain) => {
    if (!process.env.NEXT_PUBLIC_PAYMASTER_URL) {
      throw new Error("NEXT_PUBLIC_PAYMASTER_URL is not set")
    }
    if (!global?.window?.ethereum || !address || !chain) return

    const newSigner = createWalletClient({
      chain,
      transport: custom(global?.window.ethereum!)
    }) as any

    try {
      const nexusClient = await createNexusClient({
        // @ts-ignore
        chain,
        // @ts-ignore
        transport: http(),
        // @ts-ignore
        bundlerTransport: http(
          "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
        ),
        signer: newSigner,
        paymaster: createBicoPaymasterClient({
          // @ts-ignore
          transport: http(process.env.NEXT_PUBLIC_PAYMASTER_URL!)
        })
      })

      const nexusAddress = await nexusClient?.account?.getAddress()

      set({ nexusClient, nexusAddress })
    } catch (error) {
      console.error("Failed to initialize NexusClient:", error)
      set({ nexusClient: null, nexusAddress: undefined })
    }
  },

  resetNexusClient: () => {
    set({ nexusClient: null, nexusAddress: undefined })
  },
  setSessionData: (data) => set({ sessionData: data })
}))
