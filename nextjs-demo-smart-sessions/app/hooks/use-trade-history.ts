import { create } from "zustand"

type Trade = {
  timestamp: number
  isBullish: boolean
  status: string
  transactionHash?: string
  userOpHash?: string
  error?: string
}

type TradeHistoryStore = {
  trades: Trade[]
  addTrade: (trade: Trade) => void
  clear: () => void
}

const useTradeHistoryStore = create<TradeHistoryStore>((set) => ({
  trades: [],
  addTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades].slice(0, 50) // Keep last 50 trades
    })),
  clear: () => set({ trades: [] })
}))

export function useTradeHistory() {
  const { trades, addTrade, clear } = useTradeHistoryStore()

  // Subscribe to trade state changes
  //   useEffect(() => {
  //     const unsubscribe = useAutoTrade.subscribe((state) => {
  //       if (state.status !== "idle") {
  //         addTrade({
  //           timestamp: Date.now(),
  //           isBullish: state.isBullish,
  //           status: state.status,
  //           transactionHash: state.transactionHash,
  //           userOpHash: state.userOpHash,
  //           error: state.error
  //         })
  //       }
  //     })

  //     return () => unsubscribe()
  //   }, [])

  return { trades, clear }
}
