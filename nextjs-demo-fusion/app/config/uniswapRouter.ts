import { getMultichainContract } from "@biconomy/abstractjs"
import { UniswapSwapRouterAbi } from "@biconomy/abstractjs"
import { arbitrumSepolia, baseSepolia, optimismSepolia } from "viem/chains"

export const uniswapSwapRouter = getMultichainContract<
  typeof UniswapSwapRouterAbi
>({
  abi: UniswapSwapRouterAbi,
  deployments: [
    ["0x101F443B4d1b059569D643917553c771E1b9663E", arbitrumSepolia.id],
    ["0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4", optimismSepolia.id],
    ["0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4", baseSepolia.id]
  ]
})
