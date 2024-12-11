import { Button } from "./button"
import { Card } from "./card"
import { ExternalLink, X } from "lucide-react"

interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskDialog({ isOpen, onClose }: TaskDialogProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="fixed inset-x-4 top-[10%] md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 bg-white p-8 max-w-2xl shadow-xl z-50 rounded-xl">
        {/* Close button */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-blue-600">
            🏆 Workshop Challenge
          </h2>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Mission:
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Create a smart session that grants permission to the dapp to
              execute trades on your behalf. First team to successfully buy WETH
              wins!
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Steps:</h3>
            <ol className="text-gray-700 list-decimal list-inside space-y-2">
              <li>Grab a partner (Groups of two or three)</li>
              <li>Read the documentation on granting permissions</li>
              <li>Write code to grant necessary permissions to the dapp</li>
              <li>Test your implementation using this interface</li>
              <li>Successfully execute a WETH purchase</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Resources:</h3>
            <div className="space-y-2">
              <a
                href="https://docs.biconomy.io/modules/validators/smartSessions/creatingSmartSessions#grantpermission"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
              >
                Smart Sessions Documentation{" "}
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://bcnmy.github.io/sdk/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
              >
                API Reference <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-gray-700">
              <span className="font-semibold">💡 Tip:</span> Use the info panel
              for important addresses and URLs you&apos;ll need.
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}
