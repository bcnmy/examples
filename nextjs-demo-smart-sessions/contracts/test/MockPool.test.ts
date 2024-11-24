import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import {
  encodeAbiParameters,
  type Account,
  type Address,
  type PublicClient,
  type WalletClient
} from "viem"
import {
  deployFaucetFixture,
  parseWETH,
  parseUSDC,
  CURRENT_PRICE_WETH_PER_USDC
} from "../fixtures/deployFaucetFixture"
import { time } from "@nomicfoundation/hardhat-network-helpers"

import { expect } from "chai"
import chaiAsPromised from "chai-as-promised"
import chai from "chai"
chai.use(chaiAsPromised)

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyData = any

describe("MockPool", () => {
  let weth: AnyData
  let usdc: AnyData
  let pool: AnyData
  let owner: WalletClient
  let ownerAccount: Account
  let ownerAddress: Address
  let user: WalletClient
  let userAccount: Account
  let userAddress: Address
  let publicClient: PublicClient

  beforeEach(async () => {
    const {
      weth: weth_,
      usdc: usdc_,
      pool: pool_,
      owner: owner_,
      user: user_,
      publicClient: publicClient_
    } = await loadFixture(deployFaucetFixture)

    weth = weth_
    usdc = usdc_
    pool = pool_
    owner = owner_
    user = user_
    publicClient = publicClient_
    ownerAddress = owner.account?.address as Address
    userAddress = user.account?.address as Address
    ownerAccount = owner.account as Account
    userAccount = user.account as Account
  })

  describe("Deployment", () => {
    it("Should set the correct token addresses", async () => {
      expect((await pool.read.token0()).toLowerCase()).to.equal(
        weth.address.toLowerCase()
      )
      expect((await pool.read.token1()).toLowerCase()).to.equal(
        usdc.address.toLowerCase()
      )
    })
  })

  describe("Price and State Management", () => {
    it("Should allow owner to set current price", async () => {
      const newPrice = 4000n * 1000000n // 4000 USDC per WETH

      // Owner should be able to set the price
      await pool.write.setCurrentPrice([newPrice], {
        account: ownerAccount
      })

      expect(await pool.read.CURRENT_PRICE_WETH_PER_USDC()).to.equal(newPrice)
    })

    it("Should not allow non-owner to set current price", async () => {
      const newPrice = 4000n * 1000000n

      // User (non-owner) should not be able to set the price
      await expect(
        pool.write.setCurrentPrice([newPrice], {
          account: userAccount
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount")
    })
  })

  describe("Swaps", () => {
    beforeEach(async () => {
      // Mint tokens to owner for testing
      await weth.write.mint([ownerAddress, parseWETH(1000)], {
        account: ownerAccount
      })
      await usdc.write.mint([ownerAddress, parseUSDC(1000)], {
        account: ownerAccount
      })

      // Increase pool liquidity significantly
      await weth.write.mint([pool.address, parseWETH(1000)], {
        account: ownerAccount
      })
      await usdc.write.mint([pool.address, parseUSDC(3900000)], {
        account: ownerAccount
      })

      // Approve tokens for swapping
      await weth.write.approve([pool.address, parseWETH(1000)], {
        account: ownerAccount
      })
      await usdc.write.approve([pool.address, parseUSDC(1000)], {
        account: ownerAccount
      })
    })

    it("Should execute WETH to USDC swap", async () => {
      const swapAmount = parseWETH(0.01)
      const recipient = ownerAddress
      const deadline = BigInt(await time.latest()) + 3600n

      const commands = "0x00"
      const inputs = [encodeSwapParams(recipient, true, swapAmount)]

      const initialWethBalance = await weth.read.balanceOf([ownerAddress])
      const initialUsdcBalance = await usdc.read.balanceOf([ownerAddress])

      await pool.write.execute([commands, inputs, deadline], {
        account: ownerAccount
      })

      const finalWethBalance = await weth.read.balanceOf([ownerAddress])
      const finalUsdcBalance = await usdc.read.balanceOf([ownerAddress])

      // WETH balance should decrease by swap amount
      expect(finalWethBalance).to.equal(initialWethBalance - swapAmount)

      // USDC balance should increase by (WETH amount * price)
      // Need to adjust for decimal differences: WETH (18) vs USDC (6)
      const expectedUsdcAmount =
        (swapAmount * CURRENT_PRICE_WETH_PER_USDC) / 10n ** 18n
      expect(finalUsdcBalance).to.equal(initialUsdcBalance + expectedUsdcAmount)
    })

    it("Should execute USDC to WETH swap", async () => {
      const swapAmount = parseUSDC(39)
      const recipient = ownerAddress
      const deadline = BigInt(await time.latest()) + 3600n

      const commands = "0x01"
      const inputs = [encodeSwapParams(recipient, false, swapAmount)]

      const initialWethBalance = await weth.read.balanceOf([ownerAddress])
      const initialUsdcBalance = await usdc.read.balanceOf([ownerAddress])

      await pool.write.execute([commands, inputs, deadline], {
        account: ownerAccount
      })

      const finalWethBalance = await weth.read.balanceOf([ownerAddress])
      const finalUsdcBalance = await usdc.read.balanceOf([ownerAddress])

      // USDC balance should decrease by swap amount
      expect(finalUsdcBalance).to.equal(initialUsdcBalance - swapAmount)

      // WETH balance should increase by (USDC amount / price)
      // Need to adjust for decimal differences: USDC (6) vs WETH (18)
      const expectedWethAmount =
        (swapAmount * 10n ** 18n) / CURRENT_PRICE_WETH_PER_USDC
      expect(finalWethBalance).to.equal(initialWethBalance + expectedWethAmount)
    })

    it("Should revert on expired deadline", async () => {
      const swapAmount = parseWETH(0.01)
      const recipient = ownerAddress
      const deadline = BigInt(await time.latest()) - 3600n // Past deadline

      const commands = "0x01"
      const inputs = [encodeSwapParams(recipient, true, swapAmount)]

      await expect(
        pool.write.execute([commands, inputs, deadline], {
          account: ownerAccount
        })
      ).to.be.rejectedWith("TransactionDeadlinePassed")
    })

    it("Should revert on empty commands", async () => {
      const deadline = BigInt(await time.latest()) + 3600n

      await expect(
        pool.write.execute(["0x", [], deadline], {
          account: ownerAccount
        })
      ).to.be.rejectedWith("InvalidCommand")
    })

    it("Should revert on zero amount", async () => {
      const recipient = ownerAddress
      const deadline = BigInt(await time.latest()) + 3600n

      const commands = "0x00"
      const inputs = [encodeSwapParams(recipient, true, 0n)]

      await expect(
        pool.write.execute([commands, inputs, deadline], {
          account: ownerAccount
        })
      ).to.be.rejectedWith("ZeroAmount")
    })

    it("Should revert on invalid command", async () => {
      const swapAmount = parseWETH(0.01)
      const recipient = ownerAddress
      const deadline = BigInt(await time.latest()) + 3600n

      const commands = "0x02"
      const inputs = [encodeSwapParams(recipient, true, swapAmount)]

      await expect(
        pool.write.execute([commands, inputs, deadline], {
          account: ownerAccount
        })
      ).to.be.rejectedWith("InvalidCommand")
    })
  })

  describe("Liquidity Management", () => {
    it("Should allow adding liquidity directly to pool", async () => {
      // First mint tokens to the owner
      await weth.write.mint([ownerAddress, parseWETH(10)], {
        account: ownerAccount
      })
      await usdc.write.mint([ownerAddress, parseUSDC(39000)], {
        account: ownerAccount
      })

      // Get initial balances
      const initialWethBalance = await weth.read.balanceOf([pool.address])
      const initialUsdcBalance = await usdc.read.balanceOf([pool.address])

      // Approve tokens for the pool
      await weth.write.approve([pool.address, parseWETH(10)], {
        account: ownerAccount
      })
      await usdc.write.approve([pool.address, parseUSDC(39000)], {
        account: ownerAccount
      })

      // Transfer tokens to the pool
      await weth.write.transfer([pool.address, parseWETH(10)], {
        account: ownerAccount
      })
      await usdc.write.transfer([pool.address, parseUSDC(39000)], {
        account: ownerAccount
      })

      // Check pool balances increased by the correct amount
      const finalWethBalance = await weth.read.balanceOf([pool.address])
      const finalUsdcBalance = await usdc.read.balanceOf([pool.address])

      expect(finalWethBalance).to.equal(initialWethBalance + parseWETH(10))
      expect(finalUsdcBalance).to.equal(initialUsdcBalance + parseUSDC(39000))
    })
  })

  describe("Price Management", () => {
    it("Should revert on setting zero price", async () => {
      await expect(
        pool.write.setCurrentPrice([0n], {
          account: ownerAccount
        })
      ).to.be.rejectedWith("ZeroAmount")
    })
  })

  describe("Pool Token Management", () => {
    it("Should revert on minting zero amounts", async () => {
      await expect(
        pool.write.mintPoolTokens([0n, 0n], {
          account: ownerAccount
        })
      ).to.be.rejectedWith("ZeroAmount")
    })
  })
})

// Helper function to encode swap parameters
// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export function encodeSwapParams(
  recipient: Address,
  zeroForOne: boolean,
  amountSpecified: bigint
): string {
  return encodeAbiParameters(
    [
      { name: "recipient", type: "address" },
      { name: "zeroForOne", type: "bool" },
      { name: "amountSpecified", type: "int256" }
    ],
    [recipient, zeroForOne, amountSpecified]
  )
}
