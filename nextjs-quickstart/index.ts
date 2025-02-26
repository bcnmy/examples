import { createNexusClient, toNexusAccount } from "@biconomy/abstractjs";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { http } from "viem";
import { config } from "dotenv";

config();

const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
const bundlerUrl = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";

export const createAccountAndSendTransaction = async () => {
    const account = privateKeyToAccount(`0x${privateKey}`)
    const nexusClient = createNexusClient({
        account: await toNexusAccount({
            signer: account,
            transport: http(),
            chain: baseSepolia
        }),
        transport: http(bundlerUrl),
    });
    const address = nexusClient.account.address;
    console.log("address", address)
    try {
        const hash = await nexusClient.sendTransaction({ calls: [{ to: '0xf5715961C550FC497832063a98eA34673ad7C816', value: 1n }] });
        console.log("Transaction hash: ", hash);
        const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        console.log("Transaction receipt: ", receipt);
        return { address, hash };
    }
    catch (error) {
        return { address }
    }
}


