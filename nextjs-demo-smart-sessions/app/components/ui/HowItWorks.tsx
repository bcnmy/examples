import {
  Check,
  TrendingUp,
  TrendingDown,
  LineChart,
  Shield,
  Key,
  HelpCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"

export function HowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px]">
        <DialogHeader className="pb-4 border-b border-white/10">
          <DialogTitle className="text-xl font-semibold text-white">
            How It Works
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 pr-6 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
          <HowItWorks />
        </div>
      </DialogContent>
    </Dialog>
  )
}
export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenTradingGuide")
    if (hasSeenGuide) {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("hasSeenTradingGuide", "true")
    setIsVisible(false)
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
          <LineChart className="h-5 w-5 text-emerald-500" />
          Understanding Market Trends
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          This bot uses Exponential Moving Averages (EMAs) to identify market
          trends. When fast EMA crosses above slow EMA, it signals an uptrend.
          When it crosses below, it signals a downtrend.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Bullish Market (Buy ETH)
          </h4>
          <ul className="text-white/60 text-sm space-y-2 ml-6">
            <li className="list-disc">
              Fast EMA above slow EMA indicates upward momentum
            </li>
            <li className="list-disc">Bot automatically buys ETH with USDC</li>
            <li className="list-disc">Profit from rising ETH prices</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-bearish" />
            Bearish Market (Sell ETH)
          </h4>
          <ul className="text-white/60 text-sm space-y-2 ml-6">
            <li className="list-disc">
              Fast EMA below slow EMA indicates downward momentum
            </li>
            <li className="list-disc">Bot automatically sells ETH for USDC</li>
            <li className="list-disc">Protect capital during price declines</li>
          </ul>
        </div>
      </section>

      <section className="pt-6 border-t border-white/10">
        <h4 className="text-white font-medium mb-3">Why This Works:</h4>
        <p className="text-white/60 text-sm leading-relaxed">
          "The trend is your friend" - By trading in the direction of the trend,
          we increase our probability of successful trades. The bot
          automatically identifies these trends and executes trades accordingly,
          removing emotional bias from trading decisions.
        </p>
      </section>

      <section className="pt-6 border-t border-white/10">
        <h4 className="text-white font-medium mb-3">How the Bot Operates:</h4>
        <ul className="text-white/60 text-sm space-y-3">
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>Continuously monitors EMA crossovers</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>Executes trades only in trend direction</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>Manages risk with position sizing</span>
          </li>
        </ul>
      </section>

      <section className="pt-6 border-t border-white/10">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-500" />
          Fully Decentralized Security
        </h4>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Unlike traditional trading bots that require you to give up control of
          your keys, our solution is fully decentralized. Remember: "Not your
          keys, not your coins."
        </p>
        <ul className="text-white/60 text-sm space-y-3">
          <li className="flex items-center gap-3">
            <Key className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>Session keys always remain in your custody</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>No centralized servers or key storage by the dapp</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>All trades execute directly from your nexus account</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
