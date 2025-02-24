import { useCallback, useEffect, useState } from "react"
import { useMarketStore } from "@/app/stores/marketStore"
import {
  toSmartSessionsValidator,
  smartSessionCreateActions,
  stringify,
  type SessionData
} from "@biconomy/abstractjs"
import {
  MOCK_POOL_ADDRESS,
  MOCK_WETH_ADDRESS,
  MOCK_USDC_ADDRESS
} from "../lib/constants"
import { type Hex, slice, toFunctionSelector } from "viem"

export const SmartSessionMode = {
  USE: "0x00" as Hex,
  ENABLE: "0x01" as Hex,
  UNSAFE_ENABLE: "0x02" as Hex
} as const

export function useGrantPermissions() {
  const { nexusClient, nexusAddress, setMarketStatus } = useMarketStore()
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

  // Watch for changes in localStorage and update marketStore
  useEffect(() => {
    const checkSessionStatus = () => {
      const saved = localStorage.getItem(`session_${nexusAddress}`)
      if (saved) {
        setMarketStatus("active")
      } else {
        setMarketStatus("inactive")
      }
    }

    // Initial check
    checkSessionStatus()

    // Listen for storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `session_${nexusAddress}`) {
        checkSessionStatus()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [nexusAddress, setMarketStatus])

  const grantTradePermission = useCallback(async () => {
    console.log("grantTradePermission", nexusClient, nexusAddress)

    if (!nexusClient || !nexusAddress) return

    try {
      setStatus("enabling")

      // Generate a session key for the dapp owner
      const sessionPublicKey: Hex = "0x3079B249DFDE4692D7844aA261f8cf7D927A0DA5"

      // Create sessions module
      const sessionsModule = toSmartSessionsValidator({
        account: nexusClient.account,
        signer: nexusClient.account.signer
      })

      // Install module if not already installed
      const hash = await nexusClient.installModule({
        module: sessionsModule.moduleInitData,
        account: nexusClient.account
      })
      await nexusClient.waitForUserOperationReceipt({ hash })

      setStatus("granting")

      // Create session client
      const nexusSessionClient = nexusClient.extend(
        smartSessionCreateActions(sessionsModule)
      )

      const executeSelector = slice(
        toFunctionSelector("execute(bytes,bytes[],uint256)"),
        0,
        4
      )

      const approveSelector = slice(
        toFunctionSelector("approve(address,uint256)"),
        0,
        4
      )

      // Grant permission
      const createSessionsResponse = await nexusSessionClient.grantPermission({
        sessionRequestedInfo: [
          {
            sessionPublicKey,
            sessionValidUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now, applies to all userOperations
            actionPoliciesInfo: [
              {
                contractAddress: MOCK_POOL_ADDRESS,
                functionSelector: executeSelector,
                sudo: true,
                validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 // Ends after 7 days
              },
              {
                contractAddress: MOCK_WETH_ADDRESS,
                functionSelector: approveSelector,
                sudo: true,
                validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 // Ends after 7 days
              },
              {
                contractAddress: MOCK_USDC_ADDRESS,
                functionSelector: approveSelector,
                sudo: true,
                validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 // Ends after 7 days
              }
            ]
          }
        ]
      })

      // Create and save session data
      const newSessionData: SessionData = {
        granter: nexusAddress,
        sessionPublicKey,
        moduleData: {
          ...createSessionsResponse,
          mode: SmartSessionMode.USE
        }
      }

      setUserOpHash(createSessionsResponse.userOpHash)

      const compressed = stringify(newSessionData)
      localStorage.setItem(`session_${nexusAddress}`, compressed)
      setSessionData(compressed)
      setStatus("granted")
      setMarketStatus("active")
    } catch (error) {
      console.error("Error granting trade permission:", error)
      setStatus("error")
      throw error
    }
  }, [nexusClient, nexusAddress, setMarketStatus])

  return {
    sessionData,
    status,
    grantTradePermission,
    userOpHash,
    transactionHash
  }
}
