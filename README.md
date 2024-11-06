# examples
Repository containing guides, quickstarts, demos, and tutorials for integrating Biconomy's services. Ideal for developers seeking detailed instructions, hands-on examples, and resources to simplify building with our SDKs and APIs.

## Contributing

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
```

To contribute to this repository with your own example or demo:

1. Create a new folder:
   - Choose a descriptive name for your example or demo.
   - Create a new folder with this name in the root of the repository.

2. Add your code:
   - Place all relevant files for your example or demo in the newly created folder.
   - Include a README.md file in your folder with instructions on how to run your example and any necessary setup steps.

3. Test your example:
   - Ensure that your code works as expected and all dependencies are properly listed.
   - Double-check that your README.md provides clear and accurate instructions.

4. Create a pull request:
   - Open a pull request with a clear description of your example or demo.
   - Wait for review and address any feedback if necessary.

We appreciate your contributions to help other developers learn and integrate Biconomy's services!

