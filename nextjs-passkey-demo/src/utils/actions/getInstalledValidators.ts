import { NexusClient } from "@biconomy/sdk";
import { validationModules } from "../constants/addresses";

export const getInstalledValidators = async (nexusClient: NexusClient) => {
    try {
        const installedValidators = await nexusClient.getInstalledValidators({ cursor: "0x0000000000000000000000000000000000000001", pageSize: BigInt(100) });
        return installedValidators[0].map(validatorAddr => {
            const matchingModule = validationModules.find(module => module.address.toLowerCase() === validatorAddr.toLowerCase());
            return {
                name: matchingModule ? matchingModule.name : "Unknown",
                isActive: matchingModule ? matchingModule.isActive : false,
                address: validatorAddr
            }
        });
    } catch (error) {
        console.error("Error fetching installed validators:", error);
        return [];
    }
};
