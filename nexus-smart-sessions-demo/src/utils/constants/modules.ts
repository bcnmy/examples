export const SMART_SESSION_VALIDATOR = "0x3834aD7f5f73fAd19C089a924F18e6F3417d1ac2";
export const K1_VALIDATOR = "0x000000017D8e9Eb74CEcb09a3532f8E18E883521";
export const K1_VALIDATOR_FACTORY = "0x00000001cdE7c53f30b20Bd36015C48652F3faaC";
export const OWNABLE_VALIDATOR = "0x6605F8785E09a245DD558e55F9A0f4A508434503";

export const validationModules = [
    {
        name: "K1 Validator",
        address: K1_VALIDATOR,
        isActive: true,
    },
    {
        name: "Ownable Validator",
        address: OWNABLE_VALIDATOR,
        isActive: false,
    },
    {
        name: "Smart Session Validator",
        address: SMART_SESSION_VALIDATOR,
        isActive: false,
    }
]   
