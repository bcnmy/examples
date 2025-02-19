import { getMultichainContract } from "@biconomy/abstractjs-canary"
import { erc20Abi } from "viem"
import { baseSepolia, optimismSepolia, sepolia } from "viem/chains"

export const mcUSDC = getMultichainContract<typeof erc20Abi>({
  abi: erc20Abi,
  deployments: [
    ["0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", sepolia.id],
    ["0x036cbd53842c5426634e7929541ec2318f3dcf7e", baseSepolia.id],
    ["0x5fd84259d66Cd46123540766Be93DFE6D43130D7", optimismSepolia.id]
  ]
})

export const fusionToken = getMultichainContract<typeof erc20Abi>({
  abi: erc20Abi,
  deployments: [
    ["0x232fb0469e5fc7f8f5a04eddbcc11f677143f715", baseSepolia.id] // Fusion
  ]
})
