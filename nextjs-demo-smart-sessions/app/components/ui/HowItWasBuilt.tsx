import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./dialog"
import { ScrollArea } from "./scroll-area"
import { Button } from "./button"
import {
  Code2,
  Timer,
  Shield,
  Key,
  ExternalLink,
  AlertCircle
} from "lucide-react"

interface HowItWasBuiltProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm?: () => void
  showTrigger?: boolean
}

export function HowItWasBuilt({
  open,
  onOpenChange,
  onConfirm,
  showTrigger = true
}: HowItWasBuiltProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-white bg-black/50 hover:bg-white/10 hover:text-white
              w-10 h-10 sm:w-auto sm:h-auto px-0 sm:px-4 py-2
              flex items-center justify-center gap-2
              text-sm sm:text-base
              rounded-lg transition-all duration-200
              active:scale-95 touch-none"
          >
            <Code2 className="h-5 w-5" />
            <span className="hidden sm:inline whitespace-nowrap">
              How was it built?
            </span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl bg-black/90 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Code2 className="h-5 w-5" />
            Technical Implementation
          </DialogTitle>
        </DialogHeader>

        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <h4 className="text-yellow-300 font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Testnet Demo
          </h4>
          <p className="text-sm text-white/70">
            This is a demonstration app running on Sepolia testnet. It uses test
            tokens (Dummy WETH and USDC tokens) with no real monetary value. All
            trades and transactions are simulated using testnet funds, so feel
            free to play around!
          </p>
        </div>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Smart Sessions Overview */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Key className="h-5 w-5" />
                Smart Sessions
              </h3>
              <p className="text-sm text-white/70">
                This app uses Smart Sessions (powered by Biconomy and
                Rhinestone) to enable automated trading without requiring
                constant wallet signatures. Smart Sessions are scoped
                permissions that allow the app to execute trades on your behalf
                within strict boundaries you define.
              </p>
            </section>

            {/* Universal Action Policy */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Security Policies
              </h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg space-y-2 border border-white/10">
                  <h4 className="font-medium text-white">
                    Universal Action Policy
                  </h4>
                  <p className="text-sm text-white/70">
                    Restricts which smart contract functions can be called and
                    with what parameters:
                  </p>
                  <ul className="text-sm text-white/70 list-disc list-inside ml-4 space-y-1">
                    <li>Whitelisted contract addresses only</li>
                    <li>Specific function calls (e.g., trade functions)</li>
                    <li>Maximum transaction amounts</li>
                    <li>Parameter validation for each trade</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Time Range Policy */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Timer className="h-5 w-5" />
                Time Constraints
              </h3>
              <div className="bg-white/5 p-4 rounded-lg space-y-2 border border-white/10">
                <h4 className="font-medium text-white">Time Range Policy</h4>
                <p className="text-sm text-white/70">
                  Each session is time-bound for security:
                </p>
                <ul className="text-sm text-white/70 list-disc list-inside ml-4 space-y-1">
                  <li>Sessions expire after 24 hours</li>
                  <li>Automatic deactivation after expiry</li>
                  <li>Requires new session creation for continued trading</li>
                </ul>
              </div>
            </section>

            {/* Implementation Details */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-white">How It Works</h3>
              <div className="space-y-2 text-sm text-white/70">
                <p>
                  1. When you activate auto-trading, the app creates a new
                  session with specific validation policies and action
                  permissions.
                </p>
                <p>
                  2. Each session is configured with: - Whitelisted contract
                  addresses - Specific function selectors for trading - Maximum
                  transaction limits - Time-based constraints
                </p>
                <p>
                  3. The session key remains in your custody while allowing
                  automated execution within the defined boundaries.
                </p>
                <p>
                  4. All transactions are fully on-chain and verifiable through
                  your smart account.
                </p>
              </div>
            </section>

            {/* Gas Sponsorship */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Gas Sponsorship
              </h3>
              <div className="space-y-2 text-sm text-white/70">
                <p>
                  This app uses Biconomy&apos;s Paymaster to sponsor gas fees
                  for users, making the trading experience completely gasless.
                  The paymaster:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Covers all gas costs for automated trades</li>
                  <li>Maintains a gas tank for transaction sponsorship</li>
                  <li>Implements configurable spending limits and rules</li>
                  <li>Provides real-time monitoring and notifications</li>
                </ul>
              </div>
            </section>

            {/* Get Started */}
            <section className="space-y-2 pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white">Get Started</h3>
              <div className="space-y-2 text-sm text-white/70">
                <p>
                  Want to build your own automated trading system? Get started
                  with Biconomy SDK today:
                </p>
                <div className="bg-white/5 p-4 rounded-lg font-mono text-xs">
                  npm i @biconomy/abstractjs viem @rhinestone/module-sdk
                </div>
              </div>
            </section>

            {/* Learn More section */}
            <section className="space-y-2 pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white">Learn More</h3>
              <div className="space-y-2">
                <a
                  href="https://docs.biconomy.io/modules/validators/smartSessions/usingSmartSessions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Biconomy Smart Sessions
                </a>
                <a
                  href="https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Rhinestone Smart Sessions
                </a>
                <a
                  href="https://docs.biconomy.io/modules/validators/smartSessions/policies/universalActionPolicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Universal Action Policy
                </a>
                <a
                  href="https://docs.biconomy.io/modules/validators/smartSessions/policies/timeRangePolicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Time Range Policy
                </a>
                <a
                  href="https://github.com/bcnmy/examples/tree/main/nextjs-demo-smart-sessions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  GitHub Repository
                </a>
                <a
                  href="https://docs.biconomy.io/dashboard/paymaster"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Paymaster Documentation
                </a>
                <a
                  href="https://docs.biconomy.io/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Quickstart Guide
                </a>
              </div>
            </section>
          </div>
        </ScrollArea>

        {onConfirm && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onConfirm}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
            >
              Confirm Deactivation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
