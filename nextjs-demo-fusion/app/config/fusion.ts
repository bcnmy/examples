import { getMultichainContract } from "@biconomy/abstractjs-canary"
import { erc20Abi } from "viem"
import { baseSepolia } from "viem/chains"

export const mcFusion = getMultichainContract<typeof erc20Abi>({
  abi: erc20Abi,
  deployments: [["0x232fb0469e5fc7f8f5a04eddbcc11f677143f715", baseSepolia.id]]
})
