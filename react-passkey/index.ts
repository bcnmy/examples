import { createNexusClient, createBicoPaymasterClient, createSmartAccountClient } from "@biconomy/sdk";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { http } from "viem";

const privateKey = generatePrivateKey();
const paymasterUrl =
  'https://paymaster.biconomy.io/api/v2/84532/F7wyL1clz.75a64804-3e97-41fa-ba1e-33e98c2cc703';
const bundlerUrl = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"

export const createAccount = async () => {
  const account = privateKeyToAccount(`${privateKey}`)
  const nexusClient = await createSmartAccountClient({
    signer: account,
    chain: baseSepolia,
    transport: http(),
    index: BigInt(8),
    bundlerTransport: http(bundlerUrl),
    paymaster: createBicoPaymasterClient({ paymasterUrl })
  });
  return nexusClient;
}


