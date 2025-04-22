import { createConfig, http } from "wagmi"
import { optimism, optimismSepolia } from "wagmi/chains"

export const testnetConfig = createConfig({
  chains: [optimismSepolia],
  transports: {
    [optimismSepolia.id]: http()
  }
})

export const mainnetConfig = createConfig({
  chains: [optimism],
  transports: {
    [optimism.id]: http("https://opt-mainnet.g.alchemy.com/v2/2pp0SJKFL7dddzo8pMz4kBvIfUJVtGd4")
  }
})
