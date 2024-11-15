import type {  UseBalancesPayload } from "@/app/hooks/use-balances";
import { useState } from "react";

interface TradingTrayProps {
  isTrayOpen: boolean;
  isBullish: boolean;
  tradeAmount: string;
  onTradeAmountChange: (value: string) => void;
  onTrade: () => void;
  balances: UseBalancesPayload;
  onMaxClick: () => void;
}

export function TradingTray({ 
  isTrayOpen, 
  isBullish, 
  tradeAmount, 
  onTradeAmountChange, 
  onTrade, 
  balances
}: TradingTrayProps) {

  const [maxTradeAmount, setMaxTradeAmount] = useState("0")

  const onMaxClick = () => {
    setMaxTradeAmount(isBullish ? balances.usdcBalance : balances.wethBalance)
  }


  if (balances.isLoading) return null

  return (
    <div className={`absolute left-0 right-0 overflow-hidden transition-all duration-500 ease-in-out z-10
      ${isTrayOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'}
    `}>
      <div className={`p-4 rounded-lg backdrop-blur-sm border-2 relative
        ${isBullish 
          ? 'bg-emerald-950/50 border-emerald-500/70' 
          : 'bg-red-950/50 border-red-500/70'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
          <label className="text-white text-sm">
            Trade Amount ({isBullish ? 'USDC' : 'ETH'})
          </label>
          <span className="text-white/70 text-sm">
            Balance: {balances.usdcBalance} {isBullish ? 'USDC' : 'ETH'}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => onTradeAmountChange(e.target.value)}
              placeholder="Enter amount..."
              className="w-full bg-black/30 text-white px-3 py-2 rounded-lg 
                border-2 border-white/20 focus:outline-none focus:border-white/40"
            />
            <button
              type="button"
              onClick={onMaxClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 
                text-white/70 hover:text-white text-sm px-2 py-1"
            >
              MAX
            </button>
          </div>
          <button
            type="button" 
            onClick={onTrade}
            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap
              ${isBullish 
                ? 'bg-emerald-500/80 hover:bg-emerald-400/90' 
                : "bg-red-500/80 hover:bg-red-400/90"
              } text-white`}
          >
            Start Bot
          </button>
        </div>
      </div>
    </div>
  );
} 