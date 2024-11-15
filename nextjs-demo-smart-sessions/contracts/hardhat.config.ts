import "@nomicfoundation/hardhat-verify";
import type { HardhatUserConfig } from "hardhat/config";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-chai-matchers";
import "dotenv/config";

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		hardhat: {
			live: false,
		},
		"base-sepolia": {
			url: "https://sepolia.base.org",
			accounts: [process.env.PRIVATE_KEY].filter(Boolean) as string[],
			verify: {
				etherscan: {
					apiUrl: "https://api-sepolia.basescan.org",
					apiKey: process.env.BASESCAN_API_KEY,
				},
			},
		},
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		treasury: {
			default: 1,
			mainnet: process.env.TREASURY_ADDRESS || 1,
		},
	},
	verify: {
		etherscan: {
			apiKey: {
				"base-sepolia": process.env.BASESCAN_API_KEY,
			},
		},
	},
};

export default config;
