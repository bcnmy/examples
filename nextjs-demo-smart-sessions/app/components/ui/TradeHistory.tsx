import React from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Badge } from "@/app/components/ui/badge"
import { ExternalLink, AlertCircle } from "lucide-react"
import { useMarketStore } from "@/app/stores/marketStore"
import { StatusBadge } from "./StatusBadge"

export function TradeHistory() {
  const trades = useMarketStore((state) => state.tracking.trades)

  return (
    <Card className="fixed bottom-4 left-4 w-80 bg-black/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          Trade History
          <Badge variant="outline" className="text-xs">
            {trades.length}
          </Badge>
        </h3>
        <ScrollArea className="h-[200px]">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="mb-3 last:mb-0 p-2 rounded-lg bg-black/20"
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant={trade.isBullish ? "default" : "destructive"}>
                  {trade.isBullish ? "BUY" : "SELL"}
                </Badge>
                <StatusBadge status={trade.status} />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Amount:</span>
                  <span>{trade.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </span>
                  {trade.status === "confirmed" && trade.transactionHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${trade.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {trade.status === "error" && trade.error && (
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>{trade.error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
