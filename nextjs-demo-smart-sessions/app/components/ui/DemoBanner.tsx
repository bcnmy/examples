import { useState } from "react"
import { X, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAutoClaim } from "@/app/hooks/use-auto-claim"

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true)
  useAutoClaim()

  const handleClose = () => {
    localStorage.setItem("demoBannerClosed", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-emerald-500/20 via-purple-500/10 to-transparent 
            border-b border-white/10 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-3 relative">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <p className="text-sm font-medium text-white">
              Welcome to the demo!{" "}
              <span className="text-emerald-400">
                We&apos;ll send you test tokens to try it out
              </span>
            </p>
            <Loader2 className="w-4 h-4 animate-spin text-white/60" />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 
                text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
