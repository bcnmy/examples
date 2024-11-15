import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import { Address, encodeAbiParameters, parseEther, parseUnits } from "viem";
import { deployPoolsFixture } from "../fixtures/deployPoolsFixture";
import {
	INITIAL_PRICE_WETH_PER_USDC,
	INITIAL_SQRT_PRICE,
	POOL_FEE,
} from "../constants";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyData = any;

describe("Deployment", () => {
	let faucet: AnyData;
	let weth: AnyData;
	let usdc: AnyData;
	let pool: AnyData;

	beforeEach(async () => {
		const {
			weth: weth_,
			usdc: usdc_,
			pool: pool_,
			faucet: faucet_,
		} = await loadFixture(deployPoolsFixture);

		weth = weth_;
		usdc = usdc_;
		pool = pool_;
		faucet = faucet_;
	});

	describe("Initial Setup", () => {
		it("should deploy all contracts", async () => {
			expect(weth.address).to.not.equal(
				"0x0000000000000000000000000000000000000000",
			);
			expect(usdc.address).to.not.equal(
				"0x0000000000000000000000000000000000000000",
			);
			expect(pool.address).to.not.equal(
				"0x0000000000000000000000000000000000000000",
			);
			expect(faucet.address).to.not.equal(
				"0x0000000000000000000000000000000000000000",
			);
		});

		it("should set up correct pool parameters", async () => {
			const fee = await pool.read.fee();
			expect(fee).to.equal(POOL_FEE);

			const slot0 = await pool.read.slot0();
			expect(slot0[0]).to.equal(INITIAL_SQRT_PRICE);
		});

		it("should provide initial liquidity to pool", async () => {
			const wethBalance = await weth.read.balanceOf([pool.address]);
			const usdcBalance = await usdc.read.balanceOf([pool.address]);

			expect(wethBalance).to.equal(parseEther("100"));
			expect(usdcBalance).to.equal(parseUnits("390000", 6));
		});

		it("should fund the faucet", async () => {
			const wethBalance = await weth.read.balanceOf([faucet.address]);
			const usdcBalance = await usdc.read.balanceOf([faucet.address]);

			expect(wethBalance).to.equal(parseEther("10"));
			expect(usdcBalance).to.equal(parseUnits("39000", 6));
		});

		it("should fund the faucet with native ETH", async () => {
			const publicClient = await viem.getPublicClient();

			const ethBalance = await publicClient.getBalance({
				address: faucet.address,
			});
			expect(ethBalance).to.equal(parseEther("1"));
		});

		it("should set up correct initial price", async () => {
			const currentPrice = await pool.read.CURRENT_PRICE_WETH_PER_USDC();
			expect(currentPrice).to.equal(INITIAL_PRICE_WETH_PER_USDC);
		});

		it("should perform swaps at the initial price", async () => {
			// Get the deployer account
			const [deployer] = await viem.getWalletClients();

			// Mint some WETH to test with
			await weth.write.mint([deployer.account.address, parseEther("1")]);
			await weth.write.approve([pool.address, parseEther("1")]);

			const swapAmount = parseEther("1"); // 1 WETH
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

			// Get initial balances
			const initialUsdcBalance = await usdc.read.balanceOf([
				deployer.account.address,
			]);

			// Perform a swap
			await pool.write.execute(
				[
					"0x01",
					[encodeSwapParams(deployer.account.address, true, swapAmount, 0n)],
					deadline,
				],
				{ account: deployer.account },
			);

			// Check that we received the correct amount of USDC (3900 USDC per WETH)
			const finalUsdcBalance = await usdc.read.balanceOf([
				deployer.account.address,
			]);
			const usdcReceived = finalUsdcBalance - initialUsdcBalance;

			// Calculate expected USDC amount: 1 WETH * 3900 USDC/WETH
			const expectedUsdcAmount =
				(swapAmount * INITIAL_PRICE_WETH_PER_USDC) / 10n ** 18n;
			expect(usdcReceived).to.equal(expectedUsdcAmount);
		});
	});
});

// Helper function for encoding swap parameters
function encodeSwapParams(
	recipient: Address,
	zeroForOne: boolean,
	amountSpecified: bigint,
	sqrtPriceLimitX96: bigint,
): string {
	return encodeAbiParameters(
		[
			{ name: "recipient", type: "address" },
			{ name: "zeroForOne", type: "bool" },
			{ name: "amountSpecified", type: "int256" },
			{ name: "sqrtPriceLimitX96", type: "uint160" },
		],
		[recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96],
	);
}
