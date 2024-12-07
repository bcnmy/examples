import { Loader2, CheckCircle2, ArrowRight, XCircle, X } from "lucide-react"
import { Button } from "./button"
import type { Hex } from "viem"
import { cn } from "@/app/lib/utils"

interface PermissionStatusProps {
  status: "idle" | "enabling" | "granting" | "granted" | "error"
  userOpHash: Hex | null
  transactionHash: Hex | null
  onClose?: () => void
}

export function PermissionStatus({
  status,
  userOpHash,
  transactionHash,
  onClose
}: PermissionStatusProps) {
  if (status === "idle") return null

  return (
    <div className="flex flex-col py-8 mt-6 border-t border-white/10 relative">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-0 top-8 text-white/40 hover:text-white/60 hover:bg-white/10 rounded-full h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex flex-col items-center">
        {(status === "enabling" || status === "granting") && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {status === "enabling"
                ? "Enabling Smart Sessions"
                : "Granting Permissions"}
            </h3>
            <p className="text-sm text-white/60 text-center max-w-xs">
              {status === "enabling"
                ? "Setting up your smart account for automated trading..."
                : "Grant permission to execute trades on your behalf..."}
            </p>
          </div>
        )}

        {status === "granted" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Ready to Trade!
            </h3>
            <p className="text-sm text-white/60 text-center max-w-xs mb-6">
              Your trading permissions have been successfully granted.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-white/60 text-center max-w-xs mb-6">
              There was an error granting trading permissions. Please try again.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="link"
            className={cn(
              "mt-4 text-xs flex items-center gap-1 transition-colors",
              !userOpHash
                ? "text-white/20 cursor-not-allowed"
                : "text-white/40 hover:text-white/60"
            )}
            disabled={!userOpHash}
            asChild={!!userOpHash}
          >
            {userOpHash ? (
              <a
                href={`https://jiffyscan.xyz/userOpHash/${userOpHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                UserOperation
                <ArrowRight className="w-3 h-3" />
              </a>
            ) : (
              <span>UserOperation</span>
            )}
          </Button>
          <Button
            variant="link"
            className={cn(
              "mt-4 text-xs flex items-center gap-1 transition-colors",
              !transactionHash
                ? "text-white/20 cursor-not-allowed"
                : "text-white/40 hover:text-white/60"
            )}
            disabled={!transactionHash}
            asChild={!!transactionHash}
          >
            {transactionHash ? (
              <a
                href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Transaction
                <ArrowRight className="w-3 h-3" />
              </a>
            ) : (
              <span>Transaction</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
