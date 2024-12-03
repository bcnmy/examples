export interface ActionPolicyInfo {
    contractAddress: string;
    functionSelector: string;
    validUntil?: number;
    validAfter?: number;
    rules?: any[]; // Adjust the type of rules if you have a specific structure
    valueLimit?: bigint;
}

export interface SessionInfo {
    sessionPublicKey: string;
    sessionValidatorAddress?: string;
    sessionKeyData?: string;
    sessionValidAfter?: number;
    sessionValidUntil?: number;
    actionPoliciesInfo: ActionPolicyInfo[];
}