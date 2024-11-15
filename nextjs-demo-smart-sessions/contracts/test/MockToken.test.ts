import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type {
	Account,
	Address,
	GetContractReturnType,
	PublicClient,
	WalletClient,
} from "viem";
import {
	WETH_NAME,
	WETH_SYMBOL,
	USDC_NAME,
	USDC_SYMBOL,
	parseWETH,
	parseUSDC,
	deployFaucetFixture,
} from "../fixtures/deployFaucetFixture";
import type { Faucet__factory } from "../typechain-types/factories/contracts/Faucet__factory";

import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import chai from "chai";
chai.use(chaiAsPromised);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyData = any;

describe("MockTokens", () => {
	let pool: AnyData;
	let faucet: GetContractReturnType<typeof Faucet__factory.abi>;
	let weth: AnyData;
	let usdc: AnyData;
	let owner: WalletClient;
	let ownerAddress: Address;
	let user: WalletClient;
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
			pool: pool_,
		} = await loadFixture(deployFaucetFixture);

		faucet = faucet_;
		pool = pool_;
		weth = weth_;
		usdc = usdc_;
		owner = owner_;
		user = user_;
		publicClient = publicClient_;
		ownerAddress = owner.account?.address as Address;
		userAddress = user.account?.address as Address;
	});

	describe("Deployment", () => {
		it("Should set the right name and symbol for both tokens", async () => {
			expect(await weth.read.name()).to.equal(WETH_NAME);
			expect(await weth.read.symbol()).to.equal(WETH_SYMBOL);
			expect(await usdc.read.name()).to.equal(USDC_NAME);
			expect(await usdc.read.symbol()).to.equal(USDC_SYMBOL);
		});
	});

	describe("Minting", () => {
		it("Should allow owner to mint tokens", async () => {
			const wethAmount = parseWETH(1000);
			const usdcAmount = parseUSDC(1000);

			await weth.write.mint([userAddress, wethAmount]);
			await usdc.write.mint([userAddress, usdcAmount]);

			expect(await weth.read.balanceOf([userAddress])).to.equal(wethAmount);
			expect(await usdc.read.balanceOf([userAddress])).to.equal(usdcAmount);
		});

		it("Should prevent non-owner from minting", async () => {
			const wethAmount = parseWETH(1000);
			const usdcAmount = parseUSDC(1000);

			await expect(
				weth.write.mint([userAddress, wethAmount], { account: userAddress }),
			).to.be.rejectedWith("OwnableUnauthorizedAccount");

			await expect(
				usdc.write.mint([userAddress, usdcAmount], { account: userAddress }),
			).to.be.rejectedWith("OwnableUnauthorizedAccount");
		});
	});

	describe("Burning", () => {
		it("Should allow users to burn their tokens", async () => {
			const wethAmount = parseWETH(1000);
			const usdcAmount = parseUSDC(1000);

			await weth.write.transfer([userAddress, wethAmount]);
			await usdc.write.transfer([userAddress, usdcAmount]);

			await weth.write.burn([wethAmount], { account: userAddress });
			await usdc.write.burn([usdcAmount], { account: userAddress });

			expect(await weth.read.balanceOf([userAddress])).to.equal(0n);
			expect(await usdc.read.balanceOf([userAddress])).to.equal(0n);
		});

		it("Should fail when burning more than balance", async () => {
			const wethAmount = parseWETH(1000);
			const usdcAmount = parseUSDC(1000);

			await expect(
				weth.write.burn([wethAmount], { account: userAddress }),
			).to.be.rejectedWith("ERC20InsufficientBalance");

			await expect(
				usdc.write.burn([usdcAmount], { account: userAddress }),
			).to.be.rejectedWith("ERC20InsufficientBalance");
		});
	});

	describe("Transfers", () => {
		it("Should transfer tokens between accounts", async () => {
			const wethAmount = parseWETH(1000);
			const usdcAmount = parseUSDC(1000);

			await weth.write.transfer([userAddress, wethAmount]);
			await usdc.write.transfer([userAddress, usdcAmount]);

			expect(await weth.read.balanceOf([userAddress])).to.equal(wethAmount);
			expect(await usdc.read.balanceOf([userAddress])).to.equal(usdcAmount);
		});

		it("Should fail if sender doesn't have enough tokens", async () => {
			const wethAmount = parseWETH(1000);
			const usdcAmount = parseUSDC(1000);

			await expect(
				weth.write.transfer([ownerAddress, wethAmount], {
					account: userAddress,
				}),
			).to.be.rejectedWith("ERC20InsufficientBalance");

			await expect(
				usdc.write.transfer([ownerAddress, usdcAmount], {
					account: userAddress,
				}),
			).to.be.rejectedWith("ERC20InsufficientBalance");
		});
	});
});
