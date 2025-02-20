import type { BalancePayload } from "../hooks/use-erc20-balance"
import { formatUnits } from "viem"
import { Badge } from "./ui/badge"

export type TokenBalanceParameters = {
  balances: BalancePayload[]
}

export function TokenBalance({ balances }: TokenBalanceParameters) {
  return (
    <div className="flex gap-2">
      {balances.map(({ balance, chain, symbol, decimals }) => {
        return (
          <Badge
            key={`${chain.id}-${symbol}-${balance}`}
            variant="outline"
            className="animate-pulse-once"
          >
            {(+formatUnits(balance ?? 0n, decimals)).toFixed(4)}{" "}
            {symbol.substring(0, 4)}
          </Badge>
        )
      })}
    </div>
  )
}
