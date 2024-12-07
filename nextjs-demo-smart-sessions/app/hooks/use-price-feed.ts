import { useState, useEffect } from "react"

export function usePriceFeed() {
  const [price, setPrice] = useState<string>("0.00")
  const [priceChange, setPriceChange] = useState<string>("0.00")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(
          "https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDC"
        )
        const data = await response.json()

        setPrice(Number.parseFloat(data.lastPrice).toFixed(2))
        setPriceChange(Number.parseFloat(data.priceChangePercent).toFixed(2))
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching initial data:", error)
        setIsLoading(false)
      }
    }

    fetchInitialData()

    const ws = new WebSocket("wss://stream.binance.com:9443/ws/ethusdc@ticker")

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setPrice(Number.parseFloat(data.c).toFixed(2))
      setPriceChange(Number.parseFloat(data.P).toFixed(2))
    }

    return () => ws.close()
  }, [])

  return {
    price,
    priceChange,
    isLoading
  }
}
