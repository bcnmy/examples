import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "./sheet"
import { ScrollArea } from "./scroll-area"
import { Badge } from "./badge"
import {
  ExternalLink,
  AlertCircle,
  StopCircle,
  History,
  Trash2
} from "lucide-react"
import { useMarketStore } from "@/app/stores/marketStore"
import { StatusBadge } from "./StatusBadge"
import { Button } from "./button"
import { useState, useRef } from "react"
import { HowItWasBuilt } from "./HowItWasBuilt"

type TradeHistoryProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TradeHistory({ isOpen, onOpenChange }: TradeHistoryProps) {
  const {
    nexusAddress,
    tracking: { trades },
    setMarketStatus
  } = useMarketStore()

  const isBullish = useMarketStore((state) => state.isBullish)
  // const clearTrades = useMarketStore((state) => state)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showHowItWasBuilt, setShowHowItWasBuilt] = useState(false)

  const deactivateAutoTrade = () => {
    setShowHowItWasBuilt(true)
  }

  const handleConfirmDeactivate = () => {
    // Original deactivation logic
    localStorage.removeItem(`session_${nexusAddress}`)
    setMarketStatus("inactive")
    onOpenChange(false)
  }

  return (
    <>
      <Button
        onClick={() => onOpenChange(true)}
        variant={isBullish ? "bullish" : "bearish"}
        className="w-full h-full transform transition-all duration-500 
          hover:scale-110 hover:rotate-1 hover:shadow-lg
          hover:shadow-current"
      >
        <StopCircle className="mr-2 h-4 w-4" />
        <span className="text-lg">View Trades</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
              <History className="h-5 w-5" />
              Trade History
              <Badge
                variant="outline"
                className="text-xs bg-white/5 ml-2 font-medium text-white/80"
              >
                {trades.length} trades
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant={isBullish ? "bullish" : "bearish"}
                className="w-full mt-4"
                onClick={deactivateAutoTrade}
                disabled={trades.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Stop Auto-Trading
              </Button>
            </div>
          </div>

          <HowItWasBuilt
            open={showHowItWasBuilt}
            onOpenChange={setShowHowItWasBuilt}
            onConfirm={handleConfirmDeactivate}
            showTrigger={false}
          />

          <ScrollArea
            ref={scrollAreaRef}
            className="mt-6 w-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-12rem)]"
          >
            <div className="space-y-3 max-w-full overflow-x-hidden">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 flex gap-2 w-full"
                >
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={trade.isBullish ? "default" : "destructive"}
                        className="font-medium"
                      >
                        {trade.isBullish ? "BUY" : "SELL"}
                      </Badge>
                      <StatusBadge status={trade.status} />
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Amount:</span>
                        <span className="font-medium text-white">
                          {trade.amount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/60">{trade.timestamp}</span>
                        <div className="flex items-center gap-2">
                          {trade.status === "confirmed" ? (
                            <a
                              href={`https://sepolia.basescan.org/tx/${trade.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <div className="flex items-center gap-1 text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              <span
                                className="max-w-[200px] truncate"
                                title={trade.error}
                              >
                                {trade.error?.includes("AA24 signature error")
                                  ? "Invalid signature"
                                  : trade.error?.includes(
                                        "Transaction reverted"
                                      )
                                    ? "Transaction reverted"
                                    : "Transaction failed"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <SheetFooter className="mt-auto pt-4 border-t border-white/10"></SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
