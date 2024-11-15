import MockTokenUSDC from "@/contracts/deployments/base-sepolia/MockToken_USDC.json"
import MockTokenWETH from "@/contracts/deployments/base-sepolia/MockToken_WETH.json"

export const MOCK_USDC_ADDRESS = MockTokenUSDC.address as `0x${string}`
export const MOCK_WETH_ADDRESS = MockTokenWETH.address as `0x${string}`
export const MOCK_USDC_ABI = MockTokenUSDC.abi
export const MOCK_WETH_ABI = MockTokenWETH.abi
