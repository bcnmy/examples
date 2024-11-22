"use client"

import { ExternalLink } from "lucide-react"
import { useAccount, useBalance } from "wagmi"
import { useMarketStore } from "@/app/stores/marketStore"
import dynamic from "next/dynamic"
import { jsNumberForAddress } from "react-jazzicon"
import { formatEther } from "viem"

// Dynamically import jazzicon with no SSR
const Jazzicon = dynamic(
  () => import("react-jazzicon").then((mod) => mod.default),
  { ssr: false }
)

export function AccountLink() {
  const { chain } = useAccount()
  const { nexusAddress } = useMarketStore()

  const { data: ethBalance } = useBalance({ address: nexusAddress })

  if (!nexusAddress || !chain) return null

  const explorerUrl = `${chain.blockExplorers?.default.url}/address/${nexusAddress}`
  const shortAddress = `${nexusAddress.slice(0, 4)}...${nexusAddress.slice(-4)}`

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-2 rounded-xl bg-white px-2 py-1 text-base font-medium"
    >
      <span className="text-[#25292E]">
        {formatEther(ethBalance?.value ?? 0n)} ETH
      </span>
      <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-1">
        <Jazzicon diameter={18} seed={jsNumberForAddress(nexusAddress)} />
        <span className="hidden sm:inline text-[#25292E]">{shortAddress}</span>
        <ExternalLink
          size={14}
          className="text-[#25292E]/60 hover:text-[#25292E]"
        />
      </div>
    </a>
  )
}
