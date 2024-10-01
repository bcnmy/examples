# Biconomy SDK Quickstart

This quickstart guide demonstrates how to use the Biconomy SDK to create an account and send a transaction on the Base Sepolia testnet.

## Prerequisites

- Node.js installed on your system
- Basic knowledge of TypeScript and blockchain concepts

## Setup

1. Clone this repository and navigate to the quickstart directory.

2. Install the required dependencies:

   ```
   npm install 
   ```

3. Open `index.ts` and replace the empty `privateKey` string with your actual private key:

   ```typescript
   const privateKey = "your_private_key_here";
   ```

   Make sure to keep your private key secure and never share it publicly.

## Running the Script

Execute the script using the following command:

```bash
npm run dev 
```

This will compile and run the script, creating an account and sending a transaction on the Base Sepolia testnet.

## Notes

- The script uses the Biconomy SDK to create an account and send a transaction.
- The private key is used to sign the transaction, so make sure to keep it secure.
