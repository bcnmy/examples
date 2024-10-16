import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      injected(),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
