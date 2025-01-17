import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, optimism } from "viem/chains";
import { http, zeroAddress } from "viem";
import { createMeeClient, createNexusClient, mcUSDC, toMultichainNexusAccount } from "@biconomy/abstractjs";

const privateKey = process.env.PRIVATE_KEY;
const bundlerUrl = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";

export const main4337 = async () => {
    const account = privateKeyToAccount(`0x${privateKey}`)
    const nexusClient = await createNexusClient({
        signer: account,
        chain: baseSepolia,
        transport: http(),
        bundlerTransport: http(bundlerUrl),
    });
    // @ts-ignore
    const address = nexusClient.account?.address!;
    console.log("address", address)
    try {
        const hash = await nexusClient.sendTransaction({ calls: [{to : '0xf5715961C550FC497832063a98eA34673ad7C816', value: 1n}] });
        console.log("Transaction hash: ", hash);
        const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        console.log("Transaction receipt: ", receipt);
        return {address , hash};
    }
    catch (error) {
        return {address}
    }
}

export const mainMee = async () => {
    const account = privateKeyToAccount(`0x${privateKey}`);

    const mcAccount = await toMultichainNexusAccount({
        signer: account,
        chains: [base, optimism],
    });

    const meeClient = createMeeClient({  account: mcAccount });


    const quote = await meeClient.getQuote({
        instructions: [{
          calls: [{ to: zeroAddress, value: 0n, gasLimit: 1000000n }],
          chainId: base.id
        }],
        feeToken: {
          address: mcUSDC.addressOn(base.id), // Token used to pay for the transaction
          chainId: base.id // Chain where the payment will be processed
        }
    })
    console.log({ quote })

    // Execute the quote and get back a transaction hash
    // This sends the transaction to the network
    const { hash } = await meeClient.executeQuote({ quote })
    console.log({ hash })

}

const executionEnvironment = process?.argv?.[2]?.split("=")?.[1];
const main = executionEnvironment === "4337" ? main4337 : mainMee;

main().then((res) => {
    console.log(res);
    process.exit(0);
}).catch(console.error);
