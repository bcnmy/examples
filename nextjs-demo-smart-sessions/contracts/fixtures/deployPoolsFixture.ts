import { deployments, viem } from "hardhat";

export async function deployPoolsFixture() {
	await deployments.fixture(["Pools"]);

	// Get deployed contract addresses
	const wethDeployment = await deployments.get("MockToken_WETH");
	const usdcDeployment = await deployments.get("MockToken_USDC");
	const poolDeployment = await deployments.get("MockPool");
	const faucetDeployment = await deployments.get("Faucet");

	// Get contract instances using hardhat-viem's getContractAt
	const weth = await viem.getContractAt("MockToken", wethDeployment.address);
	const usdc = await viem.getContractAt("MockToken", usdcDeployment.address);
	const pool = await viem.getContractAt("MockPool", poolDeployment.address);
	const faucet = await viem.getContractAt("Faucet", faucetDeployment.address);

	return { weth, usdc, pool, faucet };
}
