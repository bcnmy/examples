"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type LineWidth,
  type IPriceLine
} from "lightweight-charts"
import { BinanceService } from "@/app/services/binanceService"
import { CrossType } from "@/app/services/crossDetector"
import { TIMEFRAME_SECONDS } from "./constants"
import type { ChartProps } from "./types"
import { useMarketStore } from "@/app/stores/marketStore"
import {
  candlestickSeriesOptions,
  chartConfig,
  longMAOptions,
  shortMAOptions
} from "@/app/styles/theme"

const Chart = ({ symbol }: ChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const shortMARef = useRef<ISeriesApi<"Line"> | null>(null)
  const longMARef = useRef<ISeriesApi<"Line"> | null>(null)
  const leftStateLineRef = useRef<IPriceLine | null>(null)
  const rightStateLineRef = useRef<IPriceLine | null>(null)
  const setIsBullish = useMarketStore((state) => state.setIsBullish)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!chartContainerRef.current) return

    const binanceService = new BinanceService(symbol, 5, 15)

    chartRef.current = createChart(chartContainerRef.current, {
      ...chartConfig,
      width: chartContainerRef.current.clientWidth,
      height: 600,
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        borderColor: "transparent",
        textColor: "rgba(255, 255, 255, 0.6)",
        alignLabels: true,
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1
        }
      }
    })

    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      ...candlestickSeriesOptions,
      priceScaleId: "right"
    })
    shortMARef.current = chartRef.current.addLineSeries({
      ...shortMAOptions,
      lineWidth: 2 as LineWidth,
      priceScaleId: "left"
    })
    longMARef.current = chartRef.current.addLineSeries({
      ...longMAOptions,
      lineWidth: 2 as LineWidth,
      priceScaleId: "left"
    })

    const initializeChart = async () => {
      const { candles, mas } = await binanceService.fetchHistoricalData()

      if (candleSeriesRef.current && candles.length > 0) {
        candleSeriesRef.current.setData(candles)

        // Initialize MA lines with correct typing
        if (shortMARef.current && longMARef.current) {
          const shortMAData = mas.map((ma) => ({
            time: ma.timestamp as Time,
            value: ma.shortMA!
          }))

          const longMAData = mas.map((ma) => ({
            time: ma.timestamp as Time,
            value: ma.longMA!
          }))

          shortMARef.current.setData(shortMAData)
          longMARef.current.setData(longMAData)

          // Add this section to determine initial state
          if (mas.length >= 2) {
            const lastMA = mas[mas.length - 1]
            const isBullish = lastMA.shortMA! > lastMA.longMA!
            setIsBullish(isBullish)

            // Optionally set initial price line
            if (candleSeriesRef.current) {
              const currentPrice = candles[candles.length - 1].close
              const priceLineOptions = {
                color: isBullish ? "#4ADE80" : "#FF4444",
                lineWidth: 2 as LineWidth,
                price: currentPrice,
                title: isBullish ? "BULLISH" : "BEARISH",
                axisLabelVisible: false,
                titleAlignment: "left",
                lineStyle: 0,
                lineVisible: false
              }

              leftStateLineRef.current =
                candleSeriesRef.current.createPriceLine(priceLineOptions)
              rightStateLineRef.current =
                candleSeriesRef.current.createPriceLine({
                  ...priceLineOptions,
                  axisLabelVisible: false,
                  title: ""
                })
            }
          }
        }

        // Set initial visible range
        const lastCandle = candles[candles.length - 1]
        const firstVisibleTime = (lastCandle.time as number) - TIMEFRAME_SECONDS

        chartRef.current?.timeScale().setVisibleRange({
          from: firstVisibleTime as Time,
          to: lastCandle.time as Time
        })
      }

      return binanceService.subscribeToTrades(
        (candle) => {
          if (candleSeriesRef.current) {
            candleSeriesRef.current.update(candle as CandlestickData)

            const currentTime = candle.time as number
            chartRef.current?.timeScale().setVisibleRange({
              from: (currentTime - TIMEFRAME_SECONDS) as Time,
              to: currentTime as Time
            })
          }
        },
        (signal) => {
          if (!candleSeriesRef.current) return

          const seriesData = candleSeriesRef.current?.data()
          const lastCandle = seriesData?.[
            seriesData.length - 1
          ] as CandlestickData
          const currentPrice = lastCandle?.close
          if (!currentPrice) return

          if (leftStateLineRef.current) {
            candleSeriesRef.current?.removePriceLine(leftStateLineRef.current)
          }
          if (rightStateLineRef.current) {
            candleSeriesRef.current?.removePriceLine(rightStateLineRef.current)
          }

          const isBullish = signal.type === CrossType.GOLDEN
          setIsBullish(isBullish)

          const priceLineOptions = {
            color: signal.type === CrossType.GOLDEN ? "#4ADE80" : "#FF4444",
            lineWidth: 2 as LineWidth,
            price: currentPrice,
            title: signal.type === CrossType.GOLDEN ? "BULLISH" : "BEARISH",
            axisLabelVisible: false,
            titleAlignment: "left",
            lineStyle: 0,
            lineVisible: false
          }

          leftStateLineRef.current =
            candleSeriesRef.current?.createPriceLine(priceLineOptions)

          rightStateLineRef.current = candleSeriesRef.current?.createPriceLine({
            ...priceLineOptions,
            axisLabelVisible: false,
            title: ""
          })
        },
        (mas) => {
          // Update moving averages on the chart
          if (mas.shortMA !== null && shortMARef.current) {
            shortMARef.current.update({
              time: mas.timestamp as Time,
              value: mas.shortMA
            })
          }
          if (mas.longMA !== null && longMARef.current) {
            longMARef.current.update({
              time: mas.timestamp as Time,
              value: mas.longMA
            })
          }
        }
      )
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        })
      }
    }

    global?.window.addEventListener("resize", handleResize)
    const cleanupPromise = initializeChart()

    return () => {
      global?.window.removeEventListener("resize", handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
      }
      cleanupPromise.then((cleanup) => cleanup())
    }
  }, [setIsBullish, symbol])

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  )
}

export default Chart
