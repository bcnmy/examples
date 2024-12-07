import { Button } from "@/app/components/ui/button"
import { SheetTrigger } from "@/app/components/ui/sheet"

interface TradingTrayTriggerProps {
  isBullish: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradingTrayTrigger({ isBullish, onOpenChange }: TradingTrayTriggerProps) {
  return (
    <SheetTrigger asChild onClick={() => onOpenChange(true)}>
      <Button 
        variant="default"
        className={`font-bold
          ${isBullish 
            ? 'bg-emerald-500/80 hover:bg-emerald-400/90' 
            : "bg-bearish/80 hover:bg-bearish-light/90"
          } text-white border-0`}
      >
        Trade
      </Button>
    </SheetTrigger>
  )
}