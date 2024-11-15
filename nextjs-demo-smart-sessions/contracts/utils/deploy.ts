import { viem } from "hardhat";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function deployContract(contractName: string, args: any[] = []) {
	const [deployer] = await viem.getWalletClients();
	const contract = await viem.deployContract(contractName, args, {
		client: { wallet: deployer },
	});
	return contract;
}
