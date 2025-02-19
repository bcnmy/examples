import { base, optimism, baseSepolia, optimismSepolia } from "wagmi/chains"
import { useNetworkStore } from "../store/network-store"
import {
  getMultichainContract,
  mcUSDC,
  mcUSDT,
  mcUniswapSwapRouter,
  testnetMcUSDC,
  testnetMcUniswapSwapRouter
} from "@biconomy/abstractjs-canary"
import { erc20Abi } from "viem"

const MINIMUM_ACROSS_IN_TOKEN_AMOUNT = {
  mainnet: 1,
  testnet: 4.75
}

export function useNetworkData() {
  const { mode } = useNetworkStore()
  const minimumSpend = MINIMUM_ACROSS_IN_TOKEN_AMOUNT[mode]

  if (mode === "mainnet") {
    return {
      mode,
      sourceChain: optimism,
      destinationChain: base,
      inToken: mcUSDC,
      outToken: mcUSDT,
      uniswapRouter: mcUniswapSwapRouter,
      minimumSpend
    }
  }

  return {
    mode,
    sourceChain: optimismSepolia,
    destinationChain: baseSepolia,
    inToken: testnetMcUSDC,
    outToken: getMultichainContract<typeof erc20Abi>({
      abi: erc20Abi,
      deployments: [
        ["0x232fb0469e5fc7f8f5a04eddbcc11f677143f715", baseSepolia.id] // Fusion
      ]
    }),
    uniswapRouter: testnetMcUniswapSwapRouter,
    minimumSpend
  }
}
