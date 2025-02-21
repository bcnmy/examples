import { create } from "zustand"

type NetworkMode = "mainnet" | "testnet"

interface NetworkState {
  mode: NetworkMode
  toggleMode: () => void
}

// Get initial mode from localStorage or default to testnet
const getInitialMode = (): NetworkMode => {
  if (typeof window !== "undefined") {
    const stored = localStorage?.getItem("network-mode")
    return stored === "mainnet" || stored === "testnet" ? stored : "testnet"
  }
  return "mainnet"
}

export const useNetworkStore = create<NetworkState>((set) => ({
  mode: getInitialMode(),
  toggleMode: () =>
    set((state) => {
      if (typeof window !== "undefined") {
        const newMode = state.mode === "testnet" ? "mainnet" : "testnet"
        localStorage.setItem("network-mode", newMode)
        return { mode: newMode }
      }
      return state
    })
}))
