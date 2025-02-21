import { Card } from "./ui/card"
import {
  Loader2,
  Link as LinkFromLucide,
  ExternalLinkIcon,
  CheckCircleIcon
} from "lucide-react"
import Link from "next/link"
import {
  type WaitForSupertransactionReceiptPayload,
  type MeeClient,
  getExplorerTxLink,
  getChain,
  getMeeScanLink,
  getJiffyScanLink
} from "@biconomy/abstractjs"
import type { Hex, TransactionReceipt } from "viem"
import { useEffect, useState } from "react"
import React from "react"
import Confetti from "react-confetti"

type SuperTransactionStatusProps = {
  meeClient: MeeClient | null
  hash: Hex | null
}

export const SuperTransactionStatus = ({
  meeClient,
  hash
}: SuperTransactionStatusProps) => {
  const [receipt, setReceipt] =
    useState<WaitForSupertransactionReceiptPayload | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!hash || !meeClient) return
    const interval = setInterval(async () => {
      const receipt = await meeClient.getSupertransactionReceipt({ hash })
      if (receipt) {
        setReceipt(receipt)
      }
      if (receipt?.transactionStatus === "SUCCESS") {
        setShowConfetti(true)
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000)
        clearInterval(interval)
      }
    }, 3000)
  }, [hash, meeClient])

  if (!hash) return null

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      <Card className="w-full max-w-sm mx-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">Supertransaction Status</h3>
          <div className="flex items-center gap-2">
            {receipt?.transactionStatus === "SUCCESS" ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span className="text-xs text-gray-500">
              {receipt?.transactionStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={getMeeScanLink(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-500 hover:text-blue-600 text-xs gap-2"
          >
            <ExternalLinkIcon className="h-3 w-3" />
            <span className="text-xs font-medium">
              View Supertransaction on MEE Scan
            </span>
          </Link>

          {receipt &&
            receipt?.userOps.length > 0 &&
            receipt?.userOps.map((userOp: any, i: number) => {
              if (i === 0) return null // Skip the first settlement as it's the supertransaction fee
              const receiptFromChain = receipt?.receipts?.[
                i
              ] as PromiseFulfilledResult<TransactionReceipt>
              const transactionHash = receiptFromChain?.value?.transactionHash

              const link = transactionHash
                ? getExplorerTxLink(transactionHash, userOp.chainId)
                : getJiffyScanLink(userOp?.userOpHash)

              return (
                <div
                  key={transactionHash}
                  className="flex items-center justify-between w-full"
                >
                  <div>
                    <Link
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                      <span className="text-xs">
                        {i}.{getChain(Number(userOp.chainId)).name}
                      </span>
                    </Link>
                  </div>
                  <div>
                    {receiptFromChain.status === "fulfilled" ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <Loader2
                        key={transactionHash + (i + 1)}
                        className="h-4 w-4 animate-spin"
                      />
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </Card>
    </>
  )
}
