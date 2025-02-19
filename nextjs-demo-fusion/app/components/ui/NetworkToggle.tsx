import { Tabs, TabsList, TabsTrigger } from "./tabs"
import { useNetworkStore } from "@/app/store/network-store"
import { cn } from "../../lib/utils"

const networkVariants = {
  mainnet: {
    color: "bg-green-500",
    ring: "ring-green-500"
  },
  testnet: {
    color: "bg-yellow-500",
    ring: "ring-yellow-500"
  }
} as const

export function NetworkToggle() {
  const { mode, toggleMode } = useNetworkStore()

  return (
    <Tabs value={mode} onValueChange={toggleMode} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        {(
          Object.keys(networkVariants) as Array<keyof typeof networkVariants>
        ).map((network) => (
          <TabsTrigger key={network} value={network} className="relative">
            <div className="flex items-center gap-3">
              <span>{network.charAt(0).toUpperCase() + network.slice(1)}</span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
