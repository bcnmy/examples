import { useToast } from "@/app/hooks/use-toast"
import { Button } from "./button"
import { useAccount } from "wagmi"
import { ExternalLink } from "lucide-react"

export function FaucetButton() {
  const { toast } = useToast()
  const { address: eoaAddress } = useAccount()

  const handleFaucetClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!eoaAddress) throw new Error("No EOA address provided")

    try {
      await navigator.clipboard.writeText(eoaAddress)
      toast({
        title: "Address Copied!",
        description: `${eoaAddress.slice(0, 4)}...${eoaAddress.slice(-4)} copied to clipboard. Redirecting to faucet...`
      })

      setTimeout(() => {
        window.open("https://faucet.circle.com", "_blank")
      }, 1500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address to clipboard",
        variant: "destructive"
      })
    }
  }

  return (
    <Button onClick={handleFaucetClick} variant="ghost">
      Get USDC
      <ExternalLink className="ml-2 h-3 w-3" />
    </Button>
  )
}
