import {
    type NexusClient,
    createBicoBundlerClient,
    ownableActions,
    toNexusAccount,
    toOwnableModule,
} from "@biconomy/abstractjs"
import {
    http,
    type Address,
    type LocalAccount,
    createTestClient,
    parseEther,
    zeroAddress
} from "viem"
import { dealActions } from "viem-deal"
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, inject, it } from "vitest"
import { COUNTER_ADDRESS } from "../src/addresses"

const {
    url,
    chains: allChains,
    rpcs: allRpcs,
    bundlers: allBundlers
} = inject("meeNode")

// Using index 5 to avoid conflict with core test 
const ownablesChainIndex = 5

describe("Ecosystem - Ownables Module", () => {
    const account = mnemonicToAccount(
        "test test test test test test test test test test test junk"
    )

    const chain = allChains[ownablesChainIndex]
    const rpc = allRpcs[ownablesChainIndex]
    const bundler = allBundlers[ownablesChainIndex]

    let bundlerClient: NexusClient
    let accountAddress: Address
    let testClient: any
    let redeemerAccount: LocalAccount

    beforeAll(async () => {
        // Create a second account to act as redeemer
        redeemerAccount = privateKeyToAccount("0x1234567890123456789012345678901234567890123456789012345678901234")

        const ownablesModule = toOwnableModule({
            signer: account,
            threshold: 1,
            owners: [redeemerAccount.address]
        })

        const nexusAccount = await toNexusAccount({
            signer: account,
            chain,
            transport: http(rpc),
            validators: [ownablesModule]
        })

        accountAddress = await nexusAccount.getAddress()

        bundlerClient = createBicoBundlerClient({
            account: nexusAccount,
            chain,
            transport: http(bundler),
            mock: true
        })

        testClient = createTestClient({
            mode: "anvil",
            account: account,
            transport: http(rpc)
        }).extend(dealActions)
    })

    it("should validate ownables module", async () => {
        await testClient.setBalance({
            address: accountAddress,
            value: parseEther("1")
        })

        const ownablesClient = bundlerClient.extend(ownableActions())

        const { userOpHash, userOp } = await ownablesClient.prepareForMultiSign({
            calls: [
                {
                    to: COUNTER_ADDRESS,
                    data: "0x273ea3e3"
                }
            ]
        })

        const sig = await redeemerAccount.signMessage({
            message: { raw: userOpHash }
        })

        const multiSigHash = await ownablesClient.multiSign({
            ...userOp,
            signatures: [sig]
        })

        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: multiSigHash
        })
        expect(receipt.success).toBe(true)
    })
}) 