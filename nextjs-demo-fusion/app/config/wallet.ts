import { createConfig, http } from "wagmi"
import { optimismSepolia } from "wagmi/chains"

export const config = createConfig({
  chains: [optimismSepolia],
  transports: {
    [optimismSepolia.id]: http()
  }
})
