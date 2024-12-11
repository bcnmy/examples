import type { HardhatRuntimeEnvironment } from "hardhat/types"
import type { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, network } = hre

  // Only verify on live networks
  if (!network.live) return

  console.log("Starting contract verification...")

  try {
    // Get deployment info
    const weth = await deployments.get("MockToken_WETH")
    const usdc = await deployments.get("MockToken_USDC")
    const pool = await deployments.get("MockPool")
    const faucet = await deployments.get("Faucet")

    console.log("Verifying WETH...")
    await hre.run("verify:verify", {
      address: weth.address,
      constructorArguments: ["Wrapped Ether", "WETH", "0", "18"]
    })

    console.log("Verifying USDC...")
    await hre.run("verify:verify", {
      address: usdc.address,
      constructorArguments: ["USD Coin", "USDC", "0", "6"]
    })

    console.log("Verifying Pool...")
    await hre.run("verify:verify", {
      address: pool.address,
      constructorArguments: [weth.address, usdc.address]
    })

    console.log("Verifying Faucet...")
    await hre.run("verify:verify", {
      address: faucet.address,
      constructorArguments: []
    })

    console.log("Verification complete!")

    // Log all addresses
    console.log("\nDeployed Addresses:")
    console.log("------------------")
    console.log("WETH:", weth.address)
    console.log("USDC:", usdc.address)
    console.log("Pool:", pool.address)
    console.log("Faucet:", faucet.address)
  } catch (error) {
    console.error("Verification error:", error)
    // Don't throw, allow deployment to succeed even if verification fails
  }
}

func.tags = ["Verify"]
func.dependencies = ["Pools"] // Run after Pools deployment

export default func
