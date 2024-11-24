import React from "react"

export function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case "preparing":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
      case "trading":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50"
      case "submitted":
        return "bg-purple-500/20 text-purple-500 border-purple-500/50"
      case "confirmed":
        return "bg-green-500/20 text-green-500 border-green-500/50"
      case "error":
        return "bg-red-500/20 text-red-500 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/50"
    }
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
    >
      {status.toUpperCase()}
    </span>
  )
}
