import { create } from 'zustand'

type MarketState = {
  isBullish: boolean | null
  setIsBullish: (state: boolean) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  isBullish: null,
  setIsBullish: (state) => set({ isBullish: state }),
})) 