import { ExternalLink } from "lucide-react"

interface TradeToastProps {
  isBullish: boolean
  userOpHash?: string
  transactionHash?: string
  error?: boolean
  errorMessage?: string
}

export function TradeToast({
  isBullish,
  userOpHash,
  transactionHash,
  error = false,
  errorMessage
}: TradeToastProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        {error
          ? `Failed to ${isBullish ? "buy" : "sell"} WETH${errorMessage ? `: ${errorMessage}` : ""}`
          : `Successfully ${isBullish ? "bought" : "sold"} WETH`}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        {userOpHash && (
          <a
            href={`https://jiffyscan.xyz/userOpHash/${userOpHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            View Operation on Jiffy
            <ExternalLink size={14} />
          </a>
        )}
        {transactionHash && (
          <a
            href={`https://sepolia.basescan.org/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            View Transaction on BaseScan
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  )
}
