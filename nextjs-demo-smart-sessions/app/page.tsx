"use client"

import React from "react"
import { useMarketStore } from "@/app/stores/marketStore"
import { MarketInterface } from "@/app/components/ui/MarketInterface"
import { usePriceFeed } from "./hooks/use-price-feed"
import { useAccount } from "wagmi"
import { useFaucet } from "./hooks/use-faucet"

export default function Home() {
  const { price, priceChange, isLoading } = usePriceFeed()
  const isBullish = useMarketStore((state) => state.isBullish)

  return (
    <MarketInterface
      price={price}
      priceChange={priceChange}
      isBullish={!!isBullish}
      isLoading={isLoading}
    />
  )
}
