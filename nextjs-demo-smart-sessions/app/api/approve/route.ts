import { NextResponse } from "next/server"
import { type Hex, http, erc20Abi, stringify } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { config } from "dotenv"
import { encodeFunctionData } from "viem"
import {
  MOCK_POOL_ADDRESS,
  MOCK_USDC_ADDRESS,
  MOCK_WETH_ADDRESS
} from "@/app/lib/constants"
import {
  createNexusClient,
  toSmartSessionsValidator,
  smartSessionUseActions,
  parse,
  type SessionData,
  type NexusClient,
  toNexusAccount,
  createBicoPaymasterClient
} from "@biconomy/abstractjs"
import { createPublicClient } from "viem"
import { ApprovalStore } from "@/app/lib/approvalStore"

config()

const pKey: Hex = `0x${process.env.DAPP_PRIVATE_KEY}`
const sessionKeyAccount = privateKeyToAccount(pKey)

export async function POST(request: Request) {
  if (!process.env.PRIVATE_KEY) {
    return NextResponse.json(
      { error: "No private key found in environment variables" },
      { status: 500 }
    )
  }

  try {
    const req = await request.json()
    const { userAddress, sessionData: sessionData_ } = req
    const sessionData = parse(sessionData_) as SessionData

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })

    const nexusAccount = await toNexusAccount({
      accountAddress: userAddress,
      signer: sessionKeyAccount,
      transport: http(),
      chain: baseSepolia
    })

    const usersNexusClient = createNexusClient({
      account: nexusAccount,
      transport: http(
        "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
      ),
      paymaster: createBicoPaymasterClient({
        transport: http(process.env.NEXT_PUBLIC_PAYMASTER_URL!)
      })
    })

    const maxApproval = 2n ** 256n - 1n

    // Check token allowance
    const [wethAllowance, usdcAllowance] = await Promise.all(
      [MOCK_WETH_ADDRESS, MOCK_USDC_ADDRESS].map((tokenAddress_) => {
        return publicClient.readContract({
          address: tokenAddress_,
          abi: erc20Abi,
          functionName: "allowance",
          args: [userAddress, MOCK_POOL_ADDRESS]
        })
      })
    )

    console.log({ wethAllowance, usdcAllowance })

    const allowanceIsLessThanAmount = [wethAllowance, usdcAllowance].some(
      (allowance) => allowance < maxApproval
    )

    if (!allowanceIsLessThanAmount) {
      await ApprovalStore.setApproved(userAddress)
      return NextResponse.json({ status: "already-approved" })
    }

    const approvalReceipts = await approveTokens(
      [MOCK_WETH_ADDRESS, MOCK_USDC_ADDRESS],
      sessionData,
      usersNexusClient
    )

    const allApprovalsSuccessful = approvalReceipts.every(
      ({ userOpReceipt, txReceipt }) =>
        userOpReceipt.success.toString() === "true" &&
        txReceipt.status === "success"
    )

    if (!allApprovalsSuccessful) {
      return NextResponse.json(
        { error: "One or more approvals failed" },
        { status: 500 }
      )
    }

    await ApprovalStore.setApproved(userAddress)
    return NextResponse.json({
      status: "success",
      approvalReceipts: stringify(approvalReceipts)
    })
  } catch (error) {
    console.error("Approval failed:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Trade failed",
          details: error.message,
          cause: error.cause ? String(error.cause) : undefined
        },
        { status: 400 }
      )
    }
    throw error
  }
}

async function approveTokens(
  tokens: Hex[],
  sessionData: SessionData,
  usersNexusClient: NexusClient
) {
  if (!usersNexusClient) {
    throw new Error("Nexus client not found")
  }

  console.log("=== Starting Token Approvals ===", tokens)
  const maxApproval = 2n ** 256n - 1n
  const receipts = []

  for (let i = 0; i < tokens.length; i++) {
    const tokenAddress = tokens[i]

    console.log(`Approving token ${i + 1}/${tokens.length}: ${tokenAddress}`)
    console.log("sessionData", sessionData)

    try {
      const sessionsModule = toSmartSessionsValidator({
        signer: sessionKeyAccount,
        account: usersNexusClient.account,
        moduleData: sessionData.moduleData
      })
      const smartSessionClient = usersNexusClient.extend(
        smartSessionUseActions(sessionsModule)
      )

      console.log(
        "smartSessionClient.account.address",
        smartSessionClient.account.address
      )

      // Execute approval
      const userOpHash = await smartSessionClient.usePermission({
        calls: [
          {
            to: tokenAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [MOCK_POOL_ADDRESS, maxApproval]
            })
          }
        ]
      })

      console.log("userOpHash", userOpHash)

      console.log(`UserOp hash received for token ${tokenAddress}:`, userOpHash)

      // Wait for UserOp receipt
      const userOpReceipt = await usersNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })
      console.log(`UserOp receipt received for token ${tokenAddress}:`, {
        success: userOpReceipt.success,
        txHash: userOpReceipt.receipt.transactionHash
      })

      // Wait for transaction receipt
      const txReceipt = await usersNexusClient.waitForTransactionReceipt({
        hash: userOpReceipt.receipt.transactionHash
      })
      console.log(`Transaction receipt received for token ${tokenAddress}:`, {
        status: txReceipt.status,
        blockNumber: txReceipt.blockNumber
      })

      receipts.push({ userOpReceipt, txReceipt })
    } catch (error) {
      console.error(`Error approving token ${tokenAddress}:`, error)
      throw error
    }
  }

  return receipts
}
