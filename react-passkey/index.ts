import { createNexusClient, createBicoPaymasterClient, createSmartAccountClient, toNexusAccount } from "@biconomy/abstractjs";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { http } from "viem";

const privateKey = generatePrivateKey();
const paymasterUrl =
  'https://paymaster.biconomy.io/api/v2/84532/9YTUGYitn.73ea1313-001c-4382-bf9b-8bb2f1f92b2a';
const bundlerUrl = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"

export const createAccount = async () => {
  const account = privateKeyToAccount(`${privateKey}`)
  const nexusClient = createSmartAccountClient({
    account: await toNexusAccount({
      signer: account,
      chain: baseSepolia,
      transport: http(),
      index: BigInt(8),
    }),
    transport: http(bundlerUrl),
    paymaster: createBicoPaymasterClient({ paymasterUrl })
  });
  return nexusClient;
}


