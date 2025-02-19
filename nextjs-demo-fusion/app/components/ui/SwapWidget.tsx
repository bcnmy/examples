import { useEffect, useState } from "react"
import { Card } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { ChevronDown, Loader2 } from "lucide-react"
import { useSwap } from "@/app/hooks/use-swap"
import Image from "next/image"
import { getMeeScanLink } from "@biconomy/abstractjs-canary"
import { useToast } from "@/app/hooks/use-toast"
import Link from "next/link"
import { Link as LinkFromLucide } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../components/ui/dropdown-menu"
import { useMultichainNexus } from "@/app/hooks/use-multichain-nexus"
import type { BalancePayload } from "../../hooks/use-erc20-balance"
import { TokenBalance } from "../TokenBalance"
import { SuperTransactionStatus } from "../SuperTransactionStatus"
import { NetworkToggle } from "./NetworkToggle"
import { useNetworkData } from "@/app/hooks/use-network-data"
import { FaucetButton } from "./FaucetButton"

type SwapWidgetProps = {
  usdcBalance: BalancePayload
  outTokenBalance: BalancePayload
}

export function SwapWidget({ usdcBalance, outTokenBalance }: SwapWidgetProps) {
  const { minimumSpend, mode } = useNetworkData()
  const { mcNexus, mcNexusAddress, meeClient } = useMultichainNexus()
  const { toast } = useToast()
  const [inputAmount, setInputAmount] = useState<string>(
    minimumSpend.toString()
  )
  const [outputAmount, setOutputAmount] = useState<string>("0")

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setInputAmount(String(minimumSpend))
  }, [mode, minimumSpend])

  useEffect(() => {
    setOutputAmount(inputAmount)
  }, [inputAmount])

  const sellAmount = BigInt(+(inputAmount ?? 0) * 100) * BigInt(10 ** 4)
  const minimumNotMet =
    !!(inputAmount ?? 0) && Number(inputAmount) < minimumSpend
  const maximumExceeded =
    !!inputAmount &&
    Number(inputAmount) > (usdcBalance?.balance ?? 0n) / BigInt(10 ** 6)

  const { swap, isLoading, error, hash } = useSwap({
    mcNexusAddress,
    mcNexus,
    sellAmount,
    meeClient
  })

  useEffect(() => {
    if (hash) {
      toast({
        title: "Transactions Submitted",
        description: (
          <div className="flex items-center">
            <Link
              href={getMeeScanLink(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className={"flex items-center"}
            >
              <LinkFromLucide className="mr-2 h-3 w-3" />
              View on MeeScan
            </Link>
          </div>
        )
      })
    }
  }, [hash, toast])

  return (
    <div className="p-2 sm:p-4 w-full min-w-[320px] sm:min-w-[400px] max-w-[400px] flex flex-col items-center gap-2 sm:gap-4">
      <div className="w-full flex items-center justify-between">
        <ConnectButton />
        {mode === "testnet" && <FaucetButton />}
      </div>
      <div className="flex gap-2 w-full">
        <NetworkToggle />
      </div>
      <Card className="w-full p-3 sm:p-4 flex flex-col items-center gap-3 sm:gap-4 bg-gradient-to-br from-background via-background to-accent/20 backdrop-blur-sm border-2">
        {/* From Section */}
        <div className="space-y-2 w-full group transition-all">
          <div className="flex justify-between">
            <span className="text-sm font-medium">From</span>
            <div className="flex items-center gap-2">
              <TokenBalance balances={[usdcBalance]} />
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm text-gray-500 focus:outline-none font-medium hover:opacity-80 transition-opacity">
                  <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-full">
                    <Image
                      src="/op.svg?v=25.1.4.0"
                      alt="Op Sepolia"
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    sep
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Op Sepolia</DropdownMenuItem>
                  <DropdownMenuItem disabled>Optimism</DropdownMenuItem>
                  <DropdownMenuItem disabled>Base</DropdownMenuItem>
                  <DropdownMenuItem disabled>Arbitrum</DropdownMenuItem>
                  <DropdownMenuItem disabled>Polygon</DropdownMenuItem>
                  <DropdownMenuItem disabled>Ethereum</DropdownMenuItem>
                  <DropdownMenuItem disabled>BNB Chain</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="relative flex items-center">
            <Input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              onClick={(e) => e.currentTarget.select()}
              className="pr-20 transition-all border-2 focus:ring-2 focus:ring-primary/20"
              placeholder="1"
              step={0.5}
              min={minimumSpend}
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <span className="font-medium text-sm text-gray-500">USDC</span>
            </div>
          </div>
        </div>

        {/* To Section */}
        <div className="space-y-2 w-full group transition-all">
          <div className="flex justify-between">
            <span className="text-sm font-medium">To</span>
            <div className="flex items-center gap-2">
              <TokenBalance balances={[outTokenBalance]} />
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm text-gray-500 focus:outline-none">
                  <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-full hover:opacity-80 transition-opacity">
                    <Image
                      src="/base.png"
                      alt="Base Sepolia"
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    sep
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Base Sepolia</DropdownMenuItem>
                  <DropdownMenuItem disabled>Optimism</DropdownMenuItem>
                  <DropdownMenuItem disabled>Base</DropdownMenuItem>
                  <DropdownMenuItem disabled>Arbitrum</DropdownMenuItem>
                  <DropdownMenuItem disabled>Polygon</DropdownMenuItem>
                  <DropdownMenuItem disabled>Ethereum</DropdownMenuItem>
                  <DropdownMenuItem disabled>BNB Chain</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="relative flex items-center">
            <Input
              type="number"
              value={outputAmount}
              className="pr-24 transition-all border-2 bg-secondary/20"
              placeholder="0.0"
              disabled
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <span className="font-medium text-sm text-gray-500">
                {outTokenBalance.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md w-full">
            {error.message}
          </div>
        )}

        <Button
          className={`w-full transition-all duration-200 ${
            isLoading
              ? "bg-primary/80"
              : minimumNotMet || maximumExceeded
                ? "bg-destructive/80"
                : "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          }`}
          onClick={() => swap()}
          disabled={
            isLoading ||
            !mcNexus ||
            !mcNexusAddress ||
            !sellAmount ||
            minimumNotMet ||
            maximumExceeded
          }
        >
          {minimumNotMet ? (
            <span className="text-sm">Minimum swap is {minimumSpend} USDC</span>
          ) : maximumExceeded ? (
            <span className="text-sm">Insufficient funds</span>
          ) : isLoading ? (
            <span className="flex items-center gap-2">
              Swapping
              <Loader2 className="w-4 h-4 animate-spin" />
            </span>
          ) : (
            <>Swap</>
          )}
        </Button>
      </Card>
      <SuperTransactionStatus meeClient={meeClient} hash={hash} />
    </div>
  )
}
