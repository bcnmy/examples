import { NexusClient } from "@biconomy/sdk-canary";
import { validationModules } from "../constants/modules";

export const getInstalledValidators = async (nexusClient: NexusClient) => {
    try {
        const installedValidators = await nexusClient.getInstalledValidators();
        console.log('installedValidators', installedValidators);
        return installedValidators[0].map(validatorAddr => {
            const matchingModule = validationModules.find(module => module.address === validatorAddr);
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
