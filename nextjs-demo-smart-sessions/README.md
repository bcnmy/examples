### Local SDK Development
To use the local SDK during development:
1. Run `bun run dev` from the SDK directory
2. Update your package.json dependencies:
```json
{
  "dependencies": {
    "@biconomy/sdk": "file:../../sdk/dist/_esm"
  }
}
