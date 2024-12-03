# Biconomy Passkey Management Guide

This guide demonstrates how to implement passkey signature management using the @biconomy/passkey library with the @biconomy/sdk.

## Installation

```bash
npm install @biconomy/sdk @biconomy/passkey wagmi
```

## Setup

```typescript
import { createNexusClient, createBicoPaymasterClient } from '@biconomy/sdk';
import { baseSepolia } from 'wagmi/chains';
import { http, useAccount, useWalletClient } from 'wagmi';

const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;

const account = useAccount()
const walletClient = useWalletClient({ account: account.address });

const nexusClient = await createNexusClient({
    signer: walletClient,
    chain: baseSepolia,
    paymaster: createBicoPaymasterClient({
        paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || "",
    }),
    transport: http(),
    bundlerTransport: http(bundlerUrl),
});
```

## Passkey Management Functions

### Register Passkey

```typescript
import { toWebAuthnKey, toPasskeyValidator, WebAuthnMode } from '@biconomy/passkey';

const registerPasskey = async (username: string) => {
    const webAuthnKey = await toWebAuthnKey({
        passkeyName: username, // User would input their username here or Dapp would generate a random username
        mode: WebAuthnMode.Register,
    });

    const passkeyValidator = await toPasskeyValidator({
        account: nexusClient?.account,
        webAuthnKey,
    });

    // For this example, we store the passkey in localStorage
    localStorage.setItem('webAuthnKey', JSON.stringify({
        pubX: webAuthnKey.pubX.toString(),
        pubY: webAuthnKey.pubY.toString(),
        authenticatorId: webAuthnKey.authenticatorId,
        authenticatorIdHash: webAuthnKey.authenticatorIdHash,
    }));
};
```

### Login with Passkey

```typescript
const loginPasskey = async () => {
    const webAuthnKey = await toWebAuthnKey({
        mode: WebAuthnMode.Login,
    });

    const passkeyValidator = await toPasskeyValidator({
        account: nexusClient?.account,
        webAuthnKey,
    });

    // Store the passkey in localStorage
    localStorage.setItem('webAuthnKey', JSON.stringify({
        pubX: webAuthnKey.pubX.toString(),
        pubY: webAuthnKey.pubY.toString(),
        authenticatorId: webAuthnKey.authenticatorId,
        authenticatorIdHash: webAuthnKey.authenticatorIdHash,
    }));
};
```

### Install Passkey Validator

```typescript
const installPasskeyValidator = async () => {
    const userOpHash = await nexusClient?.installModule({
        module: {
            address: PASSKEY_VALIDATOR_ADDRESS,
            type: "validator",
            initData: passkeyValidator?.initData
        },
    });
    await nexusClient?.waitForUserOperationReceipt({ hash: userOpHash });
};
```

### Uninstall Passkey Validator

```typescript
const uninstallPasskeyValidator = async () => {
    const userOpHash = await nexusClient?.uninstallModule({
        module: {
            address: PASSKEY_VALIDATOR_ADDRESS,
            type: "validator",
            deInitData: "0x"
        }
    });
    await nexusClient?.waitForUserOperationReceipt({ hash: userOpHash });
};
```

