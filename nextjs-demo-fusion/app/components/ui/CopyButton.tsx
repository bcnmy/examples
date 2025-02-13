import { Button } from "./button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface CopyButtonProps {
  address?: string
}

export function CopyButton({ address }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleCopy}
      disabled={!address}
    >
      <Copy className={copied ? "text-green-500" : "text-gray-500"} size={16} />
    </Button>
  )
}
