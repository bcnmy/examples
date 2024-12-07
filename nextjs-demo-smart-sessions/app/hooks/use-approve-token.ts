import { useState, useCallback } from "react"
import {
  http,
  erc20Abi,
  encodeFunctionData,
  type Hex,
  type LocalAccount,
  type Address
} from "viem"
import { baseSepolia } from "viem/chains"
import { MOCK_POOL_ADDRESS, MOCK_USDC_ADDRESS } from "@/app/lib/constants"
import {
  createNexusClient,
  toSmartSessionsValidator,
  smartSessionUseActions,
  createBicoPaymasterClient,
  type SessionData
} from "@biconomy/sdk"

interface UseApproveTokenProps {
  nexusAddress?: Address
  sessionData?: SessionData
  sessionKeyAccount?: LocalAccount
  permissionIdIndex?: number
}

export function useApproveToken({
  nexusAddress,
  sessionData,
  sessionKeyAccount,
  permissionIdIndex = 0 // Assuming this is the correct permission index for USDC approval
}: UseApproveTokenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<Hex | null>(null)

  const approve = useCallback(async () => {
    console.log("testing approval")

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
      const module = toSmartSessionsValidator({
        signer: sessionKeyAccount,
        account: usersNexusClient?.account,
        moduleData: {
          ...sessionData?.moduleData,
          permissionIdIndex
        }
      })

      // Create client with smart session actions
      const client = usersNexusClient.extend(smartSessionUseActions(module))

      // Maximum approval amount
      const maxApproval = 2n ** 256n - 1n

      // Execute approval
      const userOpHash = await client.usePermission({
        calls: [
          {
            to: MOCK_USDC_ADDRESS,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [MOCK_POOL_ADDRESS, maxApproval]
            })
          }
        ]
      })

      // Wait for UserOp receipt
      const userOpReceipt = await usersNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

      if (userOpReceipt.success.toString() !== "true") {
        throw new Error("Approval transaction failed")
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
        err instanceof Error ? err : new Error("Failed to approve token")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [nexusAddress, sessionData, sessionKeyAccount, permissionIdIndex])

  return {
    approve,
    isLoading,
    error,
    hash
  }
}
