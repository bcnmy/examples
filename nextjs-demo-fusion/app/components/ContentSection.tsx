export function ContentSection() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">
        Building Cross-Chain Trigger Actions with Fusion
      </h1>
      <section className="mb-8">
        <p className="mb-4">
          Traditional blockchain transactions execute immediately when
          submitted. However, many use cases require actions to be taken only
          when certain conditions are met - for example, executing a trade when
          a token reaches a specific price, or bridging assets when they arrive
          in a wallet.
        </p>
        <p className="mb-4">
          Fusion enables this by allowing you to define trigger conditions and
          associated actions that will execute automatically when those
          conditions are satisfied. This creates powerful new possibilities for
          cross-chain automation and conditional execution.
        </p>
      </section>
    </>
  )
}
