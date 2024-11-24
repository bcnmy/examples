import type { HardhatRuntimeEnvironment } from "hardhat/types"
import type { DeployFunction } from "hardhat-deploy/types"
import { parseEther, parseUnits, maxUint256 } from "viem"
import { INITIAL_PRICE_WETH_PER_USDC } from "../constants"

/**
 * This script deploys a mock Uniswap V3-style environment with:
 * - Mock WETH and USDC tokens
 * - A mock Uniswap V3 pool with WETH/USDC pair
 * - A faucet contract for testing
 *
 * Initial setup:
 * - Pool price: 1 ETH = 4000 USDC
 * - Initial liquidity: 100 WETH + 390,000 USDC
 * - Faucet funding: 10 WETH + 39,000 USDC + 1 ETH
 */

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre
  const { deploy, execute } = deployments
  const { deployer } = await getNamedAccounts()

  // Deploy WETH mock token
  // This represents Wrapped Ether in our test environment
  const weth = await deploy("MockToken_WETH", {
    contract: "MockToken",
    from: deployer,
    args: ["Wrapped Ether", "WETH", parseEther("0"), 18],
    log: true,
    waitConfirmations: network.live ? 5 : 1
  })

  // Deploy USDC mock token
  // This represents USD Coin with 6 decimal places
  const usdc = await deploy("MockToken_USDC", {
    contract: "MockToken",
    from: deployer,
    args: ["USD Coin", "USDC", parseUnits("0", 6), 6],
    log: true,
    waitConfirmations: network.live ? 5 : 1
  })

  // Mint initial token supplies to the deployer
  // These tokens will be used to provide liquidity and fund the faucet
  await execute(
    "MockToken_WETH",
    { from: deployer, log: true },
    "mint",
    deployer,
    parseEther("1000") // 1000 WETH
  )

  await execute(
    "MockToken_USDC",
    { from: deployer, log: true },
    "mint",
    deployer,
    parseUnits("3900000", 6) // 3.9M USDC
  )

  const pool = await deploy("MockPool", {
    from: deployer,
    args: [weth.address, usdc.address],
    log: true,
    waitConfirmations: network.live ? 5 : 1
  })

  // After deploying the pool, set the initial price
  await execute(
    "MockPool",
    { from: deployer, log: true },
    "setCurrentPrice",
    INITIAL_PRICE_WETH_PER_USDC
  )

  // Deploy faucet contract
  // This will be used to distribute test tokens to users
  const faucet = await deploy("Faucet", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.live ? 5 : 1
  })

  // Approve tokens for pool with maximum amounts
  // This allows the pool contract to transfer tokens on behalf of the deployer
  await execute(
    "MockToken_WETH",
    { from: deployer, log: true },
    "approve",
    pool.address,
    maxUint256
  )

  await execute(
    "MockToken_USDC",
    { from: deployer, log: true },
    "approve",
    pool.address,
    maxUint256
  )

  // Transfer initial liquidity to pool
  // This sets up the initial trading pair with a price of 1 ETH = 3900 USDC
  await execute(
    "MockToken_WETH",
    { from: deployer, log: true },
    "transfer",
    pool.address,
    parseEther("100") // 100 WETH
  )

  await execute(
    "MockToken_USDC",
    { from: deployer, log: true },
    "transfer",
    pool.address,
    parseUnits("390000", 6) // 390,000 USDC
  )

  // Fund the faucet with tokens
  // This allows users to request test tokens
  await execute(
    "MockToken_WETH",
    { from: deployer, log: true },
    "transfer",
    faucet.address,
    parseEther("10") // 10 WETH
  )

  await execute(
    "MockToken_USDC",
    { from: deployer, log: true },
    "transfer",
    faucet.address,
    parseUnits("39000", 6) // 39,000 USDC
  )

  // Send some native ETH to the faucet
  // This allows the faucet to pay for gas fees when distributing tokens
  await deployments.rawTx({
    from: deployer,
    to: faucet.address,
    value: parseEther("1").toString() // 1 ETH
  })
}

// Tags allow selective deployment of parts of the system
func.tags = ["Pools", "all"]

export default func
