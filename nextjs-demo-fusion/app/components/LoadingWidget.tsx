export function LoadingWidget() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Main coin circle */}
        <div
          className="w-16 h-16 border-4 border-cyan-400 rounded-full animate-[spin_3s_linear_infinite] 
          before:content-['Ξ'] before:absolute before:text-2xl before:text-cyan-400 before:top-1/2 before:left-1/2 
          before:-translate-x-1/2 before:-translate-y-1/2 before:font-mono
          shadow-[0_0_15px_rgba(34,211,238,0.5)]"
        >
          {/* Inner spinning ring */}
          <div
            className="absolute inset-0 border-4 border-dashed border-purple-500 rounded-full 
            animate-[spin_4s_linear_infinite_reverse]"
          />
        </div>
        {/* Glowing dots */}
        <div
          className="absolute -top-1 left-1/2 w-2 h-2 bg-cyan-400 rounded-full 
          animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(34,211,238,0.8)]"
        />
        <div
          className="absolute -bottom-1 left-1/2 w-2 h-2 bg-purple-500 rounded-full 
          animate-[pulse_1.5s_ease-in-out_infinite_0.5s] shadow-[0_0_10px_rgba(168,85,247,0.8)]"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-medium text-cyan-400 animate-pulse">
          Checking balances...
        </p>
      </div>
    </div>
  )
}
