import { createNexusClient, createBicoPaymasterClient } from "@biconomy/sdk";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { http, parseEther } from "viem";

const privateKey = "PRIVATE_KEY";
const paymasterUrl = "PAYMASTER_URL"
const bundlerUrl = "https://sdk-relayer.staging.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";

export const createAccountAndSendTransaction = async () => {
    const account = privateKeyToAccount(`0x${privateKey}`)
    const nexusClient = await createNexusClient({
        signer: account,
        chain: baseSepolia,
        transport: http(),
        bundlerTransport: http(bundlerUrl),
        paymaster: createBicoPaymasterClient({paymasterUrl})
    });
    const address = await nexusClient.account.address;
    console.log("address", address)
    try {
        const hash = await nexusClient.sendTransaction({ calls: [{to : '0xf5715961C550FC497832063a98eA34673ad7C816', value: parseEther('0.0001')}] });
        console.log("Transaction hash: ", hash);
        const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        console.log("Transaction receipt: ", receipt);
        return {address , hash};
    }
    catch (error) {
        return {address}
    }
}


