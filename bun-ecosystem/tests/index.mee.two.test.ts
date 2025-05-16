import {
  type MeeClient,
  type MultichainSmartAccount,
  createMeeClient,
  toMultichainNexusAccount
} from "@biconomy/abstractjs"
import { http, createTestClient, zeroAddress } from "viem"
import { dealActions } from "viem-deal"
import { mnemonicToAccount } from "viem/accounts"
import { beforeAll, describe, expect, inject, it } from "vitest"

const { url, chains: allChains, rpcs: allRpcs } = inject("meeNode")

describe("Ecosystem, in another test file", () => {
  const account = mnemonicToAccount(
    "test test test test test test test test test test test junk"
  )

  // Here take the chains relevant only to this test file so that nonces, state, etc won't conflict with other files
  const chains = allChains.slice(2, 4)
  const rpcs = allRpcs.slice(2, 4)

  let meeClient: MeeClient
  let mcNexus: MultichainSmartAccount

  let testClient: any

  beforeAll(async () => {
    mcNexus = await toMultichainNexusAccount({
      chains,
      transports: rpcs.map((rpc) => http(rpc)),
      signer: account
    })

    meeClient = await createMeeClient({ url, account: mcNexus })

    testClient = createTestClient({
      mode: "anvil",
      account: account,
      transport: http(rpcs[0])
    }).extend(dealActions)
  })

  it("should be another test", async () => {
    const feeToken = {
      address: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
      chainId: chains[0].id
    }

    await testClient.deal({
      erc20: feeToken.address,
      account: mcNexus.addressOn(feeToken.chainId),
      amount: 1000000000n
    })

    const { hash } = await meeClient.execute({
      instructions: [
        {
          calls: [
            {
              to: zeroAddress,
              value: BigInt(0)
            }
          ],
          chainId: chains[0].id
        }
      ],
      feeToken: {
        address: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
        chainId: chains[0].id
      }
    })

    const status = await meeClient.waitForSupertransactionReceipt({ hash })

    expect(status.transactionStatus).toBe("MINED_SUCCESS")
  })
})
