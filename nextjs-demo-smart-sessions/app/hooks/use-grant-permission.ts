import { useCallback, useEffect, useState } from "react"
import { useMarketStore } from "@/app/stores/marketStore"
import {
  toSmartSessionsValidator,
  smartSessionCreateActions
} from "@biconomy/sdk"
import { SmartSessionMode } from "@rhinestone/module-sdk/module"
import {
  MOCK_POOL_ADDRESS,
  MOCK_WETH_ADDRESS,
  MOCK_USDC_ADDRESS
} from "../lib/constants"
import { type Hex, slice, toFunctionSelector } from "viem"

export function useGrantPermissions() {
  const { nexusClient, nexusAddress } = useMarketStore()
  const [sessionData, setSessionData] = useState<string | null>(null)
  const [status, setStatus] = useState<
    "idle" | "enabling" | "granting" | "granted" | "error"
  >("idle")
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)
  const [transactionHash, setTransactionHash] = useState<Hex | null>(null)

  // Load any existing session data
  useEffect(() => {
    const saved = localStorage.getItem(`session_${nexusAddress}`)
    if (saved) setSessionData(saved)
  }, [nexusAddress])

  useEffect(() => {
    const fetchTransactionHash = async () => {
      if (userOpHash && nexusClient) {
        const {
          success,
          receipt: { transactionHash }
        } = await nexusClient.waitForUserOperationReceipt({
          hash: userOpHash
        })

        if (success) setTransactionHash(transactionHash)
      }
    }

    fetchTransactionHash()
  }, [userOpHash, nexusClient])

  const grantTradePermission = useCallback(async () => {
    if (!nexusClient || !nexusAddress) return

    try {
      setStatus("enabling")

      // Generate a session key for the dapp owner
      const sessionPublicKey = "0x3079B249DFDE4692D7844aA261f8cf7D927A0DA5"

      // Create sessions module
      const sessionsModule = toSmartSessionsValidator({
        account: nexusClient.account,
        signer: nexusClient.account.signer
      })

      // Install module if not already installed
      const hash = await nexusClient.installModule({
        module: sessionsModule.moduleInitData
      })
      await nexusClient.waitForUserOperationReceipt({ hash })

      setStatus("granting")

      // Create session client
      const nexusSessionClient = nexusClient.extend(
        smartSessionCreateActions(sessionsModule)
      )

      const functionSelector = slice(
        toFunctionSelector("execute(bytes,bytes[],uint256)"),
        0,
        4
      )

      const approveSelector = slice(
        toFunctionSelector("approve(address,uint256)"),
        0,
        4
      )

      // Define permissions for execute function
      const sessionRequestedInfo = [
        {
          sessionKeyData: sessionPublicKey as Hex,
          actionPoliciesInfo: [
            {
              contractAddress: MOCK_POOL_ADDRESS,
              functionSelector
            }
          ]
        },
        {
          sessionKeyData: sessionPublicKey as Hex,
          actionPoliciesInfo: [
            {
              contractAddress: MOCK_WETH_ADDRESS,
              functionSelector: approveSelector
            }
          ]
        },
        {
          sessionKeyData: sessionPublicKey as Hex,
          actionPoliciesInfo: [
            {
              contractAddress: MOCK_USDC_ADDRESS,
              functionSelector: approveSelector
            }
          ]
        }
      ]

      // Grant permission
      const createSessionsResponse = await nexusSessionClient.grantPermission({
        sessionRequestedInfo
      })

      // Create and save session data
      const newSessionData = {
        granter: nexusAddress,
        sessionPublicKey,
        moduleData: {
          permissionIds: createSessionsResponse.permissionIds,
          mode: SmartSessionMode.USE
        }
      }

      setUserOpHash(createSessionsResponse.userOpHash)

      const compressed = JSON.stringify(newSessionData)
      localStorage.setItem(`session_${nexusAddress}`, compressed)
      setSessionData(compressed)
      setStatus("granted")
    } catch (error) {
      console.error("Error granting trade permission:", error)
      setStatus("error")
      throw error
    }
  }, [nexusClient, nexusAddress])

  return {
    sessionData,
    status,
    grantTradePermission,
    userOpHash,
    transactionHash
  }
}
