"use client"

import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import { useToast } from "@/app/hooks/use-toast"
import type { Address } from "viem"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Card } from "./ui/card"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useState } from "react"

interface FaucetSectionProps {
  eoaAddress?: Address
}

export function FaucetSection({ eoaAddress }: FaucetSectionProps) {
  const { toast } = useToast()

  const [faucetOpened, setFaucetOpened] = useState(false)
  const handleFaucetClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!eoaAddress) throw new Error("No EOA address provided")
    setFaucetOpened(true)

    try {
      await navigator.clipboard.writeText(eoaAddress)
      toast({
        title: "Address Copied!",
        description: `${eoaAddress.slice(0, 4)}...${eoaAddress.slice(-4)} copied to clipboard. Redirecting to faucet...`
      })

      setTimeout(() => {
        window.open("https://faucet.circle.com", "_blank")
      }, 1500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address to clipboard",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-4 min-w-[400px] flex flex-col items-center gap-4">
      <div className="w-full">
        <ConnectButton />
      </div>
      <Card className="w-full p-4 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 p-4 sm:gap-4 sm:p-6 bg-gray-100 rounded-lg transition-all duration-500 ease-in-out sm:mb-4">
          <Image
            src="/image.png"
            alt="Faucet"
            width={400}
            height={400}
            priority
            className="w-[250px] sm:w-[300px] h-auto"
          />
          <span className="flex items-center w-full gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-center text-amber-600 border border-amber-200 rounded-md bg-amber-50">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            Select &quot;Optimism Sepolia&quot;
          </span>
        </div>
        <Button
          onClick={handleFaucetClick}
          className="w-full px-4 sm:px-6 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 text-sm sm:text-base"
        >
          {faucetOpened ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Watching USDC balance...
            </>
          ) : (
            <>Go to Circle Faucet</>
          )}
        </Button>
      </Card>
    </div>
  )
}
