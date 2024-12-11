import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/app/components/ui/sheet"
import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Bot } from "lucide-react"
import { useMarketStore } from "@/app/stores/marketStore"
import { AccountLink } from "./AccountLink"
import { useGrantPermissions } from "@/app/hooks/use-grant-permission"
import { PermissionStatus } from "./PermissionStatus"
import { useAssetBalances } from "@/app/hooks/use-asset-balances"

type TradingTrayProps = {
  isTrayOpen: boolean
  onTrayOpenChange: (open: boolean) => void
  isBullish: boolean
}

export function TradingTray({
  isTrayOpen,
  onTrayOpenChange,
  isBullish
}: TradingTrayProps) {
  const { nexusAddress } = useMarketStore()
  const { status, grantTradePermission, userOpHash, transactionHash } =
    useGrantPermissions()

  const { usdcFormatted, wethFormatted } = useAssetBalances(nexusAddress)

  // Determine which asset we're trading with based on market state
  const tradingAsset = isBullish ? "USDC" : "WETH"
  const availableBalance = isBullish ? usdcFormatted : wethFormatted

  const [showPermissionStatus, setShowPermissionStatus] = useState(true)

  return (
    <>
      <Button
        onClick={() => onTrayOpenChange(true)}
        variant={isBullish ? "bullish" : "bearish"}
        className="w-full h-full transform transition-all duration-500 
          hover:scale-110 hover:rotate-1 hover:shadow-lg
          hover:shadow-current"
      >
        <Bot className="mr-2 h-4 w-4" />
        <span className="text-lg">Auto Trade</span>
      </Button>

      <Sheet open={isTrayOpen} onOpenChange={onTrayOpenChange}>
        <SheetContent
          className={`border-l backdrop-blur-sm
          ${
            isBullish
              ? "bg-emerald-950/50 border-emerald-500/70"
              : "bg-bearish-dark/50 border-bearish/70"
          }`}
        >
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Automated Trading Bot
            </SheetTitle>
            <p className="text-white/60 text-sm">
              This bot will automatically {isBullish ? "buy WETH" : "sell WETH"}{" "}
              using all available
              {isBullish ? " USDC" : " WETH"} from your smart account (
              {availableBalance}
              {isBullish ? " USDC" : " WETH"})
            </p>
          </SheetHeader>

          <div className="flex flex-col gap-6 mt-6">
            <div className="space-y-4 w-full justify-center">
              <AccountLink />
            </div>
            <div className="space-y-4 w-full">
              <Button
                variant={isBullish ? "bullish" : "bearish"}
                className="w-full"
                onClick={grantTradePermission}
                disabled={status === "enabling" || status === "granting"}
              >
                {status === "idle" &&
                  `Start Auto-Trading ${isBullish ? "Long" : "Short"}`}
                {(status === "enabling" || status === "granting") &&
                  "Setting up..."}
                {status === "granted" && "Ready to Trade"}
                {status === "error" && "Try Again"}
              </Button>
            </div>
          </div>

          {showPermissionStatus && (
            <PermissionStatus
              status={status}
              userOpHash={userOpHash}
              transactionHash={transactionHash}
              onClose={() => setShowPermissionStatus(false)}
            />
          )}

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Current Market Bias:</span>
              <span className={isBullish ? "text-emerald-500" : "text-bearish"}>
                {isBullish ? "BULLISH" : "BEARISH"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-white/60">Available {tradingAsset}:</span>
              <span className="text-white">
                {availableBalance} {tradingAsset}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
