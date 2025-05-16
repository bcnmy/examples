import {
    type NexusClient,
    createBicoBundlerClient,
    toNexusAccount
} from "@biconomy/abstractjs"
import {
    http,
    type Address,
    createTestClient,
    parseEther,
    zeroAddress
} from "viem"
import { dealActions } from "viem-deal"
import { mnemonicToAccount } from "viem/accounts"
import { beforeAll, describe, expect, inject, it } from "vitest"

const {
    url,
    chains: allChains,
    rpcs: allRpcs,
    bundlers: allBundlers
} = inject("meeNode")

// Using index 4 to avoid conflict with ownables tests
const chainIndex = 4

describe("Ecosystem - core", () => {
    const account = mnemonicToAccount(
        "test test test test test test test test test test test junk"
    )

    // Here take the chains relevant only to this test file so that nonces, state, etc won't conflict with other files
    const chain = allChains[chainIndex]
    const rpc = allRpcs[chainIndex]
    const bundler = allBundlers[chainIndex]

    let bundlerClient: NexusClient
    let accountAddress: Address
    let testClient: any

    beforeAll(async () => {
        const nexusAccount = await toNexusAccount({
            signer: account,
            chain,
            transport: http(rpc)
        })

        accountAddress = await nexusAccount.getAddress()

        bundlerClient = createBicoBundlerClient({
            account: nexusAccount,
            chain,
            transport: http(bundler),
            mock: true // Using mock mode for testing purposes
        })

        testClient = createTestClient({
            mode: "anvil",
            account: account,
            transport: http(rpc)
        }).extend(dealActions)
    })

    it("should be a bundler test", async () => {
        // For gas
        testClient.setBalance({
            address: accountAddress,
            value: parseEther("1")
        })

        const hash = await bundlerClient.sendUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    value: 0n
                }
            ]
        })

        const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
        expect(receipt.success).toBe(true)
    })
}) 