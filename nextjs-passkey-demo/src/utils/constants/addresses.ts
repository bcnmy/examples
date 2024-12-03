export const AGENT = "0x4B8306128AEd3D49A9D17B99BF8082d4E406fa1F";
export const SESSION_VALIDATOR = "0xAAAdFd794A1781e4Fd3eA64985F107a7Ac2b3872";
export const COUNTER_ADDRESS = "0x2C9e97BBaE126847A9e7dc5B9Ca668C8f05F9162";

export const SMART_SESSION_VALIDATOR = "0xddff43a42726df11e34123f747bdce0f755f784d";
export const K1_VALIDATOR = "0x00000004171351c442B202678c48D8AB5B321E8f";
export const K1_VALIDATOR_FACTORY = "0x00000bb19a3579F4D779215dEf97AFbd0e30DB55";
export const OWNABLE_VALIDATOR = "0x6605F8785E09a245DD558e55F9A0f4A508434503";
export const MOCK_EXCHANGE = "0x7802b2196EB21578A829062Ba77d08F48b1dF2B6"
export const PASSKEY_VALIDATOR_ADDRESS = "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06";

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
    },
    {
        name: "Passkey Validator",
        address: PASSKEY_VALIDATOR_ADDRESS,
        isActive: false,
    }
]   
