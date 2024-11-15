import { useState } from 'react';

interface TradingTrayProps {
  isTrayOpen: boolean;
  isBullish: boolean;
  tradeAmount: string;
  onTradeAmountChange: (value: string) => void;
  onTrade: () => void;
}

export function TradingTray({ 
  isTrayOpen, 
  isBullish, 
  tradeAmount, 
  onTradeAmountChange, 
  onTrade 
}: TradingTrayProps) {
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
        <label className="block text-white text-sm mb-2">Trade Amount (USDC)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={tradeAmount}
            onChange={(e) => onTradeAmountChange(e.target.value)}
            placeholder="Enter amount..."
            className="w-full bg-black/30 text-white px-3 py-2 rounded-lg 
              border-2 border-white/20 focus:outline-none focus:border-white/40"
          />
          <button 
            onClick={onTrade}
            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap
              ${isBullish 
                ? 'bg-emerald-500/80 hover:bg-emerald-400/90' 
                : 'bg-red-500/80 hover:bg-red-400/90'
              } text-white`}
          >
            Start Bot
          </button>
        </div>
      </div>
    </div>
  );
} 