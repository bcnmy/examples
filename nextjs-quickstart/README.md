This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This tutorial creates a biconomy nexus smart account on the Base Sepolia chain and executes a simple transaction. 

## Getting Started

1. Enter the `privateKey` to the index.ts file.
2. Transfer some eth to the smart account address on base sepolia and save.

### Local SDK Development
To use the local SDK during development:
1. Run `bun run dev` from the SDK directory
2. Update your package.json dependencies:
```json
{
  "dependencies": {
    "@biconomy/abstractjs": "file:../../sdk/dist/_esm"
  }
}
```

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/bcnmy/examples/tree/main/nextjs-quickstart)
