import React from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Loader2 } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import type { Trade } from "@/app/stores/marketStore"

interface ActiveTraderProps {
  currentTrade: Trade | null
}

export function ActiveTrader({ currentTrade }: ActiveTraderProps) {
  if (!currentTrade || currentTrade.status === "idle") return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <Card className="bg-black/80 border-white/10">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-medium">Auto-Trading Active</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <StatusBadge status={currentTrade.status} />
            <span className="text-sm text-white/60">
              {currentTrade.isBullish ? "Buying" : "Selling"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
