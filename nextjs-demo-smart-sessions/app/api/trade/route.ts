import { NextResponse } from "next/server"
import { type Hex, http, erc20Abi } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { config } from "dotenv"
import { encodeFunctionData, encodeAbiParameters } from "viem"
import {
  MOCK_POOL_ABI,
  MOCK_POOL_ADDRESS,
  MOCK_USDC_ADDRESS,
  MOCK_WETH_ADDRESS
} from "@/app/lib/constants"
import {
  createBicoPaymasterClient,
  createNexusClient,
  toSmartSessionsValidator,
  smartSessionUseActions
} from "@biconomy/sdk"
import { createPublicClient } from "viem"
import { ApprovalStore } from "@/app/lib/approvalStore"
import { amountUSDC, amountWETH } from "../faucet/route"

config()

const sessionKeyAccount = privateKeyToAccount(
  `0x${process.env.NEXT_PUBLIC_PRIVATE_KEY}` as Hex
)

export async function POST(request: Request) {
  if (!process.env.PRIVATE_KEY) {
    return NextResponse.json(
      { error: "No private key found in environment variables" },
      { status: 500 }
    )
  }

  try {
    const req = await request.json()

    const {
      userAddress,
      isBullish,
      amount: amount_,
      sessionData: sessionData_
    } = req

    // const amount = BigInt(amount_.value)
    const sessionData = JSON.parse(sessionData_)

    // Create a public client to check allowances
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })

    const usersNexusClient = await createNexusClient({
      accountAddress: userAddress,
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

    const isApproved = await ApprovalStore.isApproved(userAddress)

    // Check if user has already approved
    if (!isApproved) {
      console.log({ isApproved })
      const maxApproval = 2n ** 256n - 1n

      // Check token allowance before proceeding
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

      const allowanceIsLessThanAmount = [wethAllowance, usdcAllowance].some(
        (allowance) => allowance < maxApproval
      )

      if (allowanceIsLessThanAmount) {
        console.log("Starting approval process...")

        const approvalReceipts = await approveTokens(
          [MOCK_WETH_ADDRESS, MOCK_USDC_ADDRESS],
          sessionData,
          usersNexusClient
        )

        // Check if all approvals were successful
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

        console.log("All approvals completed successfully")
        await ApprovalStore.setApproved(userAddress)
      }
    }

    const commands = isBullish ? "0x01" : "0x00"
    const inputs = [
      encodeAbiParameters(
        [
          { name: "recipient", type: "address" },
          { name: "zeroForOne", type: "bool" },
          { name: "amountSpecified", type: "int256" }
        ],
        [userAddress, !isBullish, isBullish ? amountUSDC : amountWETH]
      )
    ]
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600 * 24 * 30) // 30 days

    const executeModule = toSmartSessionsValidator({
      signer: sessionKeyAccount,
      account: usersNexusClient?.account,
      moduleData: sessionData?.moduleData
    })

    const executeClient = usersNexusClient.extend(
      smartSessionUseActions(executeModule)
    )

    const args = [commands, inputs, deadline]

    console.log("args", { args })

    const userOpHash = await executeClient.usePermission({
      calls: [
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

    console.log("userOpHash", { userOpHash })

    if (!userOpHash) {
      return NextResponse.json(
        { error: "UserOperation failed" },
        { status: 500 }
      )
    }

    const userOpReceipt = await usersNexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    if (userOpReceipt.success.toString() !== "true") {
      return NextResponse.json(
        {
          error: "Transaction failed",
          details: `Transaction reverted${userOpReceipt.reason ? `: ${userOpReceipt.reason}` : ""}`,
          userOpHash,
          transactionHash: userOpReceipt.receipt.transactionHash
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userOpHash,
      transactionHash: userOpReceipt.receipt.transactionHash
    })
  } catch (error) {
    console.error("Trade execution failed:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Transaction would fail",
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
  sessionData: any,
  usersNexusClient: any
) {
  console.log("=== Starting Token Approvals ===")
  const maxApproval = 2n ** 256n - 1n
  const receipts = []

  for (let i = 0; i < tokens.length; i++) {
    const tokenAddress = tokens[i]
    const permissionIdIndex = i + 1

    console.log(`Approving token ${i + 1}/${tokens.length}: ${tokenAddress}`)

    try {
      const module = toSmartSessionsValidator({
        signer: sessionKeyAccount,
        account: usersNexusClient?.account,
        moduleData: {
          ...sessionData?.moduleData,
          permissionIdIndex
        }
      })

      const client = usersNexusClient.extend(smartSessionUseActions(module))

      // Execute approval
      const userOpHash = await client.usePermission({
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
