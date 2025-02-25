import { useEffect, useState } from "react"
import { Card } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { ChevronDown, Loader2 } from "lucide-react"
import { useSwap } from "@/app/hooks/use-swap"
import Image from "next/image"
import {
  type GetFusionQuotePayload,
  getMeeScanLink
} from "@biconomy/abstractjs"
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
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "./tooltip"

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
  const [quoteData, setQuoteData] = useState<GetFusionQuotePayload | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setInputAmount(String(minimumSpend))
  }, [mode, minimumSpend])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setOutputAmount(inputAmount)
  }, [inputAmount, mode])

  const sellAmount = BigInt(+(inputAmount ?? 0) * 100) * BigInt(10 ** 4)
  const minimumNotMet =
    !!(inputAmount ?? 0) && Number(inputAmount) < minimumSpend
  const maximumExceeded =
    !!inputAmount &&
    Number(inputAmount) > (usdcBalance?.balance ?? 0n) / BigInt(10 ** 6)

  const { swap, isLoading, error, hash, getQuote, isQuoting } = useSwap({
    mcNexusAddress,
    mcNexus,
    sellAmount,
    meeClient
  })

  const handleGetQuote = async () => {
    try {
      const fusionQuote = await getQuote()
      if (fusionQuote) {
        // Convert wei amount to USDC (6 decimals)
        setQuoteData(fusionQuote)
      }
    } catch (err) {
      console.error("Failed to get quote:", err)
      toast({
        title: "Error",
        description: "Failed to get quote",
        variant: "destructive"
      })
    }
  }

  const handleConfirmSwap = async () => {
    if (!quoteData) return
    console.log({ quoteData })
    await swap(quoteData)
    setQuoteData(null) // Reset quote after swap
  }

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
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    {mode === "mainnet" ? "Optimism" : "Op Sepolia"}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    {mode === "mainnet" ? "Optimism Sepolia" : "Optimism"}
                  </DropdownMenuItem>
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
              step={1}
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
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    {mode === "mainnet" ? "Base" : "Base Sepolia"}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    {mode === "mainnet" ? "Base Sepolia" : "Base"}
                  </DropdownMenuItem>
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

        {mode === "testnet" && (
          <div className="text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-md w-full">
            ⚠️ Testnet transactions are significantly slower due to bridge
            confirmation times. For blazing fast swaps, try mainnet mode.
          </div>
        )}

        {quoteData ? (
          <div className="w-full space-y-3">
            <div className="text-xs text-muted-foreground flex justify-between items-center px-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 underline decoration-dotted">
                    Gas Limit:
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p>
                      This is the maximum gas cost and is overestimated. Unused
                      gas is automatically returned to your account in native
                      tokens as part of the Supertransaction.
                    </p>
                  </TooltipContent>
                  <span className="font-medium">
                    {quoteData.quote.paymentInfo.tokenValue} USDC
                  </span>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setQuoteData(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                onClick={handleConfirmSwap}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    Swapping
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                ) : (
                  "Confirm Swap"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className={`w-full transition-all duration-200 ${
              isQuoting
                ? "bg-primary/80"
                : minimumNotMet || maximumExceeded
                  ? "bg-destructive/80"
                  : "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            }`}
            onClick={handleGetQuote}
            disabled={
              isQuoting ||
              !mcNexus ||
              !mcNexusAddress ||
              !sellAmount ||
              minimumNotMet ||
              maximumExceeded
            }
          >
            {minimumNotMet ? (
              <span className="text-sm">
                Minimum swap is {minimumSpend} USDC
              </span>
            ) : maximumExceeded ? (
              <span className="text-sm">Insufficient funds</span>
            ) : isQuoting ? (
              <span className="flex items-center gap-2">
                Getting Quote
                <Loader2 className="w-4 h-4 animate-spin" />
              </span>
            ) : (
              <>Get Quote</>
            )}
          </Button>
        )}
      </Card>
      <SuperTransactionStatus meeClient={meeClient} hash={hash} />
    </div>
  )
}
