'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { NexusClient, moduleActivator } from '@biconomy/abstractjs'
import { toWebAuthnKey, toPasskeyValidator, WebAuthnMode } from '@biconomy/passkey'
import { Hex } from 'viem'
import { createAccount } from '../index'
import { Toaster } from 'react-hot-toast'

const K1_VALIDATOR = "0x00000004171351c442B202678c48D8AB5B321E8f";
const PASSKEY_VALIDATOR_ADDRESS = "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06";
const recipient = "0xf5715961C550FC497832063a98eA34673ad7C816";

export default function Passkey() {
    const [nexusClient, setNexusClient] = useState<NexusClient | null>(null);
    const [passkeyValidator, setPasskeyValidator] = useState<any | null>(null);
    const [isPasskeyInstalled, setIsPasskeyInstalled] = useState<boolean>(false);
    const [installedValidators, setInstalledValidators] = useState<string[]>([]);
    const [passkeyName, setPasskeyName] = useState<string>("");
    const [activePasskeyName, setActivePasskeyName] = useState<string>("");
    const [isLoading, setIsLoading] = useState<{
        register: boolean,
        login: boolean,
        install: boolean,
        uninstall: boolean,
        sendOp: boolean
    }>({
        register: false,
        login: false,
        install: false,
        uninstall: false,
        sendOp: false
    });

    useEffect(() => {
        let nexusClient;
        const initNexusClient = async () => {
            try {
                nexusClient = await createAccount();
                setNexusClient(nexusClient);
                const isDeployed = await nexusClient?.account.isDeployed();
                if (isDeployed) {
                    const isInstalled = await nexusClient?.isModuleInstalled({ module: { address: PASSKEY_VALIDATOR_ADDRESS, type: "validator" } });
                    setIsPasskeyInstalled(isInstalled);
                }
                setPasskeyName("Bob");
                // load webAuthnKey from localStorage
                const cachedWebAuthnKey = localStorage.getItem('webAuthnKey');
                if (cachedWebAuthnKey) {
                    const deFormattedWebAuthnKey = {
                        pubX: BigInt(JSON.parse(cachedWebAuthnKey).pubX),
                        pubY: BigInt(JSON.parse(cachedWebAuthnKey).pubY),
                        authenticatorId: JSON.parse(cachedWebAuthnKey).authenticatorId,
                        authenticatorIdHash: JSON.parse(cachedWebAuthnKey).authenticatorIdHash,
                    }
                    const passkeyValidator = await toPasskeyValidator({
                        // @ts-ignore
                        account: nexusClient?.account,
                        webAuthnKey: deFormattedWebAuthnKey,
                    })
                    setPasskeyValidator(passkeyValidator);
                    setActivePasskeyName(localStorage.getItem('activePasskeyName') || "");
                }
            } catch (error) {
                console.error("Error initializing Nexus client:", error);
            }
        };
        initNexusClient();
    }, []);

    useEffect(() => {
        const checkIsDeployed = async () => {
            const isDeployed = await nexusClient?.account.isDeployed();
            if (isDeployed && nexusClient) {
                getInstalledValidators();
            }
        }
        checkIsDeployed();
    }, [nexusClient, isPasskeyInstalled]);

    const registerPasskey = async () => {
        setIsLoading(prev => ({ ...prev, register: true }));
        try {
            const webAuthnKey = await toWebAuthnKey({
                passkeyName: passkeyName,
                mode: WebAuthnMode.Register,
            })

            const passkeyValidator = await toPasskeyValidator({
                // @ts-ignore
                account: nexusClient?.account,
                webAuthnKey,
            })

            const formattedWebAuthnKey = {
                pubX: webAuthnKey.pubX.toString(),
                pubY: webAuthnKey.pubY.toString(),
                authenticatorId: webAuthnKey.authenticatorId,
                authenticatorIdHash: webAuthnKey.authenticatorIdHash,
            }

            // store webAuthnKey in localStorage
            localStorage.setItem('webAuthnKey', JSON.stringify(formattedWebAuthnKey));

            setPasskeyValidator(passkeyValidator);
            setActivePasskeyName(passkeyName);
            localStorage.setItem('activePasskeyName', passkeyName);
            toast.success(`Using passkey for ${passkeyName}`, {
                position: 'bottom-right'
            });

            // reInstallPasskeyValidator(passkeyValidator?.initData);
        } catch (error) {
            console.error("Error registering passkey:", error);
            toast.error('Failed to register passkey');
        } finally {
            setIsLoading(prev => ({ ...prev, register: false }));
        }
    }

    const loginPasskey = async () => {
        setIsLoading(prev => ({ ...prev, login: true }));
        try {
            const webAuthnKey = await toWebAuthnKey({
                mode: WebAuthnMode.Login,
            })

            const passkeyValidator = await toPasskeyValidator({
                // @ts-ignore
                account: nexusClient?.account,
                webAuthnKey,
            })

            const formattedWebAuthnKey = {
                pubX: webAuthnKey.pubX.toString(),
                pubY: webAuthnKey.pubY.toString(),
                authenticatorId: webAuthnKey.authenticatorId,
                authenticatorIdHash: webAuthnKey.authenticatorIdHash,
            }

            // store webAuthnKey in localStorage
            localStorage.setItem('webAuthnKey', JSON.stringify(formattedWebAuthnKey));

            setPasskeyValidator(passkeyValidator);
            setActivePasskeyName(passkeyName);
            localStorage.setItem('activePasskeyName', passkeyName);
            toast.success(`Using passkey for ${passkeyName}`, {
                position: 'bottom-right'
            });
        } catch (error) {
            console.error("Error logging in with passkey:", error);
            toast.error('Failed to login with passkey');
        } finally {
            setIsLoading(prev => ({ ...prev, login: false }));
        }
    }

    const installPasskeyValidator = async () => {
        setIsLoading(prev => ({ ...prev, install: true }));
        if (!passkeyValidator) {
            toast.error('Passkey not initialized');
            return;
        }
        try {
            const userOpHash = await nexusClient?.installModule({
                module: {
                    address: PASSKEY_VALIDATOR_ADDRESS,
                    type: "validator",
                    initData: passkeyValidator?.initData
                },
            })
            const receipt = await nexusClient?.waitForUserOperationReceipt({ hash: userOpHash as Hex });
            setIsPasskeyInstalled(true);
        } catch (error) {
            console.error("Error installing passkey validator:", error);
            toast.error('Failed to install passkey validator');
        } finally {
            setIsLoading(prev => ({ ...prev, install: false }));
        }
    }

    const uninstallPasskeyValidator = async () => {
        setIsLoading(prev => ({ ...prev, uninstall: true }));
        try {
            const userOpHash = await nexusClient?.uninstallModule({
                module: {
                    address: PASSKEY_VALIDATOR_ADDRESS,
                    type: "validator",
                    deInitData: "0x"
                }
            })
            await nexusClient?.waitForUserOperationReceipt({ hash: userOpHash as Hex });
            setIsPasskeyInstalled(false);
            setActivePasskeyName("");

            // Clear from localStorage
            localStorage.removeItem('webAuthnKey');
        } catch (error) {
            console.error("Error uninstalling passkey validator:", error);
            toast.error('Failed to uninstall passkey validator');
        } finally {
            setIsLoading(prev => ({ ...prev, uninstall: false }));
        }
    }

    const getInstalledValidators = async () => {
        const installedModules = await nexusClient?.getInstalledValidators();
        setInstalledValidators([...(installedModules?.[0] ?? [K1_VALIDATOR])]);
    }

    const sendUserOpWithPasskeyValidator = async () => {
        setIsLoading(prev => ({ ...prev, sendOp: true }));
        try {
            if (!nexusClient || !passkeyValidator) {
                throw new Error("Nexus client or passkey validator not initialized");
            }

            let nexusClientWithPasskeyValidator = nexusClient.extend(moduleActivator(passkeyValidator))
            let hash = await nexusClientWithPasskeyValidator.sendUserOperation({
                calls: [
                    {
                        to: recipient,
                        value: BigInt(0)
                    }
                ],
            })
            toast.success('User operation sent successfully', {
                position: 'bottom-right'
            });

            const receipt = await nexusClientWithPasskeyValidator.waitForUserOperationReceipt({ hash: hash });

            toast.success(
                <div>
                    Transaction confirmed!
                    <a
                        href={`https://sepolia.basescan.org/tx/${receipt.receipt.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 ml-2"
                    >
                        View on BaseScan
                    </a>
                </div>,
                {
                    position: 'bottom-right',
                    duration: 5000
                }
            );
        } catch (error) {
            console.error("Error sending user operation:", error);
            toast.error('Failed to send user operation');
        } finally {
            setIsLoading(prev => ({ ...prev, sendOp: false }));
        }
    }

    return (
        <>
            <style jsx global>{`
                body {
                    margin: 0;
                    padding: 0;
                    font-family: monospace;
                }

                * {
                    box-sizing: border-box;
                }

                .bg-gradient {
                    background: linear-gradient(to bottom right, #1a1a1a, #000000);
                    min-height: 100vh;
                    color: white;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .container {
                    max-width: 64rem;
                    width: 100%;
                    background: #1f2937;
                    border-radius: 0.75rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    padding: 2rem;
                }

                .flex-col {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    align-items: center;
                }

                .card {
                    width: 100%;
                    max-width: 28rem;
                    background: #111827;
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .card-title {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    color: #60a5fa;
                }

                .active-passkey {
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    background: rgba(59, 130, 246, 0.2);
                    border-radius: 0.5rem;
                }

                .active-passkey p {
                    color: #93c5fd;
                    font-weight: bold;
                    margin: 0;
                }

                .input-group {
                    margin-bottom: 1rem;
                }

                .input-label {
                    display: block;
                    font-size: 0.875rem;
                    color: #d1d5db;
                    margin-bottom: 0.5rem;
                }

                .input {
                    width: 100%;
                    padding: 0.5rem 1rem;
                    background: #374151;
                    border: 1px solid #4b5563;
                    border-radius: 0.5rem;
                    color: white;
                    outline: none;
                }

                .input:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
                }

                .button {
                    width: 100%;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    border: none;
                    cursor: pointer;
                    margin-top: 0.75rem;
                }

                .button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .button-blue {
                    background: #3b82f6;
                    color: white;
                }

                .button-blue:hover:not(:disabled) {
                    background: #2563eb;
                    transform: scale(1.05);
                }

                .button-purple {
                    background: #8b5cf6;
                    color: white;
                }

                .button-purple:hover:not(:disabled) {
                    background: #7c3aed;
                    transform: scale(1.05);
                }

                .button-green {
                    background: #10b981;
                    color: white;
                }

                .button-green:hover:not(:disabled) {
                    background: #059669;
                    transform: scale(1.05);
                }

                .button-red {
                    background: #ef4444;
                    color: white;
                }

                .button-red:hover:not(:disabled) {
                    background: #dc2626;
                    transform: scale(1.05);
                }

                .button-yellow {
                    background: #f59e0b;
                    color: white;
                }

                .button-yellow:hover:not(:disabled) {
                    background: #d97706;
                    transform: scale(1.05);
                }

                .spinner {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid white;
                    border-bottom-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .validator-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .validator-item {
                    padding: 1rem;
                    background: #1f2937;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: background-color 0.2s;
                }

                .validator-item:hover {
                    background: #374151;
                }

                .validator-link {
                    color: #d1d5db;
                    text-decoration: none;
                    font-family: monospace;
                    font-size: 0.875rem;
                }

                .validator-link:hover {
                    color: #60a5fa;
                }

                .badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: white;
                }

                .badge-blue {
                    background: #3b82f6;
                }

                .badge-green {
                    background: #10b981;
                }
            `}</style>
            <div className="bg-gradient">
                <div className="container">
                    <div className="main-card">
                        <div className="flex-col">
                            <div className="card">
                                <h2 className="card-title">Passkey Management</h2>
                                {activePasskeyName && passkeyValidator && (
                                    <div className="active-passkey">
                                        <p>Passkey is active</p>
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">
                                        Passkey Username
                                    </label>
                                    <input
                                        type="text"
                                        value={passkeyName}
                                        onChange={(e) => setPasskeyName(e.target.value)}
                                        className="input"
                                        placeholder="Enter a name for your passkey"
                                    />
                                </div>
                                <div className="flex-col">
                                    <button
                                        onClick={registerPasskey}
                                        disabled={isLoading.register}
                                        className="button button-blue"
                                    >
                                        {isLoading.register ? (
                                            <div className="spinner" />
                                        ) : "Create new passkey"}
                                    </button>
                                    {!passkeyValidator && (
                                        <button
                                            onClick={loginPasskey}
                                            disabled={isLoading.login}
                                            className="button button-purple"
                                        >
                                            {isLoading.login ? (
                                                <div className="spinner" />
                                            ) : "Use existing passkey"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="card">
                                <h2 className="card-title">Nexus Actions</h2>
                                {isPasskeyInstalled === false ? (
                                    <button
                                        onClick={() => installPasskeyValidator()}
                                        // disabled={isLoading.install || !activePasskeyName}
                                        className="button button-green"
                                    >
                                        {isLoading.install ? (
                                            <div className="spinner" />
                                        ) : "Install Passkey"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => uninstallPasskeyValidator()}
                                        disabled={isLoading.uninstall}
                                        className="button button-red"
                                    >
                                        {isLoading.uninstall ? (
                                            <div className="spinner" />
                                        ) : "Uninstall Passkey Module"}
                                    </button>
                                )}
                                <button
                                    onClick={() => sendUserOpWithPasskeyValidator()}
                                    disabled={isLoading.sendOp || !activePasskeyName}
                                    className="button button-yellow"
                                >
                                    {isLoading.sendOp ? (
                                        <div className="spinner" />
                                    ) : "Send UserOp"}
                                </button>
                            </div>

                            <div className="card">
                                <h2 className="card-title">Installed Validators</h2>
                                {installedValidators && (
                                    <ul className="validator-list">
                                        {installedValidators.map((validator) => (
                                            <li key={validator} className="validator-item">
                                                <a href={`https://sepolia.basescan.org/address/${validator}`} target="_blank" rel="noopener noreferrer" className="validator-link">
                                                    {validator.slice(0, 6)}...{validator.slice(-4)}
                                                </a>
                                                {validator === "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06" &&
                                                    <span className="badge badge-blue">Passkey</span>
                                                }
                                                {validator === "0x00000004171351c442B202678c48D8AB5B321E8f" &&
                                                    <span className="badge badge-green">K1</span>
                                                }
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    )
}