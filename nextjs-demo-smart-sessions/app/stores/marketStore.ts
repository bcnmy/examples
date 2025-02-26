import { create } from "zustand"
import { persist } from "zustand/middleware"
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
  toNexusAccount,
  type NexusClient
} from "@biconomy/abstractjs"
import { uuid } from "../lib/utils"

export type Trade = {
  id: string // unique identifier
  timestamp: number
  isBullish: boolean
  status: "preparing" | "trading" | "submitted" | "confirmed" | "error" | "idle"
  userOpHash?: string
  transactionHash?: string
  error?: string
  amount: string
  price?: string
}

type TradeTracking = {
  trades: Trade[]
  pendingTrades: Map<string, Trade> // userOpHash -> Trade
}

type MarketState = {
  isBullish: boolean
  nexusClient: NexusClient | null
  nexusAddress: Address | undefined
  sessionData: string | null
  marketStatus: "active" | "inactive"
  tracking: TradeTracking
  // Actions
  setIsBullish: (state: boolean) => void
  initializeNexusClient: (address: Address, chain: Chain) => Promise<void>
  resetNexusClient: () => void
  setSessionData: (data: string | null) => void
  setMarketStatus: (status: "active" | "inactive") => void
  // Trade tracking actions
  addTrade: (trade: Omit<Trade, "id" | "timestamp">) => string
  updateTrade: (id: string, update: Partial<Trade>) => void
  linkUserOpToTx: (userOpHash: string, txHash: string) => void
  getPendingTrade: (userOpHash: string) => Trade | undefined
  getTradeByTxHash: (txHash: string) => Trade | undefined
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      isBullish: true,
      nexusClient: null as NexusClient | null,
      nexusAddress: undefined as Address | undefined,
      sessionData: null,
      marketStatus: "inactive",
      tracking: {
        trades: [] as Trade[],
        pendingTrades: new Map<string, Trade>()
      },

      // Existing actions
      setIsBullish: (state) => set({ isBullish: state }),
      initializeNexusClient: async (address, chain) => {
        if (!process.env.NEXT_PUBLIC_PAYMASTER_URL) {
          throw new Error("NEXT_PUBLIC_PAYMASTER_URL is not set")
        }
        if (!global?.window?.ethereum || !address || !chain) return

        try {
          const signer = createWalletClient({
            chain,
            account: address,
            transport: custom(global?.window?.ethereum ?? "")
          })

          const nexusAccount = await toNexusAccount({
            signer,
            transport: http(),
            chain
          })

          const nexusClient = createNexusClient({
            account: nexusAccount,
            transport: http(
              "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
            ),
            paymaster: createBicoPaymasterClient({
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
      setSessionData: (data) => set({ sessionData: data }),
      setMarketStatus: (status) => set({ marketStatus: status }),

      // New trade tracking actions
      addTrade: (trade) => {
        const id = uuid()
        const newTrade: Trade = {
          ...trade,
          id,
          timestamp: Date.now()
        }

        set((state) => ({
          tracking: {
            ...state.tracking,
            trades: [newTrade, ...state.tracking.trades],
            pendingTrades: trade.userOpHash
              ? state.tracking.pendingTrades.set(trade.userOpHash, newTrade)
              : state.tracking.pendingTrades
          }
        }))

        return id
      },

      updateTrade: (id, update) => {
        set((state) => {
          const trades = state.tracking.trades.map((t) =>
            t.id === id ? { ...t, ...update } : t
          )

          // Update pending trades if necessary
          const pendingTrades = new Map(state.tracking.pendingTrades)
          for (const [hash, trade] of pendingTrades) {
            if (trade.id === id) {
              pendingTrades.set(hash, { ...trade, ...update })
            }
          }

          return {
            tracking: {
              ...state.tracking,
              trades,
              pendingTrades
            }
          }
        })
      },

      linkUserOpToTx: (userOpHash, txHash) => {
        const state = get()
        const pendingTrade = state.tracking.pendingTrades.get(userOpHash)

        if (pendingTrade) {
          state.updateTrade(pendingTrade.id, {
            transactionHash: txHash,
            status: "submitted"
          })
        }
      },

      getPendingTrade: (userOpHash) => {
        return get().tracking.pendingTrades.get(userOpHash)
      },

      getTradeByTxHash: (txHash) => {
        return get().tracking.trades.find((t) => t.transactionHash === txHash)
      }
    }),
    {
      name: "market-storage",
      partialize: (state) => ({
        tracking: {
          trades: state.tracking.trades
        }
      })
    }
  )
)
