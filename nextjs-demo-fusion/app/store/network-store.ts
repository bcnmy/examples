import { create } from "zustand"

type NetworkMode = "mainnet" | "testnet"

interface NetworkState {
  mode: NetworkMode
  toggleMode: () => void
}

// Get initial mode from localStorage or default to testnet
const getInitialMode = (): NetworkMode => {
  const stored = localStorage?.getItem("network-mode")
  return stored === "mainnet" || stored === "testnet" ? stored : "testnet"
}

export const useNetworkStore = create<NetworkState>((set) => ({
  mode: getInitialMode(),
  toggleMode: () =>
    set((state) => {
      const newMode = state.mode === "testnet" ? "mainnet" : "testnet"
      localStorage.setItem("network-mode", newMode)
      return { mode: newMode }
    })
}))
