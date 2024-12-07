import { useState, useCallback } from "react"
import {
  http,
  encodeFunctionData,
  type Hex,
  type LocalAccount,
  encodeAbiParameters,
  erc20Abi
} from "viem"
import { baseSepolia } from "viem/chains"
import {
  MOCK_POOL_ABI,
  MOCK_POOL_ADDRESS,
  MOCK_USDC_ADDRESS
} from "@/app/lib/constants"
import {
  createNexusClient,
  toSmartSessionsValidator,
  smartSessionUseActions,
  type SessionData,
  createBicoPaymasterClient
} from "@biconomy/sdk"
import { amountUSDC } from "../api/faucet/route"

interface UseSwapProps {
  nexusAddress?: Hex
  sessionData?: SessionData
  sessionKeyAccount: LocalAccount
  permissionIdIndex: number
}

export function useSwap({
  nexusAddress,
  sessionData,
  sessionKeyAccount,
  permissionIdIndex = 0 // Assuming this is the correct permission index for swapping
}: UseSwapProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<Hex | null>(null)
  const [success, setSuccess] = useState(false)

  const swap = useCallback(async () => {
    if (!nexusAddress || !sessionData || !sessionKeyAccount) {
      throw new Error("Missing required parameters")
    }

    setIsLoading(true)
    setError(null)
    setHash(null)

    try {
      // Create Nexus client
      const usersNexusClient = await createNexusClient({
        accountAddress: nexusAddress,
        chain: baseSepolia,
        transport: http(),
        bundlerTransport: http(
          "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
        ),
        // @ts-ignore
        signer: sessionKeyAccount,
        paymaster: createBicoPaymasterClient({
          transport: http(process.env.NEXT_PUBLIC_PAYMASTER_URL!)
        })
      })

      // Set up validator module
      const commands = "0x01"
      const inputs = [
        encodeAbiParameters(
          [
            { name: "recipient", type: "address" },
            { name: "zeroForOne", type: "bool" },
            { name: "amountSpecified", type: "int256" }
          ],
          [nexusAddress, false, amountUSDC]
        )
      ]
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600 * 24 * 30) // 30 days

      const executeModule = toSmartSessionsValidator({
        signer: sessionKeyAccount,
        account: usersNexusClient?.account,
        moduleData: { ...sessionData?.moduleData, permissionIdIndex }
      })

      const executeClient = usersNexusClient.extend(
        smartSessionUseActions(executeModule)
      )

      const args = [commands, inputs, deadline]
      const maxApproval = 2n ** 256n - 1n

      const userOpHash = await executeClient.usePermission({
        calls: [
          {
            to: MOCK_USDC_ADDRESS,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [MOCK_POOL_ADDRESS, maxApproval]
            })
          },
          {
            to: MOCK_POOL_ADDRESS,
            data: encodeFunctionData({
              abi: MOCK_POOL_ABI,
              functionName: "execute",
              args
            })
          }
        ]
      })

      // Wait for UserOp receipt
      const userOpReceipt = await usersNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

      if (userOpReceipt.success.toString() !== "true") {
        console.log({ userOpReceipt })
        throw new Error("Swap transaction failed")
      }

      // Wait for transaction receipt
      const txReceipt = await usersNexusClient.waitForTransactionReceipt({
        hash: userOpReceipt.receipt.transactionHash
      })

      if (txReceipt.status !== "success") {
        throw new Error("Transaction failed")
      }

      setHash(userOpReceipt.receipt.transactionHash)
      return userOpReceipt.receipt.transactionHash
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to execute swap")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [nexusAddress, sessionData, sessionKeyAccount, permissionIdIndex])

  return {
    swap,
    isLoading,
    error,
    hash,
    success
  }
}
