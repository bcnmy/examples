# bun-ecosystem

This project demonstrates testing with `@biconomy/ecosystem` package, which provides a robust testing environment for blockchain applications with Anvil chains, ERC-4337 bundlers, and Biconomy's Modular Execution Environment (MEE) Node.

## Prerequisites ⚠️

**Docker is REQUIRED**:
* Docker must be installed and running
* Docker Compose V2 must be available
* Docker daemon must be running
* Port 3000 must be available (used by MEE Node)

## Key Features & Advantages ✨

*   🚀 **Unified Testing Architecture**: Single MEE Node instance (port 3000) efficiently manages multiple Anvil chains, providing centralized control for all test environments

*   🔄 **Multi-Chain Test Isolation**: 
    - Each test file runs on a dedicated chain to prevent conflicts
    - Core tests: Chain index 4
    - Ownables tests: Chain index 5
    - Smart Sessions tests: Chain index 6

*   🌍 **Realistic Testing Environment**:
    - Fork from any EVM network (currently using Base Sepolia)
    - Simulate time-locked logic with block manipulation
    - Replicate production states for bug investigation

*   💰 **Effortless Token Management**:
    - Deal ERC20 tokens programmatically using `viem-deal`
    - Pre-fund test accounts without external faucets
    - Instant, reliable transactions without gas issues

*   🛠️ **Developer Experience**:
    - Near-instant transaction confirmation
    - Account impersonation for complex scenarios
    - No costs or real private key exposure
    - CI/CD ready with predictable states

## Installation

```bash
bun install
```

## Running Tests

```bash
bun tun test
```

## Test Structure

Our tests follow these best practices:

1. **Chain Isolation**: Each test file uses a unique chain index to prevent conflicts:
   - Core tests: Chain index 4
   - Ownables tests: Chain index 5

2. **Test Setup Pattern**:
```typescript
import { inject, describe, it, beforeAll } from 'vitest'

// Inject MEE Node configuration
const { url, chains, rpcs, bundlers } = inject("meeNode")

describe("Test Suite", () => {
  const chain = chains[6]  // Use unique chain index
  const rpc = rpcs[6]
  const bundler = bundlers[6]

  beforeAll(async () => {
    // Setup test environment
  })

  it("should run test", async () => {
    // Test code
  })
})
```

3. **Token Management**:
```typescript
// Deal tokens for testing
const testClient = createTestClient({
  mode: "anvil",
  account: account,
  transport: http(rpc)
}).extend(dealActions)

// Deal native tokens
await testClient.setBalance({
  address: accountAddress,
  value: parseEther("1")
})
```

## Troubleshooting

* **Port 3000 Issues**: 
  * Only one MEE Node can run at a time
  * Stop any services using port 3000

* **RPC Connection**:
  * Verify fork URL accessibility
  * Check API key validity
  * Confirm network connection

## Important Notes

1. The MEE Node MUST run on port 3000 - this is a core requirement
2. Use different chain indices for different test files
3. Always ensure proper cleanup between test runs
4. Mock mode is available for bundler testing: `mock: true`

## Project Structure

- `/tests`: Test files with dedicated chain indices
- `/src`: Source files including contract addresses
- `setup.ts`: MEE Node and chain configuration
- `vitest.config.ts`: Test runner configuration
