'use client'

import { useAccount, useBalance, UseBalanceReturnType, useConnect, useGasPrice, useWalletClient } from 'wagmi'
import { baseSepolia } from 'viem/chains';
import { useEffect, useState } from 'react';
import { UserOperationReceipt, WaitForUserOperationReceiptReturnType } from 'viem/account-abstraction';
import { Hex, encodeFunctionData, TransactionReceipt, http, toFunctionSelector } from 'viem';
import Header from '@/components/Header';
import AccountInfo from '@/components/AccountInfo';
import { Module } from './types/module';
import { createBicoPaymasterClient, createNexusClient, createNexusSessionClient, CreateSessionDataParams, grantPermission, NexusClient, smartSessionCreateActions, smartSessionUseActions, toSmartSessionsValidator, usePermission } from '@biconomy/sdk';
import { privateKeyToAccount } from 'viem/accounts';
import PolicyBuilder from '@/components/PolicyBuilder';
import { SMART_SESSION_VALIDATOR, validationModules, MOCK_EXCHANGE, COUNTER_ADDRESS } from '@/utils/constants/addresses';
import { SessionInfo } from './types/smartSessions';
import { MOCK_EXCHANGE_ABI } from '@/utils/constants/abis/mockExchange';

function App() {
  const account = useAccount()
  const { data: walletClient } = useWalletClient({ account: account.address })
  const { connect, status, error } = useConnect()
  const gasPrice = useGasPrice()

  const [nexusClient, setNexusClient] = useState<NexusClient | null>(null);
  const [installedValidators, setInstalledValidators] = useState<{ name: string; isActive: boolean; address: string }[] | null>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTopUp, setIsLoadingTopUp] = useState(false);
  const [isLoadingCreateSession, setIsLoadingCreateSession] = useState(false);
  const [hasPaymaster, setHasPaymaster] = useState(false);

  const { data: smartAccountBalance }: UseBalanceReturnType = useBalance({
    address: nexusClient?.account.address,
  })

  const [receipt, setReceipt] = useState<TransactionReceipt | UserOperationReceipt | WaitForUserOperationReceiptReturnType | null>(null);

  const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;

  const [activeValidationModule, setActiveValidationModule] = useState<Module | null>({ name: 'K1 Validator', address: '0x6854688d3D9A87a33Addd5f4deB5cea1B97fa5b7', isActive: true });

  const [showSessionConfirmModal, setShowSessionConfirmModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string | undefined>(undefined);
  const [permissionId, setPermissionId] = useState<Hex | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [sessionRequestedInfo, setSessionRequestedInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    if (!permissionId) {
      setPermissionId(localStorage.getItem('permissionId') as Hex)
    }
  }, [account])

  useEffect(() => {
    let nexusClient;
    const initNexusClient = async () => {
      if (!walletClient) return;
      try {
        const hasPaymaster = !!process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL;
        setHasPaymaster(hasPaymaster);

        nexusClient = await createNexusClient({
          signer: walletClient,
          chain: baseSepolia,
          index: BigInt(8),
          transport: http("https://base-sepolia-rpc.publicnode.com	"),
          bundlerTransport: http(bundlerUrl),
          paymaster: process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL ? createBicoPaymasterClient({
            paymasterUrl: process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL
          }) : undefined
        });
        setNexusClient(nexusClient);
        const isDeployed = await nexusClient.account.isDeployed();
        setIsDeployed(isDeployed)
      } catch (error) {
        console.error("Error initializing Nexus client:", error);
      }
    };
    if (account.status === 'connected') {
      initNexusClient();
    }
  }, [account, connect, walletClient]);

  useEffect(() => {
    async function fetchInstalledValidators() {
      if (nexusClient) {
        if (isDeployed) {
          const [installedValidators, nextCursor] = await nexusClient.getInstalledValidators();
          if (installedValidators && installedValidators.length > 0) {

            let formattedValidators: { name: string; isActive: boolean; address: string }[] = [];
            validationModules.map((module) => {
              installedValidators.forEach((validator) => {
                if (validator.toLowerCase() == module.address.toLowerCase()) {
                  formattedValidators.push({
                    name: module.name,
                    isActive: true,
                    address: module.address
                  })
                }
              })
            })
            setInstalledValidators(formattedValidators)
          }
        }
      }
    }
    fetchInstalledValidators()
  }, [nexusClient, isDeployed, receipt, isLoading])

  const sendUserOp = async () => {
    setIsLoading(true)
    console.log(nexusClient, "nexusClient");
    const hash = await nexusClient?.sendTransaction({
      calls: [
        {
          to: "0x00000004171351c442B202678c48D8AB5B321E8f",
          data: "0x"
        }
      ]
    })

    const receipt = await nexusClient?.waitForTransactionReceipt({ hash })
    setReceipt(receipt)
    setIsLoading(false)
  }

  const createSession = async (sessionRequestedInfo: any) => {
    setIsLoadingCreateSession(true)
    if (!nexusClient) return;

    // setup attesters
    const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex)
    const smartSessionValidator = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: sessionAccount,
    });
    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(smartSessionValidator)
    )
    // const trustAttestersHash = await nexusSessionClient.trustAttesters()
    // const userOpReceipt = await nexusSessionClient.waitForUserOperationReceipt({
    //   hash: trustAttestersHash
    // })
    // const { status } = await nexusSessionClient?.waitForTransactionReceipt({
    //   hash: userOpReceipt.receipt.transactionHash
    // })

    console.log(sessionRequestedInfo, "sessionRequestedInfo");
    const createSessionsResponse = await nexusSessionClient.grantPermission(
      {
        account: nexusClient?.account,
        sessionRequestedInfo: [sessionRequestedInfo]
      }
    )
    const permissionIds = createSessionsResponse.permissionIds
    const permissionId = permissionIds[0]

    const receipt = await nexusClient?.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })
    setReceipt(receipt)
    console.log(sessionRequestedInfo, "sessionRequestedInfo");

    setSessionRequestedInfo(sessionRequestedInfo)
    setPermissionId(permissionId)
    localStorage.setItem('permissionId', permissionId);

    setIsLoadingCreateSession(false)
  }

  // const sendDummySessionUserOp = async () => {
  //   if (!nexusClient) return;
  //   setIsLoading(true)
  //   const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex)
  //   const smartSessionValidator = toSmartSessionsValidator({
  //     account: nexusClient.account,
  //     signer: sessionAccount,
  //   });
  //   const nexusSessionClient = nexusClient.extend(
  //     smartSessionCreateActions(smartSessionValidator)
  //   )

  //   const sessionRequestedInfo: CreateSessionDataParams[] = [
  //     {
  //       sessionPublicKey: sessionAccount.address, // session key signer
  //       actionPoliciesInfo: [
  //         {
  //           contractAddress: COUNTER_ADDRESS, // counter address
  //           functionSelector: "0x273ea3e3" as Hex // function selector for increment count
  //         }
  //       ]
  //     }
  //   ]

  //   const createSessionsResponse = await nexusSessionClient.grantPermission({
  //     sessionRequestedInfo
  //   })
  // }

  const sendUserOpWithSmartSessionTest = async () => {
    if (!nexusClient) return;
    setIsLoading(true)
    const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex)

    const smartSessionValidator = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: sessionAccount,
      moduleData: {
        permissionId: permissionId as Hex,
      }
    });

    const nexusSessionClient = await createNexusSessionClient({
      chain: baseSepolia,
      index: BigInt(8),
      paymaster: process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL ? createBicoPaymasterClient({
        paymasterUrl: process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL
      }) : undefined,
      accountAddress: nexusClient.account.address, // this will the the user's SA address
      signer: sessionAccount, // session signer
      transport: http("https://base-sepolia-rpc.publicnode.com"),
      bundlerTransport: http(bundlerUrl),
      module: smartSessionValidator
    })
    const useSmartSessionNexusClient = nexusSessionClient.extend(smartSessionUseActions(smartSessionValidator));
    console.log(toFunctionSelector("function test() external"), "function selector 2");
    const userOpHash = await useSmartSessionNexusClient.usePermission({
      actions: [
        {
          target: MOCK_EXCHANGE, // we pick the first action policy
          value: BigInt(0),
          callData: encodeFunctionData({
            abi: MOCK_EXCHANGE_ABI,
            functionName: toFunctionSelector("function test() external"),
          })
        }
      ],
    })

    const receipt = await nexusSessionClient?.waitForUserOperationReceipt({
      hash: userOpHash
    })
    setReceipt(receipt)
    setIsLoading(false)
  }

  const sendUserOpWithSmartSessionBuyApples = async () => {
    if (!nexusClient) return;
    setIsLoading(true)
    const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex)

    const smartSessionValidator = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: sessionAccount,
      moduleData: {
        permissionId: permissionId as Hex,
      }
    });

    const nexusSessionClient = await createNexusSessionClient({
      chain: baseSepolia,
      index: BigInt(8),
      paymaster: process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL ? createBicoPaymasterClient({
        paymasterUrl: process.env.NEXT_PUBLIC_BICO_PAYMASTER_URL
      }) : undefined,
      accountAddress: nexusClient.account.address, // this will the the user's SA address
      signer: sessionAccount, // session signer
      transport: http("https://base-sepolia-rpc.publicnode.com"),
      bundlerTransport: http(bundlerUrl),
      module: smartSessionValidator
    })
    const useSmartSessionNexusClient = nexusSessionClient.extend(smartSessionUseActions(smartSessionValidator));
    console.log(toFunctionSelector("function test() external"), "function selector 2");
    const userOpHash = await useSmartSessionNexusClient.usePermission({
      actions: [
        {
          target: MOCK_EXCHANGE, // we pick the first action policy
          value: BigInt(10000),
          callData: encodeFunctionData({
            abi: MOCK_EXCHANGE_ABI,
            functionName: toFunctionSelector("function buyApple(uint256 appleAmount)"),
            args: [BigInt(1)]
          })
        }
      ],
    })

    const receipt = await nexusSessionClient?.waitForUserOperationReceipt({
      hash: userOpHash
    })
    setReceipt(receipt)
    setIsLoading(false)
  }

  const installModule = async () => {
    setIsLoading(true)
    try {
      if (!nexusClient) {
        return;
      };
      const userOpHash = await nexusClient.installModule({
        module: {
          address: SMART_SESSION_VALIDATOR,
          initData: "0x",
          deInitData: "0x",
          type: "validator"
        }
      });
      const receipt: WaitForUserOperationReceiptReturnType = await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
      setReceipt(receipt)
    } catch (error) {
      console.error("Error installing module:", error);
    } finally {
      setIsLoading(false)
    }
  }

  const uninstallModule = async () => {
    setIsLoading(true)
    try {
      if (!nexusClient) {
        return;
      };
      const userOpHash = await nexusClient.uninstallModule({
        module: {
          address: SMART_SESSION_VALIDATOR,
          type: "validator"
        }
      });
      const receipt: WaitForUserOperationReceiptReturnType = await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
      setReceipt(receipt)
    } catch (error) {
      console.error("Error installing module:", error);
    } finally {
      setIsLoading(false)
    }
  }

  if (account.status === "connected" && account.chainId !== baseSepolia.id) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white p-4 font-mono flex items-center justify-center">
        <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <Header />
          <div className="text-orange-400 animate-pulse text-center text-2xl p-10">
            You are not connected to <span className="font-bold text-blue-500">Base Sepolia</span>
          </div>
        </div>
      </div>
    );
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

  console.log('installedValidators', installedValidators);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white p-4 font-mono flex items-center justify-center">
      <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <Header />

        <div className="p-6 space-y-6">
          {
            nexusClient ? (
              <>
                {hasPaymaster && (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-md text-center mb-4">
                    🎉 Paymaster Active - Gas-free transactions enabled!
                  </div>
                )}
                <AccountInfo walletClient={walletClient} nexusClient={nexusClient} setActiveValidationModule={setActiveValidationModule} activeValidationModule={activeValidationModule} />
              </>
            ) : account.status === 'connected' ? (
              <div className="text-orange-400 animate-pulse text-center text-2xl">
                Loading Account Info... 🔥
              </div>
            ) : (
              <div className="text-orange-400 animate-pulse text-center text-2xl">
                Connect your wallet to continue...
              </div>
            )
          }
          <div>
            {!installedValidators?.some(validator => validator.address.toLowerCase() === SMART_SESSION_VALIDATOR.toLowerCase()) ? (
              <div className="flex space-x-4 flex-wrap">
                <button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                  onClick={() => installModule()}
                >
                  Install Smart Session
                </button>
              </div>
            ) : (
              <div className="flex space-x-4 flex-wrap">
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                  onClick={() => uninstallModule()}
                >
                  Uninstall Smart Session
                </button>
              </div>
            )}
            {/* <div className="flex space-x-4 flex-wrap">
              <button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                onClick={() => uninstallModule()}
              >
                Uninstall Smart Session
              </button>
            </div> */}
            {
              permissionId && (
                <button
                  className="flex-1 mt-5 ml-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                  onClick={() => {
                    localStorage.removeItem('permissionId')
                    setPermissionId(null)
                  }}
                >
                  Delete Local Session
                </button>
              )
            }
            {
              permissionId && (
                <div className="mt-5 flex-1 flex items-center space-x-2">
                  <button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                    onClick={sendUserOpWithSmartSessionBuyApples}
                  >
                    Buy apples for user
                  </button>
                  <button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                    onClick={sendUserOpWithSmartSessionTest}
                  >
                    Call another function
                  </button>
                </div>
              )
            }
          </div>
          <button onClick={sendUserOp}>Send User Op</button>
          {isLoadingCreateSession && (
            <div className="text-orange-400 animate-pulse text-center text-2xl">
              Creating session... please wait 🔥
            </div>
          )}

          {isLoading && (
            <div className="text-orange-400 animate-pulse text-center text-2xl">
              Executing operation... 🔥
            </div>
          )}

          {receipt && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-2xl mb-4 text-orange-400 font-semibold">Operation Completed! 🏆</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {'blockHash' in receipt && (
                  <div><strong className="text-orange-300">Block Hash:</strong> {receipt.blockHash.slice(0, 10)}...</div>
                )}
                {'blockNumber' in receipt && (
                  <div><strong className="text-orange-300">Block Number:</strong> {receipt.blockNumber.toString()}</div>
                )}
                {'contractAddress' in receipt && receipt.contractAddress && (
                  <div>
                    <strong className="text-orange-300">Contract Address:</strong>
                    <button
                      onClick={() => navigator.clipboard.writeText(receipt.contractAddress as string)}
                      className="ml-2 text-white hover:text-orange-300 transition-colors"
                    >
                      {receipt.contractAddress.slice(0, 10)}... (Click to copy)
                    </button>
                  </div>
                )}
                {'gasUsed' in receipt && (
                  <div><strong className="text-orange-300">Gas Used:</strong> {receipt.gasUsed.toString()}</div>
                )}
                {'gasUsed' in receipt && (
                  <div><strong className="text-orange-300">Spend on gas:</strong> {receipt.gasUsed * gasPrice?.data}</div>
                )}
                {'status' in receipt && (
                  <div><strong className="text-orange-300">Status:</strong> {receipt.status === 'success' ? '✅ Success' : '❌ Failed'}</div>
                )}
                {'transactionHash' in receipt && (
                  <div>
                    <strong className="text-orange-300">Transaction Hash:</strong>
                    <button
                      onClick={() => navigator.clipboard.writeText(receipt.transactionHash)}
                      className="ml-2 text-white hover:text-orange-300 transition-colors"
                    >
                      {receipt.transactionHash.slice(0, 10)}... (Click to copy)
                    </button>
                  </div>
                )}
                {'userOpHash' in receipt && (
                  <div>
                    <strong className="text-orange-300">User Operation Hash:</strong>
                    <button
                      onClick={() => window.open(`https://dashboard.tenderly.co/tx/base-sepolia/${receipt.receipt.transactionHash}`)}
                      className="ml-2 text-white hover:text-orange-300 transition-colors"
                    >
                      {receipt.userOpHash.slice(0, 10)}... (View on Tenderly)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* {showSessionConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-gray-800 p-6 rounded-lg w-auto max-w-lg">
                <h3 className="text-2xl mb-4 text-orange-400 font-semibold">Confirm Session Creation</h3>
                <p className="text-white mb-4">
                  This session will allow the following actions:
                </p>
                <ul className="list-disc list-inside text-white mb-4">
                  <li className="break-all">Increment counter at address 0x14e4829E655F0b3a1793838dDd47273D5341d416</li>
                  <li>No value limit</li>
                  <li>No time restrictions</li>
                  <li>No expiration date</li>

                  Session id will be stored in local storage.
                </ul>
                <div className="flex justify-between">
                  <button
                    onClick={handleConfirmSession}
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowSessionConfirmModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )} */}

          {status === 'success' && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg animate-bounce" style={{ animation: 'bounce 1s, fadeOut 1s 2s forwards' }}>
              Wallet successfully connected! 🎉
            </div>
          )}
          {status === 'pending' && (
            <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-md shadow-lg animate-pulse" style={{ animation: 'pulse 2s infinite, fadeOut 1s 2s forwards' }}>
              Connecting wallet... ⏳
            </div>
          )}
          {error && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg" style={{ animation: 'fadeOut 1s 2s forwards' }}>
              Error: {error.message} ❌
            </div>
          )}
        </div>
      </div>
      <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
        <PolicyBuilder onSubmit={createSession} />
      </div>
    </div>
  )
}

export default App
