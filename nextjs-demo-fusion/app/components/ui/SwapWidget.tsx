import { useEffect, useState } from "react"
import { Card } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { ChevronDown, Loader2 } from "lucide-react"
import { useSwap } from "@/app/hooks/use-swap"
import Image from "next/image"
import {
  getChain,
  getMeeScanLink,
  type WaitForSupertransactionReceiptPayload
} from "@biconomy/abstractjs-canary"
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
const MINIMUM_ACROSS_TRANSFER = 4n // $4

type SwapWidgetProps = {
  usdcBalance: BalancePayload
  fusionBalance: BalancePayload
}

export function SwapWidget({ usdcBalance, fusionBalance }: SwapWidgetProps) {
  const { mcNexus, mcNexusAddress, meeClient } = useMultichainNexus()
  const { toast } = useToast()
  const [inputAmount, setInputAmount] = useState<string>("0")
  const [outputAmount, setOutputAmount] = useState<string>("0")
  const [receipt, setReceipt] = useState<
    WaitForSupertransactionReceiptPayload | undefined
  >(undefined)

  useEffect(() => {
    setOutputAmount(inputAmount)
  }, [inputAmount])

  const sellAmount = BigInt(inputAmount) * BigInt(10 ** 6)
  const minimumNotMet =
    !!inputAmount && Number(inputAmount) < MINIMUM_ACROSS_TRANSFER
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
    if (receipt && receipt.explorerLinks.length > 0) {
      toast({
        title: "Transaction Submitted",
        description: (
          <div className="flex items-center">
            {receipt.explorerLinks.map((link: string, index: number) => (
              <Link
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={"flex items-center"}
              >
                <LinkFromLucide className="mr-2 h-3 w-3" />
                {getChain(Number(receipt.userOps[index].chainId)).name}
              </Link>
            ))}
          </div>
        )
      })
    }
  }, [receipt, toast])

  useEffect(() => {
    async function getUrls() {
      if (!hash || !meeClient) return
      const receipt = await meeClient.waitForSupertransactionReceipt({ hash })
      setReceipt(receipt)
    }

    if (hash) getUrls()
  }, [hash, meeClient])

  useEffect(() => {
    if (hash) {
      toast({
        title: "Transaction Submitted",
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
      <div className="w-full">
        <ConnectButton />
      </div>
      <Card className="w-full p-3 sm:p-4 flex flex-col items-center gap-3 sm:gap-4">
        <div className="space-y-2 w-full">
          <div className="flex justify-between">
            <span className="text-sm font-medium">From</span>
            <div className="flex items-center gap-2">
              <TokenBalance balances={[usdcBalance]} />
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm text-gray-500 focus:outline-none font-medium">
                  <span className="flex items-center gap-2">
                    <Image
                      src="https://sepolia-optimism.etherscan.io/assets/opsepolia/images/svg/logos/chain-light.svg?v=25.1.4.0"
                      alt="Op Sepolia"
                      width={16}
                      height={16}
                    />{" "}
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
              className="pr-20"
              placeholder="1"
              step={1}
              min={Number(MINIMUM_ACROSS_TRANSFER)}
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <span className="font-medium">USDC</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 w-full">
          <div className="flex justify-between">
            <span className="text-sm font-medium">To</span>
            <div className="flex items-center gap-2">
              <TokenBalance balances={[fusionBalance]} />
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm text-gray-500 focus:outline-none">
                  <span className="flex items-center gap-2">
                    <Image
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACCUlEQVR4AcWXtZYVQRRFC7eYDIcEd3d39wTJkO/AE9zdISPDnYgQd2d80vG5s0/3G7en1bXWbu9rJX3axdXWWke3zIa5lbbZrbIzboW95jgPyjg39oW6Bsdgi1tug9wM6+xSbTjugrGpODkJH3BULIetUAJvefai3g1sJN6sDRkPwMgBjP2FMNPEKI+9u9ctst6yGW/W7XA8lxdf1ZQ4FUIbD9hPlO3Wna+2pTz8ESplIE1UYO+9bMtH82VfZXPkXC9liA8wrenuWGz9cP68tczTUIl7DM6e9Z0vta7cOFTb5xmlBHbXn6bLKMsqywXzxG/Gw8ja7FfY5di0MU+UwuFggeNgAqX/rRue+RCsrmS/vbbvPcKqiu+NjoPbtTe8B3FaAXzSSUS8UgAX4VYauRP/jOK5tLeF1p0gnsT7nYg2AMHDlyLrAgkZDr6CRYJUFFFcj3AWHFMAOzmoiMB5SaAf2Yzm5BuYZ95KvIaKd6Vd9VyFcq0/tZ/kUAnleQwgJ5AANW2edfMmSEIf+xrLdclw1uZMSzJ4IJnetChFjmdUlKKMYaJ8NS/LV9myTMhy+ADL5COuHxN4nqYxUYKd+5Ljsh3/rxn9pMECOVCepO77Dbslw2UzuZ9TpovmrBYOKIlLaunZFXZYyjc9f8kY0aqF8a11fs8L60yr3NgMOh3ovKU2OFS8rbcqhpxDB1IV6RwAAAAASUVORK5CYII="
                      alt="Base Sepolia"
                      width={16}
                      height={16}
                    />{" "}
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
              onChange={(e) => setOutputAmount(e.target.value)}
              className="pr-24"
              placeholder="0.0"
              disabled
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <span className="font-medium">FUSION</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && <div className="text-sm text-red-500">{error.message}</div>}

        <Button
          className="w-full"
          onClick={() => swap()}
          disabled={
            isLoading ||
            !mcNexus ||
            !mcNexusAddress ||
            !sellAmount ||
            minimumNotMet ||
            maximumExceeded
          }
          variant="default"
        >
          {minimumNotMet ? (
            <span className="text-sm">
              Minimum swap is {Number(MINIMUM_ACROSS_TRANSFER)} USDC
            </span>
          ) : maximumExceeded ? (
            <span className="text-sm">
              Maximum swap is {Number(usdcBalance.balance) / 10 ** 6} USDC
            </span>
          ) : isLoading ? (
            <>
              Swapping...
              <Loader2 className="w-4 h-4 animate-spin" />{" "}
            </>
          ) : (
            <>Swap</>
          )}
        </Button>
      </Card>
    </div>
  )
}
