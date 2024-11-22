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

config()

const sessionKeyAccount = privateKeyToAccount(
  `0x${process.env.PRIVATE_KEY}` as Hex
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

    const amount = BigInt(amount_.value)
    const sessionData = JSON.parse(sessionData_)

    console.log(`signal to trade ${isBullish ? "buy" : "sell"} ${amount}`)

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
      console.log("not approved", { isApproved })

      // Check token allowance before proceeding
      const tokenAddress = isBullish ? MOCK_WETH_ADDRESS : MOCK_USDC_ADDRESS
      const allowance = (await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [userAddress, MOCK_POOL_ADDRESS]
      })) as bigint

      const allowanceIsLessThanAmount = allowance < amount

      console.log(
        `allowanceIsLessThanAmount: ${allowanceIsLessThanAmount}: allowance: ${allowance}, amount: ${amount}`
      )

      if (allowanceIsLessThanAmount) {
        console.log("approving...")

        const maxApproval = 2n ** 256n - 1n
        const userOperationReceipts = await Promise.all(
          [MOCK_WETH_ADDRESS, MOCK_USDC_ADDRESS].map((tokenAddress, index) => {
            const module = toSmartSessionsValidator({
              signer: sessionKeyAccount,
              account: usersNexusClient?.account,
              moduleData: {
                ...sessionData?.moduleData,
                permissionIdIndex: index + 1
              }
            })

            const client = usersNexusClient.extend(
              smartSessionUseActions(module)
            )

            return client.usePermission({
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
          })
        )

        console.log("userOperationReceipts", { userOperationReceipts })

        // Now we wait for all the hashes to be mined
        const uoHashes = await Promise.all(
          userOperationReceipts.map((hash) =>
            usersNexusClient.waitForUserOperationReceipt({ hash })
          )
        )

        console.log("uoHashes", { uoHashes })

        // If any of the hashes fail, we return an error
        if (uoHashes.some((uoHash) => uoHash.success.toString() !== "true")) {
          console.log("uoHashes failed", { uoHashes })

          return NextResponse.json(
            { error: "Approval failed" },
            { status: 500 }
          )
        }

        // Now wait for the transactions to be mined
        const txReceipts = await Promise.all(
          uoHashes.map((uoHash) =>
            usersNexusClient.waitForTransactionReceipt({
              hash: uoHash.receipt.transactionHash
            })
          )
        )

        console.log("txReceipts", { txReceipts })

        // If any of the transactions fail, we return an error
        if (txReceipts.some((txReceipt) => txReceipt.status !== "success")) {
          return NextResponse.json(
            {
              error: "Approval failed",
              details: "Token approval transaction failed. Please try again."
            },
            { status: 500 }
          )
        }
      }
      // After successful approval
      await ApprovalStore.setApproved(userAddress)
    }

    const commands = isBullish ? "0x01" : "0x00"
    const inputs = [
      encodeAbiParameters(
        [
          { name: "recipient", type: "address" },
          { name: "zeroForOne", type: "bool" },
          { name: "amountSpecified", type: "int256" }
        ],
        [userAddress, !isBullish, amount]
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

    const txReceipt = await usersNexusClient.waitForTransactionReceipt({
      hash: userOpReceipt.receipt.transactionHash
    })

    console.log("txReceipt", { txReceipt })

    if (txReceipt.status !== "success") {
      return NextResponse.json(
        {
          error: "Transaction failed",
          details: `Status: ${txReceipt.status}`,
          userOpHash,
          transactionHash: txReceipt.transactionHash
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
