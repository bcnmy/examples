import { NextResponse } from "next/server"
import { type Hex, http, erc20Abi, createPublicClient, maxUint256 } from "viem"
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
  smartSessionUseActions,
  parse,
  type SessionData
} from "@biconomy/sdk"
import { ApprovalStore } from "@/app/lib/approvalStore"
import { amountUSDC, amountWETH } from "../faucet/route"

config()

const pKey: Hex = `0x${process.env.PRIVATE_KEY}`
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

    const { userAddress, isBullish, sessionData: sessionData_ } = req

    const sessionData = parse(sessionData_) as SessionData

    const isApproved = await ApprovalStore.isApproved(userAddress)
    if (!isApproved) {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      })

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
        (allowance) => allowance < maxUint256
      )

      if (allowanceIsLessThanAmount) {
        return NextResponse.json(
          { error: "Tokens not approved" },
          { status: 400 }
        )
      }
      await ApprovalStore.setApproved(userAddress)
    }

    const usersNexusClient = await createNexusClient({
      accountAddress: userAddress,
      chain: baseSepolia,
      transport: http(),
      bundlerTransport: http(
        "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
      ),
      signer: sessionKeyAccount,
      paymaster: createBicoPaymasterClient({
        transport: http(process.env.NEXT_PUBLIC_PAYMASTER_URL!)
      })
    })

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
          details: `Tx reverted ${userOpReceipt.reason ? `: ${userOpReceipt.reason}` : ""}`,
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
