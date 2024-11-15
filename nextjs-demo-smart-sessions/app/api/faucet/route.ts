import { NextResponse } from "next/server"
import { type Hex, http, createPublicClient, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { config } from "dotenv"
import MockTokenUSDC from "@/contracts/deployments/base-sepolia/MockToken_USDC.json"
import MockTokenWETH from "@/contracts/deployments/base-sepolia/MockToken_WETH.json"

config()

const MOCK_USDC_ADDRESS = MockTokenUSDC.address as `0x${string}`
const MOCK_WETH_ADDRESS = MockTokenWETH.address as `0x${string}`
const MOCK_USDC_ABI = MockTokenUSDC.abi
const MOCK_WETH_ABI = MockTokenWETH.abi

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}` as Hex)

export async function POST(request: Request) {
  if (!process.env.PRIVATE_KEY) {
    return NextResponse.json(
      { error: "No private key found in environment variables" },
      { status: 500 }
    )
  }

  try {
    const { address: userAddress } = await request.json()

    // Create public client to check balances
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })

    // Check if user already has tokens
    const [usdcBalance, wethBalance] = await Promise.all([
      publicClient.readContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "balanceOf",
        args: [userAddress]
      }) as Promise<bigint>,
      publicClient.readContract({
        address: MOCK_WETH_ADDRESS,
        abi: MOCK_WETH_ABI,
        functionName: "balanceOf",
        args: [userAddress]
      }) as Promise<bigint>
    ])

    // If user already has either token, return early
    if (usdcBalance > 0n || wethBalance > 0n) {
      return NextResponse.json(
        { error: "Tokens already claimed" },
        { status: 400 }
      )
    }

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    })

    const nonce = await publicClient.getTransactionCount({
      address: account.address
    })

    // Send mint transactions directly
    const hash = await walletClient.writeContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [userAddress, 5n * 10n ** 6n],
      nonce
    })
    const hash2 = await walletClient.writeContract({
      address: MOCK_WETH_ADDRESS,
      abi: MOCK_WETH_ABI,
      functionName: "mint",
      args: [userAddress, 1n * 10n ** 15n],
      nonce: nonce + 1
    })

    // Wait for receipts
    const [receipt1, receipt2] = await Promise.all([
      publicClient.waitForTransactionReceipt({ hash }),
      publicClient.waitForTransactionReceipt({ hash: hash2 })
    ])

    if (receipt1.status !== "success" || receipt2.status !== "success") {
      return NextResponse.json({ error: "Transaction failed" }, { status: 500 })
    }

    return NextResponse.json({
      hashes: [receipt1.transactionHash, receipt2.transactionHash]
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error("Simulation or transaction failed:", {
        message: error.message,
        cause: error.cause
      })
      return NextResponse.json(
        { error: `Transaction would fail: ${error.message}` },
        { status: 400 }
      )
    }
    throw error
  }
}
