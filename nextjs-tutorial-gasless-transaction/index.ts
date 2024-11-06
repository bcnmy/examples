import { createNexusClient, createBicoPaymasterClient } from "@biconomy/sdk";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { http, parseEther } from "viem";

const privateKey = generatePrivateKey();
const paymasterUrl =
  'https://paymaster.biconomy.io/api/v2/84532/F7wyL1clz.75a64804-3e97-41fa-ba1e-33e98c2cc703';
const bundlerUrl =
  'https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44';

export const createAccountAndSendTransaction = async () => {
    const account = privateKeyToAccount(`${privateKey}`)
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
        const hash = await nexusClient.sendTransaction({ calls: [{to : '0xf5715961C550FC497832063a98eA34673ad7C816', value: parseEther('0')}] });
        console.log("Transaction hash: ", hash);
        const receipt = await nexusClient.waitForTransactionReceipt({ hash });
        console.log("Transaction receipt: ", receipt);
        return {address , hash};
    }
    catch (error) {
        console.log(error)
        return {address}
    }
}


