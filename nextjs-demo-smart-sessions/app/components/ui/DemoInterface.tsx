import { MOCK_POOL_ADDRESS, MOCK_USDC_ADDRESS } from "@/app/lib/constants"
import { Card } from "./card"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "./button"
import { useEffect, useState } from "react"
import { useAutoClaim } from "@/app/hooks/use-auto-claim"
import { useAccount } from "wagmi"
import { useMarketStore } from "@/app/stores/marketStore"
import { AccountLink } from "./AccountLink"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { privateKeyToAccount } from "viem/accounts"
import type { Hex } from "viem"
import { useSwap } from "@/app/hooks/use-swap"
import { TaskDialog } from "./TaskDialog"
import { SuccessDialog } from "./SuccessDialog"
import { baseSepolia } from "viem/chains"
import { useAllowance } from "@/app/hooks/use-allowance"
import type { SessionData } from "@biconomy/sdk"
import { useGrantPermissions } from "@/app/hooks/use-grant-permission"

export default function DemoInterface() {
  useAutoClaim()

  const { initializeNexusClient, nexusAddress } = useMarketStore()
  const { address, isConnected, chain } = useAccount()
  const [permissionId, setPermissionId] = useState<Hex | undefined>()
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successTxHash, setSuccessTxHash] = useState<string>("")

  const sessionKeyAccount = privateKeyToAccount(
    `0x${process.env.NEXT_PUBLIC_PRIVATE_KEY}`
  )

  const test = useGrantPermissions()

  console.log({ test })

  const sessionData: SessionData = {
    granter: nexusAddress as Hex,
    sessionPublicKey: sessionKeyAccount.address,
    moduleData: {
      permissionIds: [permissionId!]
    }
  }

  const { allowances } = useAllowance(nexusAddress)
  console.log({ allowances, permissionId })

  const {
    swap,
    isLoading: isSwapping,
    error: swapError,
    success
  } = useSwap({
    nexusAddress,
    sessionData,
    sessionKeyAccount,
    permissionIdIndex: 0
  })

  useEffect(() => {
    if (success) {
      setShowSuccess(true)
    }
  }, [success])

  useEffect(() => {
    if (address && chain && isConnected && initializeNexusClient) {
      initializeNexusClient(address, chain)
    }
  }, [address, chain, initializeNexusClient, isConnected])

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand("copy")
        } catch (err) {
          console.error("Failed to copy text:", err)
        }
        textArea.remove()
      }
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const EXPLORER_URL = "https://sepolia.basescan.org"

  useEffect(() => {
    if (success) {
      setShowSuccess(true)
    }
  }, [success])

  return (
    <div className="fixed inset-0 flex items-center justify-center flex-col gap-4">
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
      />

      <SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        txHash={successTxHash}
      />

      <Button
        variant="link"
        onClick={() => setIsTaskDialogOpen(true)}
        className="text-blue-500 hover:text-blue-600 underline"
      >
        What's my task?
      </Button>

      <div className="flex gap-4 items-center flex-col">
        <ConnectButton />
        <AccountLink />
      </div>

      <Card className="bg-white p-2 w-[400px]">
        <div className="text-xs text-gray-600 space-y-1 p-4">
          <h2 className="text-sm font-medium text-gray-600 w-full py-2">
            Information
          </h2>
          <div className="flex items-center gap-2">
            <span>Chain ID: {baseSepolia.id.toString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Paymaster URL</span>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <code
              className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-2"
              onClick={() =>
                copyToClipboard(
                  "https://paymaster.biconomy.io/api/v2/84532/rCUJWLy2a.e354a2f2-677a-4a34-b365-510a06e94ad5"
                )
              }
            >
              https://paymaster...ad5 <Copy className="h-4 w-4" />
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span>Dapp EOA:</span>
            <div className="flex items-center gap-1">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <code
                className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-2"
                onClick={() =>
                  copyToClipboard("0x3079B249DFDE4692D7844aA261f8cf7D927A0DA5")
                }
              >
                0x307...DA5 <Copy className="h-4 w-4" />
              </code>
              <a
                href={`${EXPLORER_URL}/address/0x3079B249DFDE4692D7844aA261f8cf7D927A0DA5`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Mock Pool:</span>
            <div className="flex items-center gap-1">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <code
                className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-2"
                onClick={() => copyToClipboard(MOCK_POOL_ADDRESS)}
              >
                {`${MOCK_POOL_ADDRESS.slice(0, 6)}...${MOCK_POOL_ADDRESS.slice(-4)}`}{" "}
                <Copy className="h-4 w-4" />
              </code>
              <a
                href={`${EXPLORER_URL}/address/${MOCK_POOL_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Mock USDC:</span>
            <div className="flex items-center gap-1">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <code
                className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-2"
                onClick={() => copyToClipboard(MOCK_USDC_ADDRESS)}
              >
                {`${MOCK_USDC_ADDRESS.slice(0, 6)}...${MOCK_USDC_ADDRESS.slice(-4)}`}{" "}
                <Copy className="h-4 w-4" />
              </code>
              <a
                href={`${EXPLORER_URL}/address/${MOCK_USDC_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      <Card className="w-full max-w-md mx-4 bg-white w-[400px]">
        <div className="p-6 flex flex-col items-center justify-center space-y-6">
          <h2 className="text-sm font-medium text-gray-600 w-full">Execute</h2>
          <div className="space-y-4 w-full max-w-sm">
            <div>
              <label
                htmlFor="nexusAccountAddress"
                className="block text-sm font-medium text-gray-700"
              >
                Nexus Account Address
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="nexusAccountAddress"
                  className="text-black block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter nexus account address"
                  value={nexusAddress}
                  disabled
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="approvalPermissionId"
                className="block text-sm font-medium text-gray-700"
              >
                Permission ID
              </label>
              {/* <label htmlFor="allowance">{allowances.usdc.toString()}</label> */}
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="approvalPermissionId"
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  placeholder="Enter approval permission ID"
                  value={permissionId}
                  onChange={(e) => setPermissionId(e.target.value as Hex)}
                />
              </div>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => swap()}
                disabled={isSwapping || !permissionId}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
              >
                {isSwapping ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Swapping...
                  </div>
                ) : (
                  "Approve and Swap"
                )}
              </Button>
              {swapError && (
                <p className="mt-2 text-sm text-red-600">{swapError.message}</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
