'use client';

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import Chart from "@/components/ui/Chart";
import { useMarketStore } from '@/app/stores/marketStore';

export default function Home() {
  const [price, setPrice] = useState<string>('0.00');
  const [priceChange, setPriceChange] = useState<string>('0.00');
  const [volume, setVolume] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [animationClass, setAnimationClass] = useState('');
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');

  const isBullish = useMarketStore(state => state.isBullish);

  useEffect(() => {
    // Fetch initial ticker data
    const fetchInitialData = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDC');
        const data = await response.json();
        
        setPrice(parseFloat(data.lastPrice).toFixed(2));
        setPriceChange(parseFloat(data.priceChangePercent).toFixed(2));
        setVolume(parseFloat(data.volume).toFixed(2));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdc@ticker');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(parseFloat(data.c).toFixed(2));
      setPriceChange(parseFloat(data.P).toFixed(2));
      setVolume(parseFloat(data.v).toFixed(2));
    };

    return () => ws.close();
  }, []);

  // Add effect to trigger animation on isBullish change
  useEffect(() => {
    setAnimationClass('animate-flash-glow');
    const timer = setTimeout(() => {
      setAnimationClass('');
    }, 1000);

    return () => clearTimeout(timer);
  }, [isBullish]);

  if (isLoading) {
    return (
      <div className="container min-h-screen py-8 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <p className="text-lg text-white/60">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-black bg-circuit-pattern
      before:content-[''] before:fixed before:inset-0 before:-z-10
      before:bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from)_0%,_var(--tw-gradient-to)_70%)]
      ${isBullish
        ? 'before:from-emerald-500/10 before:to-transparent'
        : 'before:from-red-500/10 before:to-transparent'
      }
      ${animationClass}
    `}>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">ETH/USDC</h1>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">${price}</p>
                  <p className={`text-sm font-medium ${
                    isBullish ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {priceChange}%
                  </p>
                </div>
              </div>
              
              <div className={`relative w-full h-[600px] rounded-lg overflow-hidden
                bg-clip-padding backdrop-filter backdrop-blur-sm
                before:content-[''] before:absolute before:inset-0 before:p-[2px] before:rounded-lg before:-z-10
                before:bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from)_0%,_var(--tw-gradient-to)_70%)]
                ${isBullish
                  ? 'before:from-emerald-500/20 before:to-transparent'
                  : 'before:from-red-500/20 before:to-transparent'
                }
                ${animationClass}
              `}>
                <Chart symbol="ETHUSDC" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg ">
                  <p className="text-sm text-white/60">Price</p>
                  <p className="text-xl font-semibold text-white">${price}</p>
                </div>
                <div className="p-4 rounded-lg ">
                  <div className="relative">
                    <button 
                      onClick={() => setIsTrayOpen(!isTrayOpen)}
                      className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-lg 
                        transform transition-all duration-500 hover:scale-110 hover:rotate-1
                        ${isBullish 
                          ? 'bg-emerald-500/80 hover:bg-emerald-400/90 hover:shadow-lg hover:shadow-emerald-500/50 text-white font-bold' 
                          : 'bg-red-500/80 hover:bg-red-400/90 hover:shadow-lg hover:shadow-red-500/50 text-white font-bold'
                        }
                        ${animationClass}`}
                    >
                      <span className="text-lg mb-1">
                        Auto Trade
                      </span>
                    </button>

                    {/* Sliding Tray */}
                    <div className={`absolute left-0 right-0 overflow-hidden transition-all duration-500 ease-in-out
                      ${isTrayOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'}
                    `}>
                      <div className={`p-4 rounded-lg backdrop-blur-sm border-2
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
                            onChange={(e) => setTradeAmount(e.target.value)}
                            placeholder="Enter amount..."
                            className="w-full bg-black/30 text-white px-3 py-2 rounded-lg 
                              border-2 border-white/20 focus:outline-none focus:border-white/40"
                          />
                          <button 
                            onClick={() => {
                              // Add your trade logic here
                              console.log(`Starting auto-${isBullish ? 'long' : 'short'} with ${tradeAmount} USDC`);
                              setIsTrayOpen(false);
                            }}
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
                  </div>
                </div>
                <div className="p-4 rounded-lg  text-right">
                  <p className="text-sm text-white/60">Market State</p>
                  <p className={`text-xl font-semibold transform transition-all duration-500
                    ${isBullish 
                      ? 'text-emerald-500' 
                      : 'text-red-500'
                    }`}>
                    {isBullish ? 'BULLISH' : 'BEARISH'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
