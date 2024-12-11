import { useMarketStore } from "@/app/stores/marketStore"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "./button"

export function CustomConnectButton() {
  const { isBullish } =
    useMarketStore()

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal }: any) => {
        const connected = mounted && account && chain

        return (
          <Button
            onClick={openConnectModal}
            variant={isBullish ? "bullish" : "bearish"}
            className="w-full h-full transform transition-all duration-500 
          hover:scale-110 hover:shadow-lg hover:shadow-current"
          >
            <span className="text-lg">Connect Wallet</span>
          </Button>
        )
      }}
    </ConnectButton.Custom>
  )
}
