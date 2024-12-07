import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { PublicClient, Account, WalletClient, Address } from "viem";
import { deployFaucetFixture } from "../fixtures/deployFaucetFixture";

import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import chai from "chai";

chai.use(chaiAsPromised);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyData = any;

describe("Faucet", () => {
	let faucet: AnyData;
	let weth: AnyData;
	let usdc: AnyData;
	let owner: WalletClient;
	let ownerAccount: Account;
	let ownerAddress: Address;
	let user: WalletClient;
	let userAccount: Account;
	let userAddress: Address;
	let publicClient: PublicClient;

	beforeEach(async () => {
		const {
			faucet: faucet_,
			weth: weth_,
			usdc: usdc_,
			owner: owner_,
			user: user_,
			publicClient: publicClient_,
		} = await loadFixture(deployFaucetFixture);
		faucet = faucet_;
		weth = weth_;
		usdc = usdc_;
		owner = owner_;
		user = user_;
		publicClient = publicClient_;
		ownerAddress = owner.account?.address as Address;
		userAddress = user.account?.address as Address;
		ownerAccount = owner.account as Account;
		userAccount = user.account as Account;
	});

	describe("ETH Drips", () => {
		it("should allow users to request ETH", async () => {
			const initialBalance = await publicClient.getBalance({
				address: userAddress,
			});
			await faucet.write.requestEth([], { account: userAccount });
			const finalBalance = await publicClient.getBalance({
				address: userAddress,
			});
			const dripAmount = await faucet.read.ETH_DRIP_AMOUNT();

			// Check that the difference is approximately equal to dripAmount
			// by ensuring the received amount is within 0.1 ETH of expected (accounting for gas)
			const difference = finalBalance - initialBalance;
			expect(Number(difference)).to.be.closeTo(Number(dripAmount), 1e17); // within 0.1 ETH
		});

		it("should enforce cooldown period", async () => {
			// First request should succeed
			await faucet.write.requestEth([], { account: userAccount });

			// Second request should fail with cooldown message
			await expect(
				faucet.write.requestEth([], { account: userAccount }),
			).to.be.rejectedWith("Please wait 24 hours between ETH requests");
		});

		it("should allow requests after cooldown", async () => {
			await faucet.write.requestEth([], { account: userAccount });
			await time.increase(24 * 60 * 60 + 1); // 24 hours + 1 second
			await faucet.write.requestEth([], { account: userAccount });
		});
	});
});
