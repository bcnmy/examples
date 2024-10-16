// 'use client'

// import { useAccount, usePublicClient } from 'wagmi'
// import { useEffect } from 'react'

// import { toWebAuthnKey, toPasskeyValidator, WebAuthnMode } from '@biconomy/sdk-canary'

// export default function Passkey() {
//     const account = useAccount()
//     const publicClient = usePublicClient()
//     useEffect(() => {
//         setupPasskey()
//     }, [account])

//     const setupPasskey = async () => {
//         const webAuthnKey = await toWebAuthnKey({
//             passkeyName: "test",
//             passkeyServerUrl: "https://passkeys.zerodev.app/api/v3/f4c79c46-08fa-4cdc-b2f9-a62e43ebe361",
//             mode: WebAuthnMode.Register,
//             passkeyServerHeaders: {}
//         })

//         const passkeyValidator = await toPasskeyValidator(publicClient, {
//             webAuthnKey,
//         })

//         console.log(passkeyValidator)
//     }

//     return <div>Passkey</div>
// }


import React from 'react'

const page = () => {
    return (
        <div>page</div>
    )
}

export default page