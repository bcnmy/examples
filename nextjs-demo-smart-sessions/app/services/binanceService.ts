import type { CandlestickData, Time } from "lightweight-charts"
import { MovingAverageCalculator } from "./movingAverages"
import { CrossDetector, type CrossSignal } from "./crossDetector"

export interface Trade {
  time: number
  price: number
}

export interface MovingAverages {
  shortMA: number | null
  longMA: number | null
  timestamp: number
}

export class BinanceService {
  private ws: WebSocket | null = null
  private symbol: string
  private shortMA: MovingAverageCalculator
  private longMA: MovingAverageCalculator
  private crossDetector: CrossDetector
  private currentCandle: CandlestickData | null = null
  private interval = 2000 // 2-second intervals
  private currentPrice = 0

  constructor(symbol: string, shortPeriod = 5, longPeriod = 15) {
    this.symbol = symbol
    this.shortMA = new MovingAverageCalculator(shortPeriod)
    this.longMA = new MovingAverageCalculator(longPeriod)
    this.crossDetector = new CrossDetector()
  }

  private initializeCandle(timestamp: number, price: number): CandlestickData {
    return {
      time: timestamp as Time,
      open: price,
      high: price,
      low: price,
      close: price
    }
  }

  private normalizeTimestamp(timestamp: number): number {
    // Round to nearest interval
    return Math.floor(timestamp / this.interval) * this.interval
  }

  async fetchHistoricalData(): Promise<{
    candles: CandlestickData[]
    mas: MovingAverages[]
    historicCrosses: CrossSignal[]
  }> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/trades?symbol=${this.symbol}&limit=1000`
      )
      const trades = await response.json()

      const candleMap = new Map<number, CandlestickData>()
      const maData: MovingAverages[] = []
      const historicCrosses: CrossSignal[] = []

      // biome-ignore lint/complexity/noForEach: <explanation>
      trades.forEach((trade: any) => {
        const timestamp = Math.floor(trade.time / 2000) * 2
        const price = Number.parseFloat(trade.price)

        if (!candleMap.has(timestamp)) {
          candleMap.set(timestamp, {
            time: timestamp as Time,
            open: price,
            high: price,
            low: price,
            close: price
          })

          // Calculate MAs for each candle
          const mas = this.updateMovingAverages(price, timestamp)
          if (mas.shortMA !== null && mas.longMA !== null) {
            maData.push(mas)

            // Check for crosses
            const crossSignal = this.crossDetector.update(
              mas.shortMA,
              mas.longMA,
              timestamp
            )
            if (crossSignal) {
              historicCrosses.push(crossSignal)
            }
          }
        } else {
          const candle = candleMap.get(timestamp)!
          candle.high = Math.max(candle.high, price)
          candle.low = Math.min(candle.low, price)
          candle.close = price
        }
      })

      const candles = Array.from(candleMap.values()).sort(
        (a, b) => (a.time as number) - (b.time as number)
      )

      return { candles, mas: maData, historicCrosses }
    } catch (error) {
      console.error("Error fetching historical data:", error)
      return { candles: [], mas: [], historicCrosses: [] }
    }
  }

  async initializeMovingAverages(): Promise<void> {
    try {
      // Get current price
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${this.symbol}`
      )
      const data = await response.json()
      this.currentPrice = Number.parseFloat(data.price)

      // Initialize both MAs with current price
      for (let i = 0; i < 200; i++) {
        // 200 is the longest MA period
        this.updateMovingAverages(this.currentPrice, Date.now() / 1000)
      }
    } catch (error) {
      console.error("Error initializing moving averages:", error)
    }
  }

  private updateMovingAverages(
    price: number,
    timestamp: number
  ): MovingAverages {
    const shortMA = this.shortMA.update(price)
    const longMA = this.longMA.update(price)

    return { shortMA, longMA, timestamp }
  }

  subscribeToTrades(
    onTradeUpdate: (data: CandlestickData) => void,
    onCrossSignal: (signal: CrossSignal) => void,
    onMAUpdate: (mas: MovingAverages) => void
  ): () => void {
    this.ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@trade`
    )

    // Start interval timer for 2-second updates
    const intervalId = setInterval(() => {
      if (this.currentCandle) {
        onTradeUpdate(this.currentCandle)

        const mas = this.updateMovingAverages(
          this.currentCandle.close,
          this.currentCandle.time as number
        )
        onMAUpdate(mas)

        const crossSignal = this.crossDetector.update(
          mas.shortMA,
          mas.longMA,
          this.currentCandle.time as number
        )
        if (crossSignal) {
          onCrossSignal(crossSignal)
        }

        // Start new candle
        this.currentCandle = {
          time: ((this.currentCandle.time as number) + 2) as Time,
          open: this.currentCandle.close,
          high: this.currentCandle.close,
          low: this.currentCandle.close,
          close: this.currentCandle.close
        }
      }
    }, 2000)

    this.ws.onmessage = (event) => {
      const trade = JSON.parse(event.data)
      const price = Number.parseFloat(trade.p)
      const timestamp = Math.floor(trade.T / 2000) * 2

      if (!this.currentCandle) {
        this.currentCandle = {
          time: timestamp as Time,
          open: price,
          high: price,
          low: price,
          close: price
        }
      } else {
        this.currentCandle.high = Math.max(this.currentCandle.high, price)
        this.currentCandle.low = Math.min(this.currentCandle.low, price)
        this.currentCandle.close = price
      }
    }

    return () => {
      clearInterval(intervalId)
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
    }
  }

  async fetchInitialTickerData() {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${this.symbol}`
      )
      const data = await response.json()

      return {
        price: Number.parseFloat(data.lastPrice).toFixed(2),
        priceChange: Number.parseFloat(data.priceChangePercent).toFixed(2),
        volume: Number.parseFloat(data.volume).toFixed(2)
      }
    } catch (error) {
      console.error("Error fetching initial ticker data:", error)
      return {
        price: "0.00",
        priceChange: "0.00",
        volume: "0.00"
      }
    }
  }

  subscribeToTicker(
    onTickerUpdate: (price: string, priceChange: string, volume: string) => void
  ): () => void {
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@ticker`
    )

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onTickerUpdate(
        Number.parseFloat(data.c).toFixed(2),
        Number.parseFloat(data.P).toFixed(2),
        Number.parseFloat(data.v).toFixed(2)
      )
    }

    return () => ws.close()
  }
}
