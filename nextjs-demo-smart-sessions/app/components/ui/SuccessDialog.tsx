import { Card } from "./card"
import { X, Trophy, Cookie } from "lucide-react"
import { Button } from "./button"

interface SuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  txHash: string
}

export function SuccessDialog({ isOpen, onClose, txHash }: SuccessDialogProps) {
  if (!isOpen) return null

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <Card className="fixed inset-x-4 top-[10%] md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 bg-white p-8 max-w-md shadow-xl z-50 rounded-xl">
        <Button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="space-y-6 text-center">
          <div className="flex justify-center space-x-3">
            <Trophy className="h-12 w-12 text-yellow-400" />
            <Cookie className="h-12 w-12 text-amber-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 Congratulations!
            </h2>
            <p className="text-gray-600">
              You've successfully completed the trade and won a cookie! 🍪
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <p className="text-gray-600 mb-2">Transaction Hash:</p>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 break-all font-mono"
            >
              {txHash}
            </a>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            Claim Your Victory! 🏆
          </Button>
        </div>
      </Card>
    </>
  )
}
