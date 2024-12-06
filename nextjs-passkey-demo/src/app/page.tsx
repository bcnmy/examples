'use client'

import { useAccount, useWalletClient, useConnect, http } from 'wagmi'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { createNexusClient, NexusClient, createBicoPaymasterClient } from '@biconomy/sdk'
import { baseSepolia } from 'wagmi/chains'
import Header from '@/components/Header'
import { K1_VALIDATOR, PASSKEY_VALIDATOR_ADDRESS } from '@/utils/constants/addresses'
import { toWebAuthnKey, toPasskeyValidator, WebAuthnMode } from '@biconomy/passkey'
import { Hex, Address } from 'viem'

const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;

export default function Passkey() {
  const account = useAccount()
  const { connect } = useConnect()
  const { data: walletClient } = useWalletClient({ account: account.address })
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
      if (!walletClient) return;
      try {
        nexusClient = await createNexusClient({
          // @ts-ignore
          signer: walletClient,
          chain: baseSepolia,
          index: BigInt(8),
          paymaster: createBicoPaymasterClient({
            paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || "",
          }),
          transport: http(),
          bundlerTransport: http(bundlerUrl),
        });
        setNexusClient(nexusClient);
        const isInstalled = await nexusClient?.isModuleInstalled({ module: { address: PASSKEY_VALIDATOR_ADDRESS, type: "validator" } });
        setIsPasskeyInstalled(isInstalled);
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
    if (account.status === 'connected') {
      initNexusClient();
    }
  }, [account, connect, walletClient]);

  useEffect(() => {
    if (nexusClient) {
      getInstalledValidators();
    }
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
    try {
      const userOpHash = await nexusClient?.installModule({
        module: {
          address: PASSKEY_VALIDATOR_ADDRESS,
          type: "validator",
          initData: passkeyValidator?.initData
        },
      })
      await nexusClient?.waitForUserOperationReceipt({ hash: userOpHash as Hex });
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
      let nexusClientWithPasskeyValidator: NexusClient;
      const cachedWebAuthnKey = localStorage.getItem('webAuthnKey');
      nexusClientWithPasskeyValidator = await createNexusClient({
        // @ts-ignore
        signer: walletClient,
        chain: baseSepolia,
        index: BigInt(8),
        paymaster: createBicoPaymasterClient({
          paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || "",
        }),
        transport: http(),
        module: passkeyValidator,
        bundlerTransport: http(bundlerUrl),
      });
      let hash = await nexusClientWithPasskeyValidator.sendTransaction({
        calls: [
          {
            to: account.address as Address,
            value: BigInt(0)
          }
        ],
      })
      toast.success('User operation sent successfully', {
        position: 'bottom-right'
      });

      const receipt = await nexusClientWithPasskeyValidator.waitForTransactionReceipt({ hash: hash });

      toast.success(
        <div>
          Transaction confirmed!
          <a
            href={`https://sepolia.basescan.org/tx/${receipt.transactionHash}`}
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

  if (account.status === "disconnected") {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white p-4 font-mono flex items-center justify-center">
        <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <Header />
          <div className="text-orange-400 animate-pulse text-center text-2xl p-10">
            Connect your wallet to <span className="font-bold text-blue-500">Base Sepolia</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white p-4 font-mono flex items-center justify-center">
      <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-8">
        <div className="flex flex-col gap-6 items-center">
          <div className="w-full max-w-md">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-blue-400 mb-4">Passkey Management</h2>
              {activePasskeyName && passkeyValidator && (
                <div className="mb-4 p-3 bg-blue-500/20 rounded-lg">
                  <p className="text-blue-300"><span className="font-bold">{"Passkey is active"}</span></p>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="passkeyName" className="block text-sm font-medium text-gray-300 mb-2">
                  Passkey Username
                </label>
                <input
                  type="text"
                  id="passkeyName"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter a name for your passkey"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => registerPasskey()}
                  disabled={isLoading.register}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading.register ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  Create new passkey
                </button>
                {
                  !passkeyValidator && (
                    <button
                      onClick={() => loginPasskey()}
                      disabled={isLoading.login}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading.login ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      Use existing passkey
                    </button>
                  )
                }
              </div>
            </div>
          </div>

          <div className="w-full max-w-md">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-green-400 mb-4">Nexus Actions</h2>
              {isPasskeyInstalled === false ? (
                <button
                  onClick={() => installPasskeyValidator()}
                  // disabled={isLoading.install || !activePasskeyName}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading.install ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  )}
                  Install Passkey {activePasskeyName || passkeyValidator ? `(${activePasskeyName || "Unkown or outdated"})` : "(Select a passkey first)"}
                </button>
              ) : (
                <button
                  onClick={() => uninstallPasskeyValidator()}
                  disabled={isLoading.uninstall}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading.uninstall ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  )}
                  Uninstall Passkey Module
                </button>
              )}
              <button
                onClick={() => sendUserOpWithPasskeyValidator()}
                disabled={isLoading.sendOp || !activePasskeyName}
                className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading.sendOp ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                Send UserOp
              </button>
            </div>
          </div>

          <div className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Installed Validators
            </h3>
            {installedValidators && (
              <ul className="space-y-3">
                {installedValidators.map((validator) => (
                  <li key={validator} className="p-4 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors">
                    <a href={`https://sepolia.basescan.org/address/${validator}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 font-mono text-sm break-all hover:text-blue-400">
                      {validator.slice(0, 6)}...{validator.slice(-4)}
                    </a>
                    {validator === "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06" &&
                      <span className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-full font-semibold">
                        Passkey
                      </span>
                    }
                    {validator === "0x00000004171351c442B202678c48D8AB5B321E8f" &&
                      <span className="ml-2 px-3 py-1 text-sm bg-green-500 text-white rounded-full font-semibold">K1 </span>
                    }
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}