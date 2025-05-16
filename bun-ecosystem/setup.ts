import type { Chain } from "viem"
import type { TestProject } from "vitest/node"
import { type Url, toEcosystem } from "@biconomy/ecosystem"

// NB: This is the number of chains that will be created by the ecosystem. It is advised that one chain per test file is used.
const CHAIN_LENGTH = 5

export default async function setup({ provide }: TestProject) {
  const forkUrl =
    "https://base-sepolia.g.alchemy.com/v2/EX-Rh8dvlZU3i-WJlp9gpK17PjzOWRlL"

  const ecosystem = await toEcosystem({
    chainLength: CHAIN_LENGTH,
    withMee: true,
    forkUrl
  })
  const meeNodeUrl = `${ecosystem.meeNode?.url!}/v3`

  const chains = ecosystem.infras.map((infra) => infra.network.chain)
  const rpcs = ecosystem.infras.map((infra) => infra.network.rpcUrl)
  const bundlers = ecosystem.infras.map((infra) => infra.bundler.url)

  provide("meeNode", {
    url: meeNodeUrl,
    chains,
    rpcs,
    bundlers
  } as MeeNodeProvided)
}

export type MeeNodeProvided = {
  url?: Url
  chains: Chain[]
  rpcs: Url[]
  bundlers: Url[]
}

declare module "vitest" {
  export interface ProvidedContext {
    meeNode: MeeNodeProvided
  }
}
