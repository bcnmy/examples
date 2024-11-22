import { viem } from "hardhat"
import type {
  GetContractReturnType,
  Hex,
  PublicClient,
  WalletClient
} from "viem"
import { deployContract } from "../utils/deploy"
import type {
  Faucet__factory,
  MockToken__factory,
  MockPool__factory
} from "../typechain-types/factories/contracts"
import { POOL_FEE } from "../constants"

type DeployFaucetFixture = {
  faucet: GetContractReturnType<typeof Faucet__factory.abi>
  weth: GetContractReturnType<typeof MockToken__factory.abi>
  usdc: GetContractReturnType<typeof MockToken__factory.abi>
  pool: GetContractReturnType<typeof MockPool__factory.abi>
  owner: WalletClient
  user: WalletClient
  publicClient: PublicClient
}

// Constants for token configuration
export const WETH_DECIMALS = 18
export const USDC_DECIMALS = 6
export const WETH_NAME = "Wrapped Ether"
export const WETH_SYMBOL = "WETH"
export const USDC_NAME = "USD Coin"
export const USDC_SYMBOL = "USDC"

// Helper functions for decimal processing
export function parseWETH(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** WETH_DECIMALS))
}

export function parseUSDC(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** USDC_DECIMALS))
}

export function formatWETH(amount: bigint): number {
  return Number(amount) / 10 ** WETH_DECIMALS
}

export function formatUSDC(amount: bigint): number {
  return Number(amount) / 10 ** USDC_DECIMALS
}

// Initial supplies in human-readable amounts
export const INITIAL_SUPPLY_WETH = parseWETH(1000) // 1000 WETH
export const INITIAL_SUPPLY_USDC = parseUSDC(1000) // 1000 USDC
export const FAUCET_AMOUNT_WETH = parseWETH(10) // 10 WETH
export const FAUCET_AMOUNT_USDC = parseUSDC(10) // 10 USDC
export const FAUCET_ETH = 100n * 10n ** 18n // 100 ETH instead of 10000
export const CURRENT_PRICE_WETH_PER_USDC = 3900n * 10n ** BigInt(USDC_DECIMALS) // 3900 * 1e6

export async function deployFaucetFixture(): Promise<DeployFaucetFixture> {
  const [owner, user] = await viem.getWalletClients()
  const publicClient = await viem.getPublicClient()

  // Deploy Faucet
  const faucetContract = await deployContract("Faucet", [])
  const faucet = await viem.getContractAt("Faucet", faucetContract.address)

  // Deploy WETH Mock Token
  const wethContract = await deployContract("MockToken", [
    WETH_NAME,
    WETH_SYMBOL,
    INITIAL_SUPPLY_WETH,
    WETH_DECIMALS
  ])
  const weth = await viem.getContractAt("MockToken", wethContract.address)

  // Deploy USDC Mock Token
  const usdcContract = await deployContract("MockToken", [
    USDC_NAME,
    USDC_SYMBOL,
    INITIAL_SUPPLY_USDC,
    USDC_DECIMALS
  ])
  const usdc = await viem.getContractAt("MockToken", usdcContract.address)

  // Deploy MockPool
  const poolContract = await deployContract("MockPool", [
    weth.address,
    usdc.address,
    POOL_FEE
  ])
  const pool = await viem.getContractAt("MockPool", poolContract.address)

  // Significantly increase pool's initial liquidity
  const poolLiquidityWETH = parseWETH(1000) // 1000 WETH
  const poolLiquidityUSDC = parseUSDC(3900000) // 3.9M USDC (3900 USDC per WETH * 1000)

  await weth.write.mint([pool.address, poolLiquidityWETH])
  await usdc.write.mint([pool.address, poolLiquidityUSDC])

  // Fund the faucet with more ETH
  await owner.sendTransaction({
    to: faucet.address as Hex,
    value: FAUCET_ETH
  })

  // Fund the faucet
  await weth.write.mint([faucet.address, FAUCET_AMOUNT_WETH])
  await usdc.write.mint([faucet.address, FAUCET_AMOUNT_USDC])

  return { faucet, weth, usdc, pool, owner, user, publicClient }
}

export default deployFaucetFixture
